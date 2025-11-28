import pool from '../db.js';

class AccountsReceivableController {
    // Listar títulos (com filtros)
    async index(req, res) {
        const { start_date, end_date, status, customer_id } = req.query;
        console.log('📥 GET /accounts-receivable - Filtros:', { start_date, end_date, status, customer_id });

        let query = `
            SELECT ar.*, c.name as customer_name 
            FROM accounts_receivable ar
            LEFT JOIN customers c ON ar.customer_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (start_date) {
            query += ` AND ar.due_date >= $${paramIndex++}`;
            params.push(start_date);
        }
        if (end_date) {
            query += ` AND ar.due_date <= $${paramIndex++}`;
            params.push(end_date);
        }
        if (status) {
            query += ` AND ar.status = $${paramIndex++}`;
            params.push(status);
        }
        if (customer_id) {
            query += ` AND ar.customer_id = $${paramIndex++}`;
            params.push(customer_id);
        }

        query += ` ORDER BY ar.due_date ASC`;

        try {
            const result = await pool.query(query, params);
            console.log(`📤 Retornando ${result.rows.length} registros`);
            res.json(result.rows);
        } catch (error) {
            console.error('Erro ao listar contas a receber:', error);
            res.status(500).json({ error: 'Erro ao listar contas a receber' });
        }
    }

    // Obter carteira do cliente (resumo e títulos)
    async getByCustomer(req, res) {
        const { customerId } = req.params;
        try {
            const titles = await pool.query(`
                SELECT * FROM accounts_receivable 
                WHERE customer_id = $1 
                ORDER BY due_date ASC
            `, [customerId]);

            const summary = await pool.query(`
                SELECT 
                    SUM(amount) FILTER (WHERE status = 'pending') as total_pending,
                    SUM(amount) FILTER (WHERE status = 'overdue') as total_overdue
                FROM accounts_receivable
                WHERE customer_id = $1
            `, [customerId]);

            res.json({
                summary: summary.rows[0],
                titles: titles.rows
            });
        } catch (error) {
            console.error('Erro ao buscar carteira do cliente:', error);
            res.status(500).json({ error: 'Erro ao buscar carteira do cliente' });
        }
    }

    // Baixar título (Recebimento)
    async receive(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { id } = req.params;
            const { payment_date, amount_received } = req.body; // Pode ser parcial no futuro

            // 1. Buscar título
            const titleRes = await client.query('SELECT * FROM accounts_receivable WHERE id = $1', [id]);
            if (titleRes.rowCount === 0) throw new Error('Título não encontrado');
            const title = titleRes.rows[0];

            if (title.status === 'paid') throw new Error('Título já está pago');

            // 2. Atualizar título
            const pDate = payment_date || new Date();
            await client.query(`
                UPDATE accounts_receivable 
                SET status = 'paid', paid_date = $1, updated_at = NOW()
                WHERE id = $2
            `, [pDate, id]);

            // 3. Registrar transação financeira (Entrada)
            // 3. Registrar transação financeira (Entrada)
            await client.query(`
                INSERT INTO financial_transactions 
                (type, amount, description, date, issue_date, due_date, category, payment_method, status, customer_id)
                VALUES ('revenue', $1, $2, $3, $4, $4, 'Recebimento de Cliente', $5, 'paid', $6)
            `, [title.net_amount, `Recebimento: ${title.description}`, pDate, pDate, title.payment_method, title.customer_id]);

            await client.query('COMMIT');
            res.json({ message: 'Título baixado com sucesso' });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao baixar título:', error);
            res.status(500).json({ error: error.message || 'Erro ao baixar título' });
        } finally {
            client.release();
        }
    }
}

export default new AccountsReceivableController();
