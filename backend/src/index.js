import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// ============================================
// ROTAS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'ERP Pet Shop API está rodando!',
        timestamp: new Date().toISOString()
    });
});

// GET /api/products - Listar todos os produtos
app.get('/api/products', async (req, res) => {
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
});

// GET /api/categories - Listar categorias
app.get('/api/categories', async (req, res) => {
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
});

// POST /api/products - Criar novo produto
app.post('/api/products', async (req, res) => {
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
});

// PUT /api/products/:id - Atualizar produto
app.put('/api/products/:id', async (req, res) => {
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
});

// DELETE /api/products/:id - Deletar produto (soft delete)
app.delete('/api/products/:id', async (req, res) => {
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
});

// ============================================
// VENDAS - SALES
// ============================================

// POST /api/sales - Criar nova venda
app.post('/api/sales', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { items, payment_method, discount_amount } = req.body;

        if (!items || items.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Itens são obrigatórios' });
        }
        if (!payment_method) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Método de pagamento é obrigatório' });
        }

        // Calcular totais
        const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        const total_discount = discount_amount || items.reduce((sum, item) => sum + (item.discount || 0), 0);
        const total_amount = subtotal - total_discount;

        // Gerar número da venda
        const saleNumberResult = await client.query('SELECT COALESCE(MAX(CAST(sale_number AS INTEGER)), 0) + 1 as next_number FROM sales WHERE sale_number ~ \'^[0-9]+$\'');
        const sale_number = saleNumberResult.rows[0].next_number.toString();

        // User ID - Admin PDV (usuário existente no banco)
        // TODO: Implementar autenticação e pegar user_id da sessão
        const user_id = 'e94460f4-6207-4156-918a-6e42b2978f6d';

        // ✅ INSERT sem payment_method (não existe na tabela sales)
        const saleResult = await client.query(`
            INSERT INTO sales (
                sale_number, subtotal, discount, total,
                status, user_id, synced
            ) VALUES ($1, $2, $3, $4, 'completed', $5, false)
            RETURNING *
        `, [sale_number, subtotal, total_discount, total_amount, user_id]);

        const sale = saleResult.rows[0];

        // Inserir forma de pagamento na tabela sale_payments
        await client.query(`
            INSERT INTO sale_payments (
                sale_id, payment_method, amount
            ) VALUES ($1, $2, $3)
        `, [sale.id, payment_method, total_amount]);

        // Inserir itens e atualizar estoque
        for (const item of items) {
            await client.query(`
                INSERT INTO sale_items (
                    sale_id, product_id, quantity, unit_price, discount, total
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                sale.id,
                item.product_id,
                item.quantity,
                item.unit_price,
                item.discount || 0,
                (item.unit_price * item.quantity) - (item.discount || 0)
            ]);

            await client.query(`
                UPDATE products
                SET stock_quantity = stock_quantity - $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [item.quantity, item.product_id]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Venda criada com sucesso',
            sale: {
                id: sale.id,
                sale_number: sale.sale_number,
                total: parseFloat(sale.total),
                payment_method: sale.payment_method
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao criar venda:', error);
        res.status(500).json({ error: 'Erro ao criar venda: ' + error.message });
    } finally {
        client.release();
    }
});

// GET /api/sales - Listar vendas
app.get('/api/sales', async (req, res) => {
    try {
        const { startDate, endDate, paymentMethod, search, limit = 50, offset = 0 } = req.query;

        let whereClause = '1=1';
        const params = [];
        let paramCount = 1;

        if (startDate) {
            params.push(startDate);
            whereClause += ` AND DATE(s.created_at AT TIME ZONE 'America/Sao_Paulo') >= $${paramCount}::date`;
            paramCount++;
        }

        if (endDate) {
            params.push(endDate);
            whereClause += ` AND DATE(s.created_at AT TIME ZONE 'America/Sao_Paulo') <= $${paramCount}::date`;
            paramCount++;
        }

        if (paymentMethod && paymentMethod !== 'all') {
            params.push(paymentMethod);
            whereClause += ` AND s.payment_method = $${paramCount}`;
            paramCount++;
        }

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND s.sale_number ILIKE $${paramCount}`;
            paramCount++;
        }

        params.push(parseInt(limit));
        const limitParam = paramCount;
        paramCount++;

        params.push(parseInt(offset));
        const offsetParam = paramCount;

        const result = await pool.query(`
            SELECT
                s.id,
                s.sale_number,
                s.subtotal,
                s.discount,
                s.total,
                s.status,
                s.created_at,
                COUNT(DISTINCT si.id) as item_count,
                STRING_AGG(DISTINCT sp.payment_method, ', ') as payment_method
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN sale_payments sp ON s.id = sp.sale_id
            WHERE ${whereClause}
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT $${limitParam} OFFSET $${offsetParam}
        `, params);

        const sales = result.rows.map(row => ({
            id: row.id,
            sale_number: parseInt(row.sale_number) || row.sale_number,
            subtotal: parseFloat(row.subtotal),
            discount_amount: parseFloat(row.discount),
            total_amount: parseFloat(row.total),
            payment_method: row.payment_method || 'N/A',
            status: row.status,
            created_at: row.created_at,
            item_count: parseInt(row.item_count)
        }));

        res.json(sales);
    } catch (error) {
        console.error('❌ Erro ao buscar vendas:', error);
        res.status(500).json({ error: 'Erro ao buscar vendas' });
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log('');
    console.log('🐾 ====================================');
    console.log('   ERP PET SHOP - BACKEND API');
    console.log('====================================');
    console.log(`🚀 Servidor: http://localhost:${PORT}`);
    console.log(`📦 Produtos: http://localhost:${PORT}/api/products`);
    console.log(`💰 Vendas: http://localhost:${PORT}/api/sales`);
    console.log('====================================');
    console.log('');
});
