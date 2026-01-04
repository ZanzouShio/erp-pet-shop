
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import { verifyPassword } from '../utils/auth.utils.js';
import { SECRET_KEY } from '../middleware/auth.middleware.js';

// Helper to log login attempts
const logLoginAttempt = async (client, userId, req, success, reason = null) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        await client.query(
            `INSERT INTO user_login_history (user_id, ip_address, user_agent, success, reason) VALUES ($1, $2, $3, $4, $5)`,
            [userId, ip, userAgent, success, reason]
        );
    } catch (err) {
        console.error('Error logging login attempt:', err);
    }
};

export const login = async (req, res) => {
    const client = await pool.connect();
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Buscar usuário
        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = result.rows[0];

        // Verificar senha
        if (!user.password_hash || !verifyPassword(password, user.password_hash)) {
            await logLoginAttempt(client, user.id, req, false, 'Senha incorreta');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        if (!user.is_active) {
            await logLoginAttempt(client, user.id, req, false, 'Usuário inativo');
            return res.status(403).json({ error: 'Usuário inativo' });
        }

        // Gerar Token com expiração configurável
        const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            SECRET_KEY,
            { expiresIn }
        );

        // Registrar login bem-sucedido e atualizar last_login_at
        await logLoginAttempt(client, user.id, req, true);
        await client.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

        // Remover hash da resposta
        delete user.password_hash;

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Erro interno ao realizar login' });
    } finally {
        client.release();
    }
};

export const getMe = async (req, res) => {
    // Retorna dados do usuário logado (baseado no token já verificado pelo middleware)
    // Se quisermos dados frescos do banco:
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, name, email, role, is_active FROM users WHERE id = $1', [req.user_id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    } finally {
        client.release();
    }
}
