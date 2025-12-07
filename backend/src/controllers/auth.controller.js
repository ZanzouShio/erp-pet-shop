
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import { verifyPassword } from '../utils/auth.utils.js';

const SECRET_KEY = process.env.JWT_SECRET || 'erp-pet-shop-secret-key-change-me';

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
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Usuário inativo' });
        }

        // Gerar Token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            SECRET_KEY,
            { expiresIn: '8h' }
        );

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
