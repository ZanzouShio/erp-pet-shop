import pool from '../db.js';

export const createStockMovement = async (req, res) => {
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
};

export const getStockMovements = async (req, res) => {
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
};
