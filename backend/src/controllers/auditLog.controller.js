import { prisma } from '../db.js';

export const auditLogController = {
    // Listar logs de auditoria com filtros
    async list(req, res) {
        try {
            const { startDate, endDate, entity_type, action, limit = 100 } = req.query;

            const where = {};

            if (startDate) {
                where.created_at = { ...where.created_at, gte: new Date(startDate + 'T00:00:00') };
            }
            if (endDate) {
                where.created_at = { ...where.created_at, lte: new Date(endDate + 'T23:59:59') };
            }
            if (entity_type) {
                where.entity_type = entity_type;
            }
            if (action) {
                where.action = action;
            }

            const logs = await prisma.audit_logs.findMany({
                where,
                include: {
                    users: {
                        select: { name: true }
                    }
                },
                orderBy: { created_at: 'desc' },
                take: parseInt(limit)
            });

            // Mapear para formato amigável
            const formattedLogs = logs.map(log => ({
                ...log,
                user_name: log.users?.name || 'Sistema'
            }));

            res.json(formattedLogs);
        } catch (error) {
            console.error('Erro ao listar logs de auditoria:', error);
            res.status(500).json({ error: 'Erro ao listar logs de auditoria' });
        }
    },

    // Buscar tipos de entidades únicos para filtro
    async getEntityTypes(req, res) {
        try {
            const types = await prisma.audit_logs.findMany({
                select: { entity_type: true },
                distinct: ['entity_type']
            });
            res.json(types.map(t => t.entity_type));
        } catch (error) {
            console.error('Erro ao buscar tipos de entidade:', error);
            res.status(500).json({ error: 'Erro ao buscar tipos de entidade' });
        }
    },

    // Buscar ações únicas para filtro
    async getActions(req, res) {
        try {
            const actions = await prisma.audit_logs.findMany({
                select: { action: true },
                distinct: ['action']
            });
            res.json(actions.map(a => a.action));
        } catch (error) {
            console.error('Erro ao buscar ações:', error);
            res.status(500).json({ error: 'Erro ao buscar ações' });
        }
    }
};
