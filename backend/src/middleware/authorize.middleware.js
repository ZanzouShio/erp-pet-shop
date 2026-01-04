/**
 * Authorization Middleware - Role-Based Access Control (RBAC)
 * 
 * Verifica se o usuário autenticado possui uma das roles permitidas.
 * Deve ser usado APÓS o authMiddleware.
 */

/**
 * Middleware que requer uma ou mais roles específicas
 * @param {...string} allowedRoles - Roles permitidas (ex: 'admin', 'gerente')
 * @returns {Function} Express middleware
 * 
 * @example
 * router.delete('/:id', requireRole('admin'), controller.delete);
 * router.get('/', requireRole('admin', 'gerente'), controller.list);
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Verificar se o middleware de autenticação já rodou
        if (!req.user_id) {
            return res.status(401).json({
                error: 'Não autenticado',
                code: 'UNAUTHENTICATED'
            });
        }

        // Verificar se user_role foi definido
        if (!req.user_role) {
            console.warn(`[RBAC] Usuário ${req.user_id} sem role definido`);
            return res.status(403).json({
                error: 'Acesso negado - role não identificado',
                code: 'NO_ROLE'
            });
        }

        // Verificar se a role do usuário está na lista de permitidas
        if (!allowedRoles.includes(req.user_role)) {
            console.warn(`[RBAC] Usuário ${req.user_id} (${req.user_role}) tentou acessar recurso restrito a: ${allowedRoles.join(', ')}`);
            return res.status(403).json({
                error: 'Acesso negado - permissão insuficiente',
                code: 'FORBIDDEN',
                required: allowedRoles,
                current: req.user_role
            });
        }

        next();
    };
};

/**
 * Middleware que verifica se o usuário tem uma permissão específica
 * Baseado nas permissions do role do usuário (granular)
 * 
 * @param {...string} requiredPermissions - Permissões necessárias
 * @returns {Function} Express middleware
 * 
 * @example
 * router.post('/', requirePermission('sales.create'), controller.create);
 */
export const requirePermission = (...requiredPermissions) => {
    return async (req, res, next) => {
        if (!req.user_id || !req.user_role) {
            return res.status(401).json({
                error: 'Não autenticado',
                code: 'UNAUTHENTICATED'
            });
        }

        // Admin tem todas as permissões
        if (req.user_role === 'admin') {
            return next();
        }

        // Para verificação granular, buscaríamos as permissions do role no banco
        // Por enquanto, assumimos que se não for admin, negamos permissões administrativas
        const adminOnlyPermissions = [
            'settings.roles',
            'settings.users',
            'settings.company'
        ];

        const needsAdmin = requiredPermissions.some(p => adminOnlyPermissions.includes(p));

        if (needsAdmin && req.user_role !== 'admin') {
            return res.status(403).json({
                error: 'Esta ação requer privilégios de administrador',
                code: 'ADMIN_REQUIRED'
            });
        }

        // TODO: Implementar verificação completa contra tabela roles.permissions
        next();
    };
};

/**
 * Helper: Verifica se é o próprio usuário ou admin
 * Útil para rotas como "alterar própria senha"
 */
export const requireSelfOrAdmin = (req, res, next) => {
    if (!req.user_id) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    const targetId = req.params.id || req.body.userId;

    if (req.user_id === targetId || req.user_role === 'admin') {
        return next();
    }

    return res.status(403).json({
        error: 'Você só pode acessar seus próprios dados',
        code: 'SELF_ONLY'
    });
};

export default { requireRole, requirePermission, requireSelfOrAdmin };
