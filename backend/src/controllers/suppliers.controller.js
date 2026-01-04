import { prisma } from '../db.js';

class SuppliersController {
    async create(req, res) {
        try {
            const data = req.body;

            // Validar CNPJ único
            const existing = await prisma.suppliers.findUnique({
                where: { cnpj: data.cnpj }
            });

            if (existing) {
                return res.status(400).json({ error: 'CNPJ já cadastrado' });
            }

            const supplier = await prisma.suppliers.create({
                data: {
                    ...data,
                    discount_for_early_payment: data.discount_for_early_payment ? Number(data.discount_for_early_payment) : 0,
                    rating: data.rating ? Number(data.rating) : 0
                }
            });

            res.status(201).json(supplier);
        } catch (error) {
            console.error('Erro ao criar fornecedor:', error);
            res.status(500).json({ error: 'Erro ao criar fornecedor' });
        }
    }

    async getAll(req, res) {
        try {
            const suppliers = await prisma.suppliers.findMany({
                orderBy: { company_name: 'asc' }
            });
            res.json(suppliers);
        } catch (error) {
            console.error('Erro ao listar fornecedores:', error);
            res.status(500).json({ error: 'Erro ao listar fornecedores' });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const supplier = await prisma.suppliers.findUnique({
                where: { id },
                include: {
                    products: {
                        select: {
                            id: true,
                            name: true,
                            cost_price: true,
                            sale_price: true,
                            stock_quantity: true,
                            unit: true
                        },
                        orderBy: {
                            stock_quantity: 'asc'
                        }
                    }
                }
            });

            if (!supplier) {
                return res.status(404).json({ error: 'Fornecedor não encontrado' });
            }

            res.json(supplier);
        } catch (error) {
            console.error('Erro ao buscar fornecedor:', error);
            res.status(500).json({ error: 'Erro ao buscar fornecedor' });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;

            // Verificar se existe
            const existing = await prisma.suppliers.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ error: 'Fornecedor não encontrado' });
            }

            // Verificar CNPJ duplicado (se mudou)
            if (data.cnpj && data.cnpj !== existing.cnpj) {
                const duplicate = await prisma.suppliers.findUnique({ where: { cnpj: data.cnpj } });
                if (duplicate) {
                    return res.status(400).json({ error: 'CNPJ já cadastrado' });
                }
            }

            const supplier = await prisma.suppliers.update({
                where: { id },
                data: {
                    ...data,
                    discount_for_early_payment: data.discount_for_early_payment !== undefined ? Number(data.discount_for_early_payment) : undefined,
                    rating: data.rating !== undefined ? Number(data.rating) : undefined
                }
            });

            res.json(supplier);
        } catch (error) {
            console.error('Erro ao atualizar fornecedor:', error);
            res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            // Verificar dependências (produtos, contas a pagar)
            const productsCount = await prisma.products.count({ where: { supplier_id: id } });
            if (productsCount > 0) {
                return res.status(400).json({ error: 'Não é possível excluir: existem produtos vinculados a este fornecedor.' });
            }

            const financialCount = await prisma.financial_transactions.count({ where: { supplier_id: id } });
            if (financialCount > 0) {
                return res.status(400).json({ error: 'Não é possível excluir: existem transações financeiras vinculadas a este fornecedor.' });
            }

            await prisma.suppliers.delete({ where: { id } });
            res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir fornecedor:', error);
            res.status(500).json({ error: 'Erro ao excluir fornecedor' });
        }
    }
}

export default new SuppliersController();
