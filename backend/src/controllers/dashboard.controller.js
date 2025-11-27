import pool from '../db.js';

export const getSummary = async (req, res) => {
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
};

export const getTopProducts = async (req, res) => {
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
};
