import pool from '../db.js';

export const getSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM company_settings LIMIT 1');

        if (result.rows.length === 0) {
            // Se não existir, cria um padrão
            const newSettings = await pool.query(`
                INSERT INTO company_settings (company_name, cnpj, loyalty_enabled, cashback_enabled)
                VALUES ('Minha Empresa', '00000000000000', false, false)
                RETURNING *
            `);
            return res.json(newSettings.rows[0]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const {
            loyalty_enabled,
            loyalty_points_per_real,
            cashback_enabled,
            cashback_percentage,
            cashback_expire_days
        } = req.body;

        // Verifica se existe
        const check = await pool.query('SELECT id FROM company_settings LIMIT 1');

        let result;
        if (check.rows.length === 0) {
            // Insert
            result = await pool.query(`
                INSERT INTO company_settings (
                    loyalty_enabled, loyalty_points_per_real,
                    cashback_enabled, cashback_percentage, cashback_expire_days,
                    company_name, cnpj
                ) VALUES ($1, $2, $3, $4, $5, 'Minha Empresa', '00000000000000')
                RETURNING *
            `, [
                loyalty_enabled,
                loyalty_points_per_real || 1,
                cashback_enabled,
                cashback_percentage || 0,
                cashback_expire_days || 90
            ]);
        } else {
            // Update
            const id = check.rows[0].id;
            result = await pool.query(`
                UPDATE company_settings
                SET loyalty_enabled = $1,
                    loyalty_points_per_real = $2,
                    cashback_enabled = $3,
                    cashback_percentage = $4,
                    cashback_expire_days = $5,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $6
                RETURNING *
            `, [
                loyalty_enabled,
                loyalty_points_per_real,
                cashback_enabled,
                cashback_percentage,
                cashback_expire_days,
                id
            ]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
};
