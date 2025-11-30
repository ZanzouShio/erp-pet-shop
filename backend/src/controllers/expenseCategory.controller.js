import { prisma } from '../db.js';

export const expenseCategoryController = {
    // Listar todas as categorias
    async list(req, res) {
        try {
            const categories = await prisma.expense_categories.findMany({
                orderBy: { name: 'asc' }
            });
            res.json(categories);
        } catch (error) {
            console.error('Erro ao listar categorias:', error);
            res.status(500).json({ error: 'Erro ao listar categorias' });
        }
    },

    // Criar nova categoria
    async create(req, res) {
        const { name, description, color } = req.body;
        try {
            const category = await prisma.expense_categories.create({
                data: {
                    name,
                    description,
                    color
                }
            });
            res.status(201).json(category);
        } catch (error) {
            console.error('Erro ao criar categoria:', error);
            res.status(500).json({ error: 'Erro ao criar categoria' });
        }
    },

    // Atualizar categoria
    async update(req, res) {
        const { id } = req.params;
        const { name, description, color } = req.body;
        try {
            const category = await prisma.expense_categories.update({
                where: { id },
                data: {
                    name,
                    description,
                    color,
                    updated_at: new Date()
                }
            });
            res.json(category);
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }
            res.status(500).json({ error: 'Erro ao atualizar categoria' });
        }
    },

    // Excluir categoria
    async delete(req, res) {
        const { id } = req.params;
        try {
            // Verificar se está em uso
            const check = await prisma.accounts_payable.findFirst({
                where: { category_id: id }
            });

            if (check) {
                return res.status(400).json({ error: 'Categoria em uso por contas a pagar' });
            }

            await prisma.expense_categories.delete({
                where: { id }
            });

            res.json({ message: 'Categoria excluída com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }
            res.status(500).json({ error: 'Erro ao excluir categoria' });
        }
    }
};
