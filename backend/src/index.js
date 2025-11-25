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
        p.ean as barcode,
        p.sale_price as price,
        p.stock_quantity as stock,
        p.unit,
        pc.name as category,
        p.is_active as active
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.is_active = true
      ORDER BY p.name
    `);

        // Formatar resposta para o formato esperado pelo frontend
        const products = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            price: parseFloat(row.price),
            category: row.category || 'Sem categoria',
            stock: parseInt(row.stock) || 0,
            barcode: row.barcode,
            unit: row.unit || 'UN',
        }));

        res.json(products);
    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
});

// GET /api/products/:id - Buscar produto por ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.ean as barcode,
        p.sale_price as price,
        p.cost_price,
        p.stock_quantity as stock,
        p.min_stock,
        p.unit,
        pc.name as category,
        p.is_active as active
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        const product = {
            id: result.rows[0].id,
            name: result.rows[0].name,
            description: result.rows[0].description,
            price: parseFloat(result.rows[0].price),
            costPrice: parseFloat(result.rows[0].cost_price),
            category: result.rows[0].category || 'Sem categoria',
            stock: parseInt(result.rows[0].stock) || 0,
            minStock: parseInt(result.rows[0].min_stock) || 0,
            barcode: result.rows[0].barcode,
            unit: result.rows[0].unit || 'UN',
            active: result.rows[0].active,
        };

        res.json(product);
    } catch (error) {
        console.error('❌ Erro ao buscar produto:', error);
        res.status(500).json({ error: 'Erro ao buscar produto' });
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

// POST /api/sales - Registrar nova venda
app.post('/api/sales', async (req, res) => {
    const client = await pool.connect();

    try {
        const { items, payment_method, total, discount = 0, customer_id = null } = req.body;

        // Validações básicas
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Venda deve ter pelo menos 1 item' });
        }

        if (!payment_method) {
            return res.status(400).json({ error: 'Forma de pagamento é obrigatória' });
        }

        await client.query('BEGIN');

        // 1. Verificar estoque de todos os produtos
        for (const item of items) {
            const stockCheck = await client.query(
                'SELECT stock_quantity, name FROM products WHERE id = $1',
                [item.product_id]
            );

            if (stockCheck.rows.length === 0) {
                throw new Error(`Produto ${item.product_id} não encontrado`);
            }

            const currentStock = parseFloat(stockCheck.rows[0].stock_quantity);
            if (currentStock < item.quantity) {
                throw new Error(`Estoque insuficiente para ${stockCheck.rows[0].name}. Disponível: ${currentStock}`);
            }
        }

        // 2. Criar a venda
        const saleResult = await client.query(`
      INSERT INTO sales (
        customer_id,
        subtotal,
        discount,
        total,
        status,
                id: saleId,
                total,
                payment_method,
                items_count: items.length,
                created_at: createdAt
            },
            message: 'Venda registrada com sucesso!'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao registrar venda:', error);
        res.status(500).json({
            error: error.message || 'Erro ao registrar venda'
        });
    } finally {
        client.release();
    }
});

// POST /api/customers - Cadastrar cliente
app.post('/api/customers', async (req, res) => {
    try {
        const { name, phone, cpf, email, address } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
        }

        const result = await pool.query(`
      INSERT INTO customers(name, phone, cpf, email, address, created_at)
      VALUES($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, phone, cpf, email
            `, [name, phone, cpf || null, email || null, address || null]);

        res.status(201).json({
            success: true,
            customer: result.rows[0],
            message: 'Cliente cadastrado com sucesso!'
        });

    } catch (error) {
        console.error('❌ Erro ao cadastrar cliente:', error);

        if (error.code === '23505' && error.constraint === 'customers_cpf_key') {
            return res.status(400).json({ error: 'CPF já cadastrado' });
        }

        res.status(500).json({ error: 'Erro ao cadastrar cliente' });
    }
});

// GET /api/customers - Buscar clientes
app.get('/api/customers', async (req, res) => {
    try {
        const { search } = req.query;

        let query = `
      SELECT id, name, phone, cpf, email
      FROM customers
      WHERE 1 = 1
            `;
        const params = [];

        if (search) {
            query += ` AND(name ILIKE $1 OR phone LIKE $1 OR cpf LIKE $1)`;
            params.push(`% ${ search } % `);
        }

        query += ` ORDER BY name LIMIT 50`;

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (error) {
        console.error('❌ Erro ao buscar clientes:', error);
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
});

// GET /api/sales - List vendas
app.get('/api/sales', async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(`
      SELECT 
        s.id,
            s.total,
            s.discount,
            s.status,
            s.created_at,
            c.name as customer_name,
            COUNT(si.id) as items_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id, c.name
      ORDER BY s.created_at DESC
      LIMIT $1 OFFSET $2
            `, [limit, offset]);

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Erro ao listar vendas:', error);
        res.status(500).json({ error: 'Erro ao listar vendas' });
    }
});

// GET /api/sales/reports/daily - Relatório de vendas do dia
app.get('/api/sales/reports/daily', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Total de vendas e receita
        const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_sales,
            COALESCE(SUM(total), 0) as total_revenue,
            COALESCE(SUM(discount), 0) as total_discount
      FROM sales
      WHERE DATE(created_at) = $1
      AND status = 'completed'
            `, [targetDate]);

        // Por forma de pagamento - removido pois payment_method não existe em sales
        const paymentMethods = {};

        // Produtos mais vendidos
        const topProductsResult = await pool.query(`
      SELECT 
        p.name,
            SUM(si.quantity) as quantity_sold,
            SUM(si.subtotal) as revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at) = $1
      AND s.status = 'completed'
      GROUP BY p.id, p.name
      ORDER BY quantity_sold DESC
      LIMIT 10
            `, [targetDate]);

        res.json({
            date: targetDate,
            total_sales: parseInt(summaryResult.rows[0].total_sales),
            total_revenue: parseFloat(summaryResult.rows[0].total_revenue),
            total_discount: parseFloat(summaryResult.rows[0].total_discount),
            payment_methods: paymentMethods,
            top_products: topProductsResult.rows
        });

    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório' });
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

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log('');
    console.log('🐾 ====================================');
    console.log('   ERP PET SHOP - BACKEND API');
    console.log('====================================');
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📦 Produtos: http://localhost:${PORT}/api/products`);
        console.log(`💰 Vendas: http://localhost:${PORT}/api/sales`);
        console.log(`👥 Clientes: http://localhost:${PORT}/api/customers`);
        console.log('====================================');
        console.log('');
    });
