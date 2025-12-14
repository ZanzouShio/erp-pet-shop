import pool from '../db.js';

export const getDiscountAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, operatorId, reason } = req.query;

        // Build WHERE clause
        let whereClause = 's.discount > 0';
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

        if (operatorId) {
            params.push(operatorId);
            whereClause += ` AND s.user_id = $${paramCount}`;
            paramCount++;
        }

        if (reason) {
            params.push(reason);
            whereClause += ` AND s.discount_reason = $${paramCount}`;
            paramCount++;
        }

        // 1. KPI Cards
        const kpiResult = await pool.query(`
            SELECT 
                COUNT(*) as total_sales_with_discount,
                SUM(s.discount) as total_discount,
                SUM(s.subtotal) as total_subtotal,
                AVG(s.total) as avg_ticket_with_discount,
                AVG(s.subtotal) as avg_ticket_no_discount,
                AVG(CASE WHEN s.subtotal > 0 THEN (s.discount / s.subtotal * 100) ELSE 0 END) as avg_discount_percent
            FROM sales s
            WHERE ${whereClause}
        `, params);

        // 2. Top Operador (maior % de desconto sobre suas vendas)
        const topOperatorResult = await pool.query(`
            SELECT 
                u.id,
                u.name,
                SUM(s.discount) as total_discount,
                SUM(s.subtotal) as total_sales,
                CASE WHEN SUM(s.subtotal) > 0 
                    THEN (SUM(s.discount) / SUM(s.subtotal) * 100) 
                    ELSE 0 
                END as discount_percent
            FROM sales s
            JOIN users u ON s.user_id = u.id
            WHERE ${whereClause}
            GROUP BY u.id, u.name
            ORDER BY discount_percent DESC
            LIMIT 1
        `, params);

        // 3. Ranking de operadores
        const operatorsResult = await pool.query(`
            SELECT 
                u.id,
                u.name,
                COUNT(s.id) as sale_count,
                SUM(s.discount) as total_discount,
                SUM(s.subtotal) as total_sales,
                CASE WHEN SUM(s.subtotal) > 0 
                    THEN (SUM(s.discount) / SUM(s.subtotal) * 100) 
                    ELSE 0 
                END as discount_percent
            FROM sales s
            JOIN users u ON s.user_id = u.id
            WHERE ${whereClause}
            GROUP BY u.id, u.name
            ORDER BY discount_percent DESC
        `, params);

        // 4. Descontos por motivo
        const reasonsResult = await pool.query(`
            SELECT 
                COALESCE(s.discount_reason, 'SEM_MOTIVO') as reason,
                COUNT(*) as count,
                SUM(s.discount) as total
            FROM sales s
            WHERE ${whereClause}
            GROUP BY s.discount_reason
            ORDER BY total DESC
        `, params);

        // 5. Descontos por categoria - REMOVIDO (estrutura de categorias diferente)
        const categoriesResult = { rows: [] };

        // 6. Descontos por hora do dia
        const hourlyResult = await pool.query(`
            SELECT 
                EXTRACT(HOUR FROM s.created_at AT TIME ZONE 'America/Sao_Paulo') as hour,
                COUNT(*) as count,
                SUM(s.discount) as total
            FROM sales s
            WHERE ${whereClause}
            GROUP BY hour
            ORDER BY hour
        `, params);

        // 7. Grid detalhado (últimas 100 vendas com desconto)
        const gridResult = await pool.query(`
            SELECT 
                s.id,
                s.sale_number,
                s.created_at,
                s.subtotal,
                s.discount,
                s.discount_reason,
                s.total,
                CASE WHEN s.subtotal > 0 THEN (s.discount / s.subtotal * 100) ELSE 0 END as discount_percent,
                u.name as operator_name,
                c.name as customer_name
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE ${whereClause}
            ORDER BY s.created_at DESC
            LIMIT 100
        `, params);

        // 8. Top 10 Produtos mais descontados (simplificado)
        const topProductsResult = await pool.query(`
            SELECT 
                p.id,
                p.name,
                'N/A' as category,
                COUNT(DISTINCT s.id) as sale_count,
                SUM(si.quantity) as total_quantity
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            WHERE ${whereClause}
            GROUP BY p.id, p.name
            ORDER BY sale_count DESC
            LIMIT 10
        `, params);

        const kpi = kpiResult.rows[0];
        const topOperator = topOperatorResult.rows[0];

        res.json({
            kpi: {
                totalDiscount: parseFloat(kpi.total_discount || 0),
                totalSalesWithDiscount: parseInt(kpi.total_sales_with_discount || 0),
                totalSubtotal: parseFloat(kpi.total_subtotal || 0),
                avgTicketWithDiscount: parseFloat(kpi.avg_ticket_with_discount || 0),
                avgTicketNoDiscount: parseFloat(kpi.avg_ticket_no_discount || 0),
                avgDiscountPercent: parseFloat(kpi.avg_discount_percent || 0),
                discountOverRevenue: kpi.total_subtotal > 0
                    ? ((kpi.total_discount / kpi.total_subtotal) * 100).toFixed(2)
                    : 0
            },
            topOperator: topOperator ? {
                id: topOperator.id,
                name: topOperator.name,
                totalDiscount: parseFloat(topOperator.total_discount || 0),
                discountPercent: parseFloat(topOperator.discount_percent || 0)
            } : null,
            operators: operatorsResult.rows.map(op => ({
                id: op.id,
                name: op.name,
                saleCount: parseInt(op.sale_count),
                totalDiscount: parseFloat(op.total_discount),
                totalSales: parseFloat(op.total_sales),
                discountPercent: parseFloat(op.discount_percent).toFixed(2)
            })),
            reasons: reasonsResult.rows.map(r => ({
                reason: r.reason,
                label: getReasonLabel(r.reason),
                count: parseInt(r.count),
                total: parseFloat(r.total)
            })),
            categories: categoriesResult.rows.map(c => ({
                category: c.category,
                saleCount: parseInt(c.sale_count),
                totalDiscount: parseFloat(c.total_discount)
            })),
            hourly: hourlyResult.rows.map(h => ({
                hour: parseInt(h.hour),
                count: parseInt(h.count),
                total: parseFloat(h.total)
            })),
            grid: gridResult.rows.map(row => ({
                id: row.id,
                saleNumber: row.sale_number,
                createdAt: row.created_at,
                subtotal: parseFloat(row.subtotal),
                discount: parseFloat(row.discount),
                discountReason: row.discount_reason,
                discountReasonLabel: getReasonLabel(row.discount_reason),
                discountPercent: parseFloat(row.discount_percent).toFixed(2),
                total: parseFloat(row.total),
                operatorName: row.operator_name || 'N/A',
                customerName: row.customer_name || 'Cliente não identificado'
            })),
            topProducts: topProductsResult.rows.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                saleCount: parseInt(p.sale_count),
                totalQuantity: parseInt(p.total_quantity)
            }))
        });
    } catch (error) {
        console.error('❌ Erro ao buscar analytics de desconto:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Erro ao buscar analytics de desconto', details: error.message });
    }
};

function getReasonLabel(reason) {
    const labels = {
        'NEAR_EXPIRY': 'Próximo ao Vencimento',
        'DAMAGE': 'Avaria na Embalagem',
        'PROMO': 'Promoção Relâmpago',
        'LOYALTY': 'Cliente Fidelidade/VIP',
        'OTHER': 'Outro',
        'SEM_MOTIVO': 'Sem Motivo Informado'
    };
    if (reason?.startsWith('Outro:')) {
        return reason;
    }
    return labels[reason] || reason || 'Não informado';
}
