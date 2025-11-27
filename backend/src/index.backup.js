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
// ESTATÍSTICAS - STATISTICS
// ============================================

// GET /api/statistics/summary - Resumo para dashboard
app.get('/api/statistics/summary', async (req, res) => {
    try {
        // 1. Vendas de hoje
        const salesToday = await pool.query(`
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(total), 0) as total
            FROM sales
            WHERE DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
              AND status = 'completed'
        `);

        // 2. Produtos com baixo estoque
        const lowStock = await pool.query(`
            SELECT COUNT(*) as count
            FROM products
            WHERE stock_quantity <= min_stock 
              AND stock_quantity > 0
              AND is_active = true
        `);

        // 3. Produtos sem estoque
        const outOfStock = await pool.query(`
            SELECT COUNT(*) as count
            FROM products
            WHERE stock_quantity = 0
              AND is_active = true
        `);

        // 4. Alertas de estoque (top produtos em falta)
        const alerts = await pool.query(`
            SELECT 
                name as product_name,
                stock_quantity as stock,
                min_stock
            FROM products
            WHERE stock_quantity <= min_stock
              AND is_active = true
            ORDER BY stock_quantity ASC
            LIMIT 5
        `);

        res.json({
            sales_today: {
                total: parseFloat(salesToday.rows[0].total) || 0,
                count: parseInt(salesToday.rows[0].count) || 0
            },
            low_stock_count: parseInt(lowStock.rows[0].count) || 0,
            out_of_stock_count: parseInt(outOfStock.rows[0].count) || 0,
            alerts: alerts.rows.map(a => ({
                type: a.stock === 0 ? 'out_of_stock' : 'low_stock',
                product_name: a.product_name,
                stock: parseInt(a.stock),
                min_stock: parseInt(a.min_stock)
            }))
        });
    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// GET /api/statistics/top-products - Top produtos mais vendidos
app.get('/api/statistics/top-products', async (req, res) => {
    try {
        const { period = 7 } = req.query; // dias (7, 30, 90)

        const result = await pool.query(`
            SELECT 
                p.name as product_name,
                SUM(si.quantity) as total_sold,
                SUM(si.total) as revenue
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            WHERE s.created_at >= NOW() - INTERVAL '${parseInt(period)} days'
              AND s.status = 'completed'
            GROUP BY p.id, p.name
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        res.json(result.rows.map(row => ({
            product_name: row.product_name,
            total_sold: parseInt(row.total_sold),
            revenue: parseFloat(row.revenue)
        })));
    } catch (error) {
        console.error('❌ Erro ao buscar top produtos:', error);
        res.status(500).json({ error: 'Erro ao buscar top produtos' });
    }
});
// ENDPOINTS DE MOVIMENTAÇÕES DE ESTOQUE
// Adicionar ANTES da seção "VENDAS - SALES" no index.js (linha ~310)

// ============================================
// MOVIMENTAÇÕES DE ESTOQUE - STOCK MOVEMENTS
// ============================================

// POST /api/stock-movements - Entrada manual de estoque
app.post('/api/stock-movements', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { product_id, type: typeRaw, quantity, cost_price, notes, user_id } = req.body;
        const type = typeRaw?.toUpperCase(); // Normalizar para MAIÚSCULAS (IN, OUT, ADJUSTMENT)

        // Validações básicas
        if (!product_id || !type || !quantity) {
            return res.status(400).json({ error: 'Campos obrigatórios: product_id, type, quantity' });
        }

        if (type === 'IN' && !cost_price) {
            return res.status(400).json({ error: 'cost_price é obrigatório para entrada de estoque' });
        }

        // 1. Buscar produto atual
        const productResult = await client.query(`
            SELECT 
                id, name, stock_quantity, cost_price,
                last_cost, average_cost, sale_price, profit_margin
            FROM products
            WHERE id = $1
        `, [product_id]);

        if (productResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        const product = productResult.rows[0];
        const oldStock = parseFloat(product.stock_quantity) || 0;
        const oldAvgCost = parseFloat(product.average_cost) || parseFloat(product.cost_price) || 0;

        // 2. Calcular NOVO custo médio ponderado (somente para entradas)
        let newAvgCost = oldAvgCost;
        let newStock = oldStock;

        if (type === 'IN') {
            newStock = oldStock + parseInt(quantity);

            if (oldStock === 0) {
                // Se estoque zerado, custo médio = custo da entrada
                newAvgCost = parseFloat(cost_price);
            } else {
                // Fórmula do custo médio ponderado
                newAvgCost = (
                    (oldStock * oldAvgCost) + (parseInt(quantity) * parseFloat(cost_price))
                ) / newStock;
            }
        } else if (type === 'OUT') {
            newStock = oldStock - parseInt(quantity);
        } else if (type === 'ADJUSTMENT') {
            newStock = oldStock + parseInt(quantity);
        }

        // 3. Calcular margem atual
        const salePrice = parseFloat(product.sale_price);
        const targetMargin = parseFloat(product.profit_margin) || 50;
        const currentMargin = salePrice > 0 ? ((salePrice - newAvgCost) / salePrice) * 100 : 0;

        // 4. Registrar movimentação
        // CÓDIGO FALTANTE - Adicionar após "// 4. Registrar movimentação" (linha ~379)
        await client.query(`
                INSERT INTO stock_movements (
                    product_id, type, quantity, cost_price,
                    reference_type, user_id, notes, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `, [
            product_id,
            type,
            type === 'IN' ? quantity : -quantity,
            type === 'IN' ? cost_price : null,
            'manual_entry',
            user_id || null,
            notes || null
        ]);

        // 5. Atualizar produto
        await client.query(`
            UPDATE products SET
                stock_quantity = $1,
                last_cost = $2,
                average_cost = $3,
                updated_at = NOW()
            WHERE id = $4
        `, [
            newStock,
            type === 'IN' ? cost_price : product.last_cost,
            newAvgCost,
            product_id
        ]);

        await client.query('COMMIT');

        // 6. Verificar margem e retornar alerta se necessário
        const response = {
            success: true,
            product_name: product.name,
            old_stock: oldStock,
            new_stock: newStock,
            old_average_cost: oldAvgCost,
            new_average_cost: newAvgCost,
            margin_alert: false
        };

        if (type === 'IN' && currentMargin < targetMargin) {
            const suggestedPrice = newAvgCost / (1 - (targetMargin / 100));

            response.margin_alert = true;
            response.current_price = salePrice;
            response.new_cost = newAvgCost;
            response.current_margin = parseFloat(currentMargin.toFixed(2));
            response.target_margin = targetMargin;
            response.suggested_price = parseFloat(suggestedPrice.toFixed(2));
            response.message = `Margem caiu para ${currentMargin.toFixed(1)}%. Sugerimos R$ ${suggestedPrice.toFixed(2)} para manter ${targetMargin}% de margem.`;
        }

        res.json(response);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao processar movimentação:', error);
        res.status(500).json({ error: 'Erro ao processar movimentação: ' + error.message });
    } finally {
        client.release();
    }
});

// GET /api/stock-movements - Histórico de movimentações
app.get('/api/stock-movements', async (req, res) => {
    try {
        const { product_id, type, start_date, end_date, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT 
                sm.id,
                sm.type,
                sm.quantity,
                sm.cost_price,
                sm.reference_type,
                sm.reference_id,
                sm.notes,
                sm.created_at,
                p.name as product_name,
                p.stock_quantity as current_stock
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 1;

        if (product_id) {
            query += ` AND sm.product_id = $${paramCount}`;
            params.push(product_id);
            paramCount++;
        }

        if (type) {
            query += ` AND sm.type = $${paramCount}`;
            params.push(type);
            paramCount++;
        }

        if (start_date) {
            query += ` AND DATE(sm.created_at) >= $${paramCount}`;
            params.push(start_date);
            paramCount++;
        }

        if (end_date) {
            query += ` AND DATE(sm.created_at) <= $${paramCount}`;
            params.push(end_date);
            paramCount++;
        }

        query += ` ORDER BY sm.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        res.json(result.rows.map(row => ({
            id: row.id,
            product_name: row.product_name,
            current_stock: parseInt(row.current_stock),
            type: row.type,
            quantity: parseInt(row.quantity),
            cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
            reference_type: row.reference_type,
            reference_id: row.reference_id,
            notes: row.notes,
            created_at: row.created_at
        })));

    } catch (error) {
        console.error('❌ Erro ao buscar movimentações:', error);
        res.status(500).json({ error: 'Erro ao buscar movimentações' });
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

// GET /api/sales/:id - Detalhes de uma venda
app.get('/api/sales/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscar venda
        const saleResult = await pool.query(`
            SELECT 
                s.id, s.sale_number, s.subtotal, s.discount, s.total,
                s.status, s.created_at,
                u.name as user_name
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = $1
        `, [id]);

        if (saleResult.rowCount === 0) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        const sale = saleResult.rows[0];

        // 2. Buscar itens da venda
        const itemsResult = await pool.query(`
            SELECT 
                si.id,
                si.quantity,
                si.unit_price,
                si.discount,
                si.total,
                p.name as product_name,
                p.sku
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = $1
            ORDER BY si.id
        `, [id]);

        //3. Buscar pagamentos
        const paymentsResult = await pool.query(`
            SELECT 
                payment_method,
                amount
            FROM sale_payments
            WHERE sale_id = $1
        `, [id]);

        // 4. Montar resposta
        res.json({
            id: sale.id,
            sale_number: sale.sale_number,
            subtotal: parseFloat(sale.subtotal),
            discount_amount: parseFloat(sale.discount),
            total_amount: parseFloat(sale.total),
            status: sale.status,
            created_at: sale.created_at,
            user_name: sale.user_name,
            items: itemsResult.rows.map(item => ({
                id: item.id,
                product_name: item.product_name,
                sku: item.sku,
                quantity: parseInt(item.quantity),
                unit_price: parseFloat(item.unit_price),
                discount: parseFloat(item.discount) || 0,
                total: parseFloat(item.total)
            })),
            payments: paymentsResult.rows.map(payment => ({
                payment_method: payment.payment_method,
                amount: parseFloat(payment.amount)
            }))
        });

    } catch (error) {
        console.error('❌ Erro ao buscar venda:', error);
        res.status(500).json({ error: 'Erro ao buscar venda' });
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
