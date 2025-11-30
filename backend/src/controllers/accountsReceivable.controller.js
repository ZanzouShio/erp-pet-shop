import { prisma } from '../db.js';

class AccountsReceivableController {
    // Listar títulos (com filtros)
    async index(req, res) {
        const { start_date, end_date, status, customer_id } = req.query;
        console.log('📥 GET /accounts-receivable - Filtros:', { start_date, end_date, status, customer_id });

        try {
            const where = {};

            if (start_date) {
                where.due_date = { ...where.due_date, gte: new Date(start_date) };
            }
            if (end_date) {
                where.due_date = { ...where.due_date, lte: new Date(end_date) };
            }
            if (status) {
                where.status = status;
            }
            if (customer_id) {
                where.customer_id = customer_id;
            }

            const titles = await prisma.accounts_receivable.findMany({
                where,
                include: {
                    customers: {
                        select: { name: true }
                    }
                },
                orderBy: { due_date: 'asc' }
            });

            // Mapear para manter compatibilidade com o frontend (customer_name)
            const formattedTitles = titles.map(t => ({
                ...t,
                customer_name: t.customers?.name
            }));

            console.log(`📤 Retornando ${formattedTitles.length} registros`);
            res.json(formattedTitles);
        } catch (error) {
            console.error('Erro ao listar contas a receber:', error);
            res.status(500).json({ error: 'Erro ao listar contas a receber' });
        }
    }

    // Obter carteira do cliente (resumo e títulos)
    async getByCustomer(req, res) {
        const { customerId } = req.params;
        try {
            const titles = await prisma.accounts_receivable.findMany({
                where: { customer_id: customerId },
                orderBy: { due_date: 'asc' }
            });

            const pending = await prisma.accounts_receivable.aggregate({
                where: { customer_id: customerId, status: 'pending' },
                _sum: { amount: true }
            });

            const overdue = await prisma.accounts_receivable.aggregate({
                where: { customer_id: customerId, status: 'overdue' },
                _sum: { amount: true }
            });

            res.json({
                summary: {
                    total_pending: pending._sum.amount || 0,
                    total_overdue: overdue._sum.amount || 0
                },
                titles
            });
        } catch (error) {
            console.error('Erro ao buscar carteira do cliente:', error);
            res.status(500).json({ error: 'Erro ao buscar carteira do cliente' });
        }
    }

    // Baixar título (Recebimento)
    async receive(req, res) {
        const { id } = req.params;
        const { payment_date } = req.body;

        try {
            await prisma.$transaction(async (tx) => {
                // 1. Buscar título
                const title = await tx.accounts_receivable.findUnique({
                    where: { id }
                });

                if (!title) throw new Error('Título não encontrado');
                if (title.status === 'paid') throw new Error('Título já está pago');

                const pDate = payment_date ? new Date(payment_date) : new Date();

                // 2. Atualizar título
                await tx.accounts_receivable.update({
                    where: { id },
                    data: {
                        status: 'paid',
                        paid_date: pDate,
                        updated_at: new Date()
                    }
                });

                // 3. Registrar transação financeira (Entrada)
                await tx.financial_transactions.create({
                    data: {
                        type: 'revenue',
                        amount: title.net_amount,
                        description: `Recebimento: ${title.description}`,
                        date: pDate,
                        issue_date: pDate,
                        due_date: pDate,
                        category: 'Recebimento de Cliente',
                        payment_method: title.payment_method,
                        status: 'paid',
                        customer_id: title.customer_id
                    }
                });
            });

            res.json({ message: 'Título baixado com sucesso' });

        } catch (error) {
            console.error('Erro ao baixar título:', error);
            res.status(500).json({ error: error.message || 'Erro ao baixar título' });
        }
    }
}

export default new AccountsReceivableController();
