import pool from '../db.js';

export const createSale = async (req, res) => {
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
};

export const getAllSales = async (req, res) => {
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
};

export const getSaleById = async (req, res) => {
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
};

export const cancelSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // 1. Buscar venda e verificar status
        const saleResult = await client.query(`
            SELECT id, status FROM sales WHERE id = $1 FOR UPDATE
        `, [id]);

        if (saleResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        const sale = saleResult.rows[0];

        if (sale.status === 'cancelled') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Venda já está cancelada' });
        }

        // 2. Buscar itens para estorno
        const itemsResult = await client.query(`
            SELECT product_id, quantity, unit_price 
            FROM sale_items 
            WHERE sale_id = $1
        `, [id]);

        // 3. Estornar estoque e registrar movimentação
        for (const item of itemsResult.rows) {
            // Devolver ao estoque
            await client.query(`
                UPDATE products 
                SET stock_quantity = stock_quantity + $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [item.quantity, item.product_id]);

            // Registrar movimentação
            await client.query(`
                INSERT INTO stock_movements (
                    product_id, type, quantity, cost_price,
                    reference_type, reference_id, notes, created_at
                ) VALUES ($1, 'IN', $2, $3, 'sale_cancellation', $4, 'Cancelamento de venda', NOW())
            `, [
                item.product_id,
                item.quantity,
                0, // TODO: Ideal seria pegar o custo original, mas por hora 0 ou custo atual
                id
            ]);
        }

        // 4. Atualizar status da venda
        await client.query(`
            UPDATE sales 
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [id]);

        await client.query('COMMIT');

        res.json({ message: 'Venda cancelada com sucesso' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao cancelar venda:', error);
        res.status(500).json({ error: 'Erro ao cancelar venda' });
    } finally {
        client.release();
    }
};
