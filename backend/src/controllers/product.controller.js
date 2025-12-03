import pool from '../db.js';

export const getAllProducts = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.ean,
        p.sale_price,
        p.cost_price,
        p.stock_quantity,
        p.min_stock,
        p.max_stock,
        p.unit,
        p.category_id,
        p.supplier_id,
        p.is_active,
        p.is_bulk,
        p.internal_code,
        p.sku,
        p.parent_product_id,
        p.conversion_factor,
        pc.name as category,
        parent.name as parent_name,
        (
            SELECT json_agg(json_build_object('id', child.id, 'name', child.name, 'stock_quantity', child.stock_quantity))
            FROM products child
            WHERE child.parent_product_id = p.id AND child.is_active = true
        ) as children
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN products parent ON p.parent_product_id = parent.id
      WHERE p.is_active = true
      ORDER BY p.name
    `);

        const products = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            ean: row.ean,
            sale_price: parseFloat(row.sale_price) || 0,
            cost_price: parseFloat(row.cost_price) || 0,
            stock_quantity: parseInt(row.stock_quantity) || 0,
            min_stock: parseInt(row.min_stock) || 0,
            max_stock: row.max_stock ? parseInt(row.max_stock) : null,
            unit: row.unit || 'UN',
            category_id: row.category_id,
            category: row.category || 'Sem categoria',
            supplier_id: row.supplier_id,
            is_active: row.is_active,
            internal_code: row.internal_code,
            sku: row.sku,
            // Bulk fields
            is_bulk: row.is_bulk,
            parent_product_id: row.parent_product_id,
            parent_name: row.parent_name,
            children: row.children || [],
            conversion_factor: row.conversion_factor,
            // Campos adicionais para compatibilidade com PDV
            price: parseFloat(row.sale_price) || 0,
            stock: parseInt(row.stock_quantity) || 0,
            barcode: row.ean
        }));

        res.json(products);
    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
};

export const getCategories = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT id, name, description
      FROM product_categories
      WHERE is_active = true
      ORDER BY name
    `);

        res.json(result.rows);
    } catch (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
};

export const createProduct = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            name, description, ean, sale_price, cost_price,
            stock_quantity, min_stock, max_stock, unit,
            category_id, supplier_id, is_active = true,
            internal_code, sku, // Added fields
            // Bulk specific fields
            create_bulk, bulk_conversion_factor, bulk_unit, bulk_price
        } = req.body;

        // Validações básicas
        if (!name || !sale_price) {
            return res.status(400).json({ error: 'Nome e preço de venda são obrigatórios' });
        }

        // 1. Criar produto pai
        const parentResult = await client.query(`
            INSERT INTO products (
                name, description, ean, sale_price, cost_price,
                stock_quantity, min_stock, max_stock, unit,
                category_id, supplier_id, is_active,
                internal_code, sku,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            name, description, ean || null, sale_price, cost_price || 0,
            stock_quantity || 0, min_stock || 0, max_stock || null, unit || 'UN',
            category_id || null, supplier_id || null, is_active,
            internal_code || null, sku || null
        ]);

        const parentProduct = parentResult.rows[0];

        // 2. Se solicitado, criar produto a granel (filho)
        let childProduct = null;
        if (create_bulk && bulk_conversion_factor) {
            const bulkName = `${name} (Granel)`;
            // Gerar código interno com prefixo G se houver EAN ou ID
            const internalCodeBulk = ean ? `G${ean}` : `G${parentProduct.id.substring(0, 8)}`;

            const childResult = await client.query(`
                INSERT INTO products (
                    name, description, internal_code, sale_price, cost_price,
                    stock_quantity, min_stock, unit,
                    category_id, supplier_id, is_active,
                    is_bulk, parent_product_id, conversion_factor,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *
            `, [
                bulkName,
                `Produto a granel derivado de: ${name}`,
                internalCodeBulk,
                bulk_price || 0,
                (cost_price || 0) / bulk_conversion_factor, // Custo proporcional
                0, // Estoque inicial zero
                0,
                bulk_unit || 'KG',
                category_id || null,
                supplier_id || null,
                true,
                true, // is_bulk
                parentProduct.id,
                bulk_conversion_factor
            ]);

            childProduct = childResult.rows[0];
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Produto criado com sucesso',
            product: parentProduct,
            bulk_product: childProduct
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro ao criar produto: ' + error.message });
    } finally {
        client.release();
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, ean, sale_price, cost_price,
            stock_quantity, min_stock, max_stock, unit,
            category_id, supplier_id, is_active,
            internal_code, sku
        } = req.body;

        const result = await pool.query(`
            UPDATE products SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                ean = COALESCE($3, ean),
                sale_price = COALESCE($4, sale_price),
                cost_price = COALESCE($5, cost_price),
                stock_quantity = COALESCE($6, stock_quantity),
                min_stock = COALESCE($7, min_stock),
                max_stock = $8,
                unit = COALESCE($9, unit),
                category_id = $10,
                supplier_id = $11,
                is_active = COALESCE($12, is_active),
                internal_code = COALESCE($13, internal_code),
                sku = COALESCE($14, sku),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $15
            RETURNING *
        `, [
            name, description, ean, sale_price, cost_price,
            stock_quantity, min_stock, max_stock, unit,
            category_id, supplier_id, is_active,
            internal_code, sku,
            id
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json({
            message: 'Produto atualizado com sucesso',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto: ' + error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE products 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, name
        `, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json({
            message: 'Produto desativado com sucesso',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erro ao deletar produto:', error);
        res.status(500).json({ error: 'Erro ao deletar produto: ' + error.message });
    }
};
