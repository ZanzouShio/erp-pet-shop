import pool from '../db.js';

export const accountsPayableController = {
    // Listar contas com filtros
    async list(req, res) {
        try {
            const { startDate, endDate, status, supplierId, categoryId } = req.query;

            let query = `
                SELECT 
                    ap.*,
                    s.trade_name as supplier_name,
                    ec.name as category_name,
                    ec.color as category_color
                FROM accounts_payable ap
                LEFT JOIN suppliers s ON ap.supplier_id = s.id
                LEFT JOIN expense_categories ec ON ap.category_id = ec.id
                WHERE 1=1
            `;

            const params = [];
            let paramCount = 1;

            if (startDate) {
                query += ` AND ap.due_date >= $${paramCount}`;
                params.push(startDate);
                paramCount++;
            }

            if (endDate) {
                query += ` AND ap.due_date <= $${paramCount}`;
                params.push(endDate);
                paramCount++;
            }

            if (status && status !== 'ALL') {
                query += ` AND ap.status = $${paramCount}`;
                params.push(status);
                paramCount++;
            }

            if (supplierId) {
                query += ` AND ap.supplier_id = $${paramCount}`;
                params.push(supplierId);
                paramCount++;
            }

            if (categoryId) {
                query += ` AND ap.category_id = $${paramCount}`;
                params.push(categoryId);
                paramCount++;
            }

            query += ` ORDER BY ap.due_date ASC`;

            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (error) {
            console.error('Erro ao listar contas a pagar:', error);
            res.status(500).json({ error: 'Erro ao listar contas a pagar' });
        }
    },

    // Criar nova conta
    async create(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                description, amount, due_date, supplier_id, category_id,
                recurrence, installments, notes
            } = req.body;

            // TODO: Se tiver parcelamento, gerar múltiplos registros?
            // Por enquanto, vamos criar um registro simples.
            // Se for parcelado, o frontend pode mandar um array ou o backend gera.
            // Vamos assumir criação simples por enquanto.

            const result = await client.query(`
                INSERT INTO accounts_payable 
                (description, amount, due_date, supplier_id, category_id, recurrence, installments, notes, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
                RETURNING *
            `, [description, amount, due_date, supplier_id || null, category_id, recurrence, installments, notes]);

            await client.query('COMMIT');
            res.status(201).json(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao criar conta a pagar:', error);
            res.status(500).json({ error: 'Erro ao criar conta a pagar' });
        } finally {
            client.release();
        }
    },

    // Registrar pagamento (Baixa)
    async pay(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { id } = req.params;
            const { amount_paid, payment_date, payment_method, account_id } = req.body; // account_id seria conta bancária/caixa

            // 1. Buscar conta atual
            const currentBill = await client.query('SELECT * FROM accounts_payable WHERE id = $1', [id]);
            if (currentBill.rowCount === 0) {
                throw new Error('Conta não encontrada');
            }
            const bill = currentBill.rows[0];

            // 2. Calcular novo total pago e status
            const newTotalPaid = Number(bill.total_paid) + Number(amount_paid);
            let newStatus = bill.status;

            if (newTotalPaid >= Number(bill.amount)) {
                newStatus = 'paid';
            } else {
                newStatus = 'partial';
            }

            // 3. Atualizar conta a pagar
            const updatedBill = await client.query(`
                UPDATE accounts_payable 
                SET total_paid = $1, status = $2, payment_date = $3, updated_at = NOW()
                WHERE id = $4
                RETURNING *
            `, [newTotalPaid, newStatus, payment_date || new Date(), id]);

            // 4. Registrar transação financeira (saída)
            const pDate = payment_date || new Date();
            await client.query(`
                INSERT INTO financial_transactions 
                (type, amount, description, date, issue_date, due_date, category, payment_method, account_payable_id, status)
                VALUES ('expense', $1, $2, $3, $4, $7, 'Pagamento de Conta', $5, $6, 'paid')
            `, [amount_paid, `Pagamento: ${bill.description}`, pDate, pDate, payment_method, id, bill.due_date]);

            await client.query('COMMIT');
            res.json(updatedBill.rows[0]);

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao pagar conta:', error);
            res.status(500).json({ error: error.message || 'Erro ao processar pagamento' });
        } finally {
            client.release();
        }
    },

    // Excluir conta
    async delete(req, res) {
        try {
            const { id } = req.params;
            // Verificar se já tem pagamentos parciais?
            // Por simplicidade, permitir excluir se não estiver totalmente paga ou se for estorno.

            const result = await pool.query('DELETE FROM accounts_payable WHERE id = $1 RETURNING id', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Conta não encontrada' });
            }
            res.json({ message: 'Conta excluída com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            res.status(500).json({ error: 'Erro ao excluir conta' });
        }
    }
};
