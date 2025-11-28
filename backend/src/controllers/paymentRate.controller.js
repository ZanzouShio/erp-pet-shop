import pool from '../db.js';

class PaymentRateController {
    // Listar todas as taxas
    async index(req, res) {
        try {
            const result = await pool.query('SELECT * FROM payment_rates ORDER BY provider, payment_type, installments_min');
            res.json(result.rows);
        } catch (error) {
            console.error('Erro ao listar taxas:', error);
            res.status(500).json({ error: 'Erro ao listar taxas' });
        }
    }

    // Criar nova taxa
    async create(req, res) {
        const { provider, payment_type, installments_min, installments_max, fee_percent, days_to_liquidate } = req.body;
        try {
            const result = await pool.query(`
                INSERT INTO payment_rates 
                (provider, payment_type, installments_min, installments_max, fee_percent, days_to_liquidate)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [provider || 'Default', payment_type, installments_min, installments_max, fee_percent, days_to_liquidate]);

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Erro ao criar taxa:', error);
            res.status(500).json({ error: 'Erro ao criar taxa' });
        }
    }

    // Atualizar taxa
    async update(req, res) {
        const { id } = req.params;
        const { provider, payment_type, installments_min, installments_max, fee_percent, days_to_liquidate } = req.body;
        try {
            const result = await pool.query(`
                UPDATE payment_rates 
                SET provider = $1, payment_type = $2, installments_min = $3, installments_max = $4, 
                    fee_percent = $5, days_to_liquidate = $6, updated_at = NOW()
                WHERE id = $7
                RETURNING *
            `, [provider, payment_type, installments_min, installments_max, fee_percent, days_to_liquidate, id]);

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Taxa não encontrada' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Erro ao atualizar taxa:', error);
            res.status(500).json({ error: 'Erro ao atualizar taxa' });
        }
    }

    // Deletar taxa
    async delete(req, res) {
        const { id } = req.params;
        try {
            const result = await pool.query('DELETE FROM payment_rates WHERE id = $1', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Taxa não encontrada' });
            }
            res.status(204).send();
        } catch (error) {
            console.error('Erro ao deletar taxa:', error);
            res.status(500).json({ error: 'Erro ao deletar taxa' });
        }
    }
}

export default new PaymentRateController();
