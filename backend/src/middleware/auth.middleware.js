
import jwt from 'jsonwebtoken';

// Validação da chave JWT em produção
const DEFAULT_SECRET = 'erp-pet-shop-secret-key-change-me';
const SECRET_KEY = process.env.JWT_SECRET || DEFAULT_SECRET;

// Em produção, JWT_SECRET deve ser configurado
if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_SECRET) {
        console.error('❌ FATAL: JWT_SECRET não configurado ou usando valor padrão em produção!');
        console.error('   Gere um novo com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
        process.exit(1);
    }
}

// Exportar para uso consistente em auth.controller.js
export { SECRET_KEY };

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Token de autenticação não fornecido',
            code: 'NO_TOKEN'
        });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            const isExpired = err.name === 'TokenExpiredError';
            console.warn(`[Auth] Token ${isExpired ? 'expirado' : 'inválido'} - ${err.message}`);
            return res.status(403).json({
                error: isExpired ? 'Token expirado - faça login novamente' : 'Token inválido',
                code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
            });
        }

        req.user_id = user.id;
        req.user_role = user.role;
        req.user_email = user.email;
        next();
    });
};

// Middleware que tenta pegar o usuário mas NÃO bloqueia se não tiver
export const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (!err) {
                req.user_id = user.id;
                req.user_role = user.role;
                req.user_email = user.email;
            }
            next();
        });
    } else {
        next();
    }
};
