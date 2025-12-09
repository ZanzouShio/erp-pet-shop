import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../utils/auth.utils.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const usersController = {
    // List users with filters and pagination
    async list(req, res) {
        try {
            const { search, role, roleId, isActive, page = 1, limit = 20 } = req.query;

            const where = {};

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { cpf: { contains: search } }
                ];
            }

            if (role) where.role = role;
            if (roleId) where.role_id = roleId;
            if (isActive !== undefined) where.is_active = isActive === 'true';

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [users, total] = await Promise.all([
                prisma.users.findMany({
                    where,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        cpf: true,
                        phone: true,
                        role: true,
                        role_id: true,
                        is_active: true,
                        avatar_url: true,
                        last_login_at: true,
                        two_factor_enabled: true,
                        is_groomer: true,
                        created_at: true,
                        roles: { select: { id: true, name: true, color: true } }
                    },
                    orderBy: { name: 'asc' },
                    skip,
                    take: parseInt(limit)
                }),
                prisma.users.count({ where })
            ]);

            res.json({
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Error listing users:', error);
            res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    },

    // Get user by ID
    async getById(req, res) {
        try {
            const { id } = req.params;

            const user = await prisma.users.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    cpf: true,
                    phone: true,
                    role: true,
                    role_id: true,
                    is_active: true,
                    avatar_url: true,
                    last_login_at: true,
                    two_factor_enabled: true,
                    is_groomer: true,
                    seniority_level: true,
                    speed_factor: true,
                    commission_rate: true,
                    created_at: true,
                    updated_at: true,
                    roles: { select: { id: true, name: true, color: true, permissions: true } }
                }
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            res.json(user);
        } catch (error) {
            console.error('Error getting user:', error);
            res.status(500).json({ error: 'Erro ao buscar usuário' });
        }
    },

    // Create new user
    async create(req, res) {
        try {
            const { name, email, password, cpf, phone, role, role_id, is_groomer, seniority_level, commission_rate } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
            }

            // Check if email already exists
            const existingEmail = await prisma.users.findUnique({ where: { email } });
            if (existingEmail) {
                return res.status(400).json({ error: 'Este email já está em uso' });
            }

            // Check if CPF already exists
            if (cpf) {
                const existingCpf = await prisma.users.findUnique({ where: { cpf } });
                if (existingCpf) {
                    return res.status(400).json({ error: 'Este CPF já está cadastrado' });
                }
            }

            // Get role name from role_id if provided
            let roleName = role || 'caixa';
            if (role_id) {
                const roleData = await prisma.roles.findUnique({ where: { id: role_id } });
                if (roleData) roleName = roleData.name;
            }

            const passwordHash = hashPassword(password);

            const user = await prisma.users.create({
                data: {
                    name,
                    email,
                    password_hash: passwordHash,
                    cpf: cpf || null,
                    phone: phone || null,
                    role: roleName,
                    role_id: role_id || null,
                    is_active: true,
                    is_groomer: is_groomer || false,
                    seniority_level: seniority_level || null,
                    commission_rate: commission_rate || 0
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    cpf: true,
                    phone: true,
                    role: true,
                    role_id: true,
                    is_active: true,
                    created_at: true
                }
            });

            res.status(201).json(user);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Erro ao criar usuário' });
        }
    },

    // Update user (without password)
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, email, cpf, phone, role, role_id, is_active, avatar_url, is_groomer, seniority_level, commission_rate } = req.body;

            const existing = await prisma.users.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Check for duplicate email
            if (email && email !== existing.email) {
                const duplicate = await prisma.users.findUnique({ where: { email } });
                if (duplicate) {
                    return res.status(400).json({ error: 'Este email já está em uso' });
                }
            }

            // Check for duplicate CPF
            if (cpf && cpf !== existing.cpf) {
                const duplicate = await prisma.users.findUnique({ where: { cpf } });
                if (duplicate) {
                    return res.status(400).json({ error: 'Este CPF já está cadastrado' });
                }
            }

            // Get role name from role_id if provided
            let roleName = role || existing.role;
            if (role_id && role_id !== existing.role_id) {
                const roleData = await prisma.roles.findUnique({ where: { id: role_id } });
                if (roleData) roleName = roleData.name;
            }

            const user = await prisma.users.update({
                where: { id },
                data: {
                    name: name || existing.name,
                    email: email || existing.email,
                    cpf: cpf !== undefined ? cpf : existing.cpf,
                    phone: phone !== undefined ? phone : existing.phone,
                    role: roleName,
                    role_id: role_id !== undefined ? role_id : existing.role_id,
                    is_active: is_active !== undefined ? is_active : existing.is_active,
                    avatar_url: avatar_url !== undefined ? avatar_url : existing.avatar_url,
                    is_groomer: is_groomer !== undefined ? is_groomer : existing.is_groomer,
                    seniority_level: seniority_level !== undefined ? seniority_level : existing.seniority_level,
                    commission_rate: commission_rate !== undefined ? commission_rate : existing.commission_rate,
                    updated_at: new Date()
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    cpf: true,
                    phone: true,
                    role: true,
                    role_id: true,
                    is_active: true,
                    avatar_url: true,
                    is_groomer: true,
                    updated_at: true
                }
            });

            res.json(user);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Erro ao atualizar usuário' });
        }
    },

    // Change password (by user themselves)
    async changePassword(req, res) {
        try {
            const userId = req.user_id; // From auth middleware
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
            }

            const user = await prisma.users.findUnique({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Verify current password
            const { verifyPassword } = await import('../utils/auth.utils.js');
            if (!verifyPassword(currentPassword, user.password_hash)) {
                return res.status(401).json({ error: 'Senha atual incorreta' });
            }

            const passwordHash = hashPassword(newPassword);
            await prisma.users.update({
                where: { id: userId },
                data: { password_hash: passwordHash, updated_at: new Date() }
            });

            res.json({ message: 'Senha alterada com sucesso' });
        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({ error: 'Erro ao alterar senha' });
        }
    },

    // Reset password (by admin)
    async resetPassword(req, res) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword) {
                return res.status(400).json({ error: 'Nova senha é obrigatória' });
            }

            const user = await prisma.users.findUnique({ where: { id } });
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const passwordHash = hashPassword(newPassword);
            await prisma.users.update({
                where: { id },
                data: { password_hash: passwordHash, updated_at: new Date() }
            });

            res.json({ message: 'Senha redefinida com sucesso' });
        } catch (error) {
            console.error('Error resetting password:', error);
            res.status(500).json({ error: 'Erro ao redefinir senha' });
        }
    },

    // Toggle user status
    async toggleStatus(req, res) {
        try {
            const { id } = req.params;

            const user = await prisma.users.findUnique({ where: { id } });
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const updated = await prisma.users.update({
                where: { id },
                data: {
                    is_active: !user.is_active,
                    updated_at: new Date()
                },
                select: { id: true, name: true, is_active: true }
            });

            res.json({
                message: updated.is_active ? 'Usuário ativado' : 'Usuário desativado',
                user: updated
            });
        } catch (error) {
            console.error('Error toggling user status:', error);
            res.status(500).json({ error: 'Erro ao alterar status do usuário' });
        }
    },

    // Get login history
    async getLoginHistory(req, res) {
        try {
            const { id } = req.params;
            const { limit = 50 } = req.query;

            const history = await prisma.user_login_history.findMany({
                where: { user_id: id },
                orderBy: { created_at: 'desc' },
                take: parseInt(limit)
            });

            res.json(history);
        } catch (error) {
            console.error('Error getting login history:', error);
            res.status(500).json({ error: 'Erro ao buscar histórico de login' });
        }
    },

    // Delete user (logical)
    async delete(req, res) {
        try {
            const { id } = req.params;

            const user = await prisma.users.findUnique({ where: { id } });
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Don't allow deleting yourself
            if (id === req.user_id) {
                return res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
            }

            // Soft delete
            await prisma.users.update({
                where: { id },
                data: {
                    is_active: false,
                    email: `deleted_${Date.now()}_${user.email}`,
                    updated_at: new Date()
                }
            });

            res.json({ message: 'Usuário excluído com sucesso' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Erro ao excluir usuário' });
        }
    }
};

export default usersController;
