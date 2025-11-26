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
    console.log('====================================');
    console.log('');
});
