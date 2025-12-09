import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Default permissions list
const AVAILABLE_PERMISSIONS = [
    // Dashboard
    'dashboard.view',
    // PDV
    'pos.access', 'pos.sales', 'pos.discounts', 'pos.cancel_sale',
    // Cash Register
    'cash.open', 'cash.close', 'cash.sangria', 'cash.suprimento', 'cash.report',
    // Sales
    'sales.view', 'sales.create', 'sales.edit', 'sales.cancel',
    // Inventory
    'inventory.view', 'inventory.manage', 'inventory.movements',
    // Financial
    'financial.view', 'financial.payable', 'financial.receivable', 'financial.cashflow', 'financial.invoices', 'financial.commissions',
    // Customers
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    // Suppliers
    'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
    // Reports
    'reports.view', 'reports.export',
    // Settings
    'settings.view', 'settings.users', 'settings.roles', 'settings.company', 'settings.payments', 'settings.invoices',
    // Grooming
    'grooming.view', 'grooming.schedule', 'grooming.manage',
];

export const rolesController = {
    // List available permissions
    async getPermissions(req, res) {
        try {
            res.json({ permissions: AVAILABLE_PERMISSIONS });
        } catch (error) {
            console.error('Error getting permissions:', error);
            res.status(500).json({ error: 'Erro ao buscar permissões' });
        }
    },

    // List all roles
    async list(req, res) {
        try {
            const { includeInactive } = req.query;

            const where = {};
            if (!includeInactive) {
                where.is_active = true;
            }

            const roles = await prisma.roles.findMany({
                where,
                orderBy: { name: 'asc' },
                include: {
                    _count: { select: { users: true } }
                }
            });

            res.json(roles);
        } catch (error) {
            console.error('Error listing roles:', error);
            res.status(500).json({ error: 'Erro ao listar cargos' });
        }
    },

    // Get role by ID
    async getById(req, res) {
        try {
            const { id } = req.params;

            const role = await prisma.roles.findUnique({
                where: { id },
                include: {
                    _count: { select: { users: true } }
                }
            });

            if (!role) {
                return res.status(404).json({ error: 'Cargo não encontrado' });
            }

            res.json(role);
        } catch (error) {
            console.error('Error getting role:', error);
            res.status(500).json({ error: 'Erro ao buscar cargo' });
        }
    },

    // Create new role
    async create(req, res) {
        try {
            const { name, description, permissions, color } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Nome é obrigatório' });
            }

            // Check if name already exists
            const existing = await prisma.roles.findUnique({ where: { name } });
            if (existing) {
                return res.status(400).json({ error: 'Já existe um cargo com este nome' });
            }

            const role = await prisma.roles.create({
                data: {
                    name,
                    description,
                    permissions: permissions || [],
                    color: color || '#6B7280',
                    is_system: false,
                    is_active: true
                }
            });

            res.status(201).json(role);
        } catch (error) {
            console.error('Error creating role:', error);
            res.status(500).json({ error: 'Erro ao criar cargo' });
        }
    },

    // Update role
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, permissions, color, is_active } = req.body;

            const existing = await prisma.roles.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ error: 'Cargo não encontrado' });
            }

            // Check for duplicate name
            if (name && name !== existing.name) {
                const duplicate = await prisma.roles.findUnique({ where: { name } });
                if (duplicate) {
                    return res.status(400).json({ error: 'Já existe um cargo com este nome' });
                }
            }

            const role = await prisma.roles.update({
                where: { id },
                data: {
                    name: name || existing.name,
                    description,
                    permissions: permissions !== undefined ? permissions : existing.permissions,
                    color: color || existing.color,
                    is_active: is_active !== undefined ? is_active : existing.is_active,
                    updated_at: new Date()
                }
            });

            res.json(role);
        } catch (error) {
            console.error('Error updating role:', error);
            res.status(500).json({ error: 'Erro ao atualizar cargo' });
        }
    },

    // Delete role (soft delete or hard delete if no users)
    async delete(req, res) {
        try {
            const { id } = req.params;

            const role = await prisma.roles.findUnique({
                where: { id },
                include: { _count: { select: { users: true } } }
            });

            if (!role) {
                return res.status(404).json({ error: 'Cargo não encontrado' });
            }

            if (role.is_system) {
                return res.status(400).json({ error: 'Não é possível excluir cargos do sistema' });
            }

            if (role._count.users > 0) {
                // Soft delete if users exist
                await prisma.roles.update({
                    where: { id },
                    data: { is_active: false, updated_at: new Date() }
                });
                return res.json({ message: 'Cargo desativado (possui usuários vinculados)' });
            }

            // Hard delete if no users
            await prisma.roles.delete({ where: { id } });
            res.json({ message: 'Cargo excluído com sucesso' });
        } catch (error) {
            console.error('Error deleting role:', error);
            res.status(500).json({ error: 'Erro ao excluir cargo' });
        }
    },

    // Seed default roles
    async seedDefaults(req, res) {
        try {
            const defaultRoles = [
                {
                    name: 'admin',
                    description: 'Administrador com acesso total ao sistema',
                    permissions: AVAILABLE_PERMISSIONS,
                    color: '#EF4444',
                    is_system: true
                },
                {
                    name: 'gerente',
                    description: 'Gerente de loja com acesso amplo',
                    permissions: AVAILABLE_PERMISSIONS.filter(p => !p.startsWith('settings.roles') && !p.startsWith('settings.company')),
                    color: '#8B5CF6',
                    is_system: true
                },
                {
                    name: 'caixa',
                    description: 'Operador de caixa para vendas',
                    permissions: ['dashboard.view', 'pos.access', 'pos.sales', 'cash.open', 'cash.close', 'cash.sangria', 'cash.suprimento', 'cash.report', 'sales.view', 'customers.view'],
                    color: '#10B981',
                    is_system: true
                },
                {
                    name: 'financeiro',
                    description: 'Acesso ao módulo financeiro',
                    permissions: ['dashboard.view', 'financial.view', 'financial.payable', 'financial.receivable', 'financial.cashflow', 'financial.invoices', 'financial.commissions', 'reports.view', 'reports.export'],
                    color: '#3B82F6',
                    is_system: true
                },
                {
                    name: 'estoque',
                    description: 'Gestão de estoque e inventário',
                    permissions: ['dashboard.view', 'inventory.view', 'inventory.manage', 'inventory.movements', 'suppliers.view'],
                    color: '#F59E0B',
                    is_system: true
                }
            ];

            for (const roleData of defaultRoles) {
                await prisma.roles.upsert({
                    where: { name: roleData.name },
                    update: { permissions: roleData.permissions, description: roleData.description, color: roleData.color },
                    create: roleData
                });
            }

            res.json({ message: 'Cargos padrão criados/atualizados com sucesso' });
        } catch (error) {
            console.error('Error seeding roles:', error);
            res.status(500).json({ error: 'Erro ao criar cargos padrão' });
        }
    }
};

export default rolesController;
