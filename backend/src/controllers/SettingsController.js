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
            cashback_expire_days,
            company_name,
            trade_name,
            cnpj,
            state_registration,
            email,
            phone,
            zip_code,
            address,
            number,
            neighborhood,
            city,
            state,
            logo_url
        } = req.body;

        // Verifica se existe
        const check = await pool.query('SELECT * FROM company_settings LIMIT 1');

        let result;
        if (check.rows.length === 0) {
            // Insert
            result = await pool.query(`
                    INSERT INTO company_settings (
                        loyalty_enabled, loyalty_points_per_real,
                        cashback_enabled, cashback_percentage, cashback_expire_days,
                        company_name, trade_name, cnpj, state_registration,
                        email, phone, zip_code, address, number, neighborhood, city, state, logo_url
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                    RETURNING *
                `, [
                loyalty_enabled,
                loyalty_points_per_real || 1,
                cashback_enabled,
                cashback_percentage || 0,
                cashback_expire_days || 90,
                company_name || 'Minha Empresa',
                trade_name,
                cnpj || '00000000000000',
                state_registration,
                email,
                phone,
                zip_code,
                address,
                number,
                neighborhood,
                city,
                state,
                logo_url
            ]);
        } else {
            // Update
            const existing = check.rows[0];
            const id = existing.id;

            result = await pool.query(`
                    UPDATE company_settings
                    SET loyalty_enabled = $1,
                        loyalty_points_per_real = $2,
                        cashback_enabled = $3,
                        cashback_percentage = $4,
                        cashback_expire_days = $5,
                        company_name = $6,
                        trade_name = $7,
                        cnpj = $8,
                        state_registration = $9,
                        email = $10,
                        phone = $11,
                        zip_code = $12,
                        address = $13,
                        number = $14,
                        neighborhood = $15,
                        city = $16,
                        state = $17,
                        logo_url = $18,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $19
                    RETURNING *
                `, [
                loyalty_enabled !== undefined ? loyalty_enabled : existing.loyalty_enabled,
                loyalty_points_per_real !== undefined ? loyalty_points_per_real : existing.loyalty_points_per_real,
                cashback_enabled !== undefined ? cashback_enabled : existing.cashback_enabled,
                cashback_percentage !== undefined ? cashback_percentage : existing.cashback_percentage,
                cashback_expire_days !== undefined ? cashback_expire_days : existing.cashback_expire_days,
                company_name !== undefined ? company_name : existing.company_name,
                trade_name !== undefined ? trade_name : existing.trade_name,
                cnpj !== undefined ? cnpj : existing.cnpj,
                state_registration !== undefined ? state_registration : existing.state_registration,
                email !== undefined ? email : existing.email,
                phone !== undefined ? phone : existing.phone,
                zip_code !== undefined ? zip_code : existing.zip_code,
                address !== undefined ? address : existing.address,
                number !== undefined ? number : existing.number,
                neighborhood !== undefined ? neighborhood : existing.neighborhood,
                city !== undefined ? city : existing.city,
                state !== undefined ? state : existing.state,
                logo_url !== undefined ? logo_url : existing.logo_url,
                id
            ]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
};
