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
        pc.name as category
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
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
    try {
        const {
            name, description, ean, sale_price, cost_price,
            stock_quantity, min_stock, max_stock, unit,
            category_id, supplier_id, is_active = true
        } = req.body;

        // Validações básicas
        if (!name || !sale_price) {
            return res.status(400).json({ error: 'Nome e preço de venda são obrigatórios' });
        }

        const result = await pool.query(`
            INSERT INTO products (
                name, description, ean, sale_price, cost_price,
                stock_quantity, min_stock, max_stock, unit,
                category_id, supplier_id, is_active,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            name, description, ean || null, sale_price, cost_price || 0,
            stock_quantity || 0, min_stock || 0, max_stock || null, unit || 'UN',
            category_id || null, supplier_id || null, is_active
        ]);

        res.status(201).json({
            message: 'Produto criado com sucesso',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro ao criar produto: ' + error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, ean, sale_price, cost_price,
            stock_quantity, min_stock, max_stock, unit,
            category_id, supplier_id, is_active
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
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $13
            RETURNING *
        `, [
            name, description, ean, sale_price, cost_price,
            stock_quantity, min_stock, max_stock, unit,
            category_id, supplier_id, is_active, id
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
