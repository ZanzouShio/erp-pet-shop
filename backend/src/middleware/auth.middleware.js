
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'erp-pet-shop-secret-key-change-me';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        // Se a rota for opcional ou pública, pode passar next() sem req.user_id
        // Mas para rotas protegidas, retornamos 401.
        // Vamos assumir que se esse middleware está na rota, ela É protegida.
        return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }

        req.user_id = user.id;
        req.user_role = user.role;
        next();
    });
};

// Middleware que tenta pegar o usuário mas NÃO bloqueia se não tiver (para rotas mistas ou migração)
export const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (!err) {
                req.user_id = user.id;
                req.user_role = user.role;
            }
            next();
        });
    } else {
        next();
    }
};
