import { prisma } from '../db.js';
import { isValidCPF, formatCPF, formatCNPJ } from '../utils/validators.js';

class CustomersController {
    // Listar clientes com paginação e busca
    async list(req, res) {
        try {
            const { page = 1, limit = 10, search, sortBy, sortOrder = 'desc', species } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const where = {};
            if (search) {
                const searchDigits = search.replace(/\D/g, '');

                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { cpf_cnpj: { contains: search } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                    { mobile: { contains: search } }
                ];

                // Se a busca for numérica e tiver tamanho de CPF ou CNPJ, tenta buscar formatado
                if (searchDigits.length === 11) {
                    where.OR.push({ cpf_cnpj: { contains: formatCPF(searchDigits) } });
                } else if (searchDigits.length === 14) {
                    where.OR.push({ cpf_cnpj: { contains: formatCNPJ(searchDigits) } });
                }
            }

            // Filtro por espécie
            if (species && species !== 'all') {
                where.pets = {
                    some: {
                        species: {
                            equals: species,
                            mode: 'insensitive'
                        }
                    }
                };
            }

            // Ordenação
            let orderBy = { name: 'asc' };
            if (sortBy === 'loyalty_points') {
                orderBy = { loyalty_points: sortOrder };
            } else if (sortBy === 'wallet_balance') {
                orderBy = { wallet_balance: sortOrder };
            } else if (sortBy === 'pet_count') {
                orderBy = { pets: { _count: sortOrder } };
            } else if (sortBy === 'name') {
                orderBy = { name: sortOrder };
            }

            const [customers, total] = await Promise.all([
                prisma.customers.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    orderBy,
                    include: {
                        _count: {
                            select: { pets: true }
                        }
                    }
                }),
                prisma.customers.count({ where })
            ]);

            res.json({
                data: customers,
                meta: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            console.error('Erro ao listar clientes:', error);
            res.status(500).json({ error: 'Erro ao listar clientes' });
        }
    }

    // Buscar cliente por ID (com pets e resumo)
    async getById(req, res) {
        try {
            const { id } = req.params;
            const customer = await prisma.customers.findUnique({
                where: { id },
                include: {
                    pets: true,
                    sales: {
                        take: 5,
                        orderBy: { created_at: 'desc' },
                        select: {
                            id: true,
                            sale_number: true,
                            total: true,
                            created_at: true,
                            status: true
                        }
                    }
                }
            });

            if (!customer) {
                return res.status(404).json({ error: 'Cliente não encontrado' });
            }

            res.json(customer);
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            res.status(500).json({ error: 'Erro ao buscar cliente' });
        }
    }

    // Criar novo cliente
    async create(req, res) {
        try {
            const data = req.body;

            // Validar CPF se informado
            if (data.cpf_cnpj) {
                if (!isValidCPF(data.cpf_cnpj)) {
                    return res.status(400).json({ error: 'CPF inválido' });
                }

                const existing = await prisma.customers.findUnique({
                    where: { cpf_cnpj: data.cpf_cnpj }
                });
                if (existing) {
                    return res.status(400).json({ error: 'CPF/CNPJ já cadastrado' });
                }
            }

            // Separar dados de pets se vierem no corpo
            const { pets, ...customerData } = data;

            const customer = await prisma.customers.create({
                data: {
                    ...customerData,
                    pets: pets && pets.length > 0 ? {
                        create: pets
                    } : undefined
                },
                include: { pets: true }
            });

            res.status(201).json(customer);
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            res.status(500).json({ error: 'Erro ao criar cliente' });
        }
    }

    // Atualizar cliente
    async update(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;

            // Validar CPF se alterado
            if (data.cpf_cnpj) {
                if (!isValidCPF(data.cpf_cnpj)) {
                    return res.status(400).json({ error: 'CPF inválido' });
                }

                const existing = await prisma.customers.findFirst({
                    where: {
                        cpf_cnpj: data.cpf_cnpj,
                        id: { not: id }
                    }
                });
                if (existing) {
                    return res.status(400).json({ error: 'CPF/CNPJ já cadastrado em outro cliente' });
                }
            }

            // Remover campos que não devem ser atualizados diretamente ou que são relacionamentos
            const { id: _, pets, sales, _count, created_at, updated_at, ...updateData } = data;

            const customer = await prisma.customers.update({
                where: { id },
                data: updateData
            });

            res.json(customer);
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            res.status(500).json({ error: 'Erro ao atualizar cliente' });
        }
    }

    // Excluir cliente
    async delete(req, res) {
        try {
            const { id } = req.params;

            // Verificar vínculos antes de excluir
            const hasSales = await prisma.sales.findFirst({ where: { customer_id: id } });
            if (hasSales) {
                // Se tem vendas, apenas inativa
                await prisma.customers.update({
                    where: { id },
                    data: { status: 'inactive' }
                });
                return res.json({ message: 'Cliente inativado pois possui histórico de vendas' });
            }

            await prisma.customers.delete({ where: { id } });
            res.json({ message: 'Cliente excluído com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            res.status(500).json({ error: 'Erro ao excluir cliente' });
        }
    }

    // Adicionar Pet
    async addPet(req, res) {
        try {
            const { id } = req.params; // customer_id
            const petData = req.body;

            const pet = await prisma.pets.create({
                data: {
                    ...petData,
                    customer_id: id
                }
            });

            res.status(201).json(pet);
        } catch (error) {
            console.error('Erro ao adicionar pet:', error);
            res.status(500).json({ error: 'Erro ao adicionar pet' });
        }
    }

    // Atualizar Pet
    async updatePet(req, res) {
        try {
            const { petId } = req.params;
            const petData = req.body;

            const pet = await prisma.pets.update({
                where: { id: petId },
                data: petData
            });

            res.json(pet);
        } catch (error) {
            console.error('Erro ao atualizar pet:', error);
            res.status(500).json({ error: 'Erro ao atualizar pet' });
        }
    }

    // Remover Pet
    async deletePet(req, res) {
        try {
            const { petId } = req.params;
            await prisma.pets.delete({ where: { id: petId } });
            res.json({ message: 'Pet removido com sucesso' });
        } catch (error) {
            console.error('Erro ao remover pet:', error);
            res.status(500).json({ error: 'Erro ao remover pet' });
        }
    }
    // Listar transações da carteira
    async getWalletTransactions(req, res) {
        try {
            const { id } = req.params;
            const transactions = await prisma.wallet_transactions.findMany({
                where: { customer_id: id },
                orderBy: { created_at: 'desc' }
            });

            res.json(transactions);
        } catch (error) {
            console.error('Erro ao buscar transações da carteira:', error);
            res.status(500).json({ error: 'Erro ao buscar transações da carteira' });
        }
    }
}

export default new CustomersController();
