import { prisma } from '../db.js';

class AccountsReceivableController {
    // Listar títulos (com filtros)
    async index(req, res) {
        const { start_date, end_date, status, customer_id } = req.query;
        console.log('📥 GET /accounts-receivable - Filtros:', { start_date, end_date, status, customer_id });

        try {
            // --- AUTO-SETTLEMENT LOGIC ---
            // Verifica títulos vencidos de cartões/pix que devem ser baixados automaticamente
            // Isso garante que ao abrir o sistema no dia seguinte, o que era D+1 esteja pago.
            const autoSettleMethods = ['credit_card', 'debit_card', 'pix'];

            const pendingAutoSettle = await prisma.accounts_receivable.findMany({
                where: {
                    status: 'pending',
                    due_date: { lte: new Date() }, // Vencidos ou vencendo hoje
                    payment_method: { in: autoSettleMethods }
                }
            });

            if (pendingAutoSettle.length > 0) {
                console.log(`🔄 Auto-settling ${pendingAutoSettle.length} titles...`);

                await prisma.$transaction(async (tx) => {
                    for (const title of pendingAutoSettle) {
                        const pDate = new Date(); // Data da baixa é hoje (momento que o sistema "percebeu") ou deveria ser a due_date?
                        // Geralmente a conciliação ocorre quando o dinheiro cai. Se era D+1, caiu na due_date.
                        // Vamos usar a due_date como data de pagamento para ficar coerente com a previsão, 
                        // ou NOW() se quisermos registrar quando o sistema processou.
                        // O usuário disse "baixar automaticamente quando eu abrir o sistema amanhã".
                        // Se eu abrir dia 05 e venceu dia 04, o dinheiro caiu dia 04.
                        const settlementDate = title.due_date;

                        // Atualizar título
                        await tx.accounts_receivable.update({
                            where: { id: title.id },
                            data: {
                                status: 'paid',
                                paid_date: settlementDate,
                                updated_at: new Date()
                            }
                        });

                        // Criar transação financeira
                        const config = await tx.payment_methods_config.findUnique({
                            where: { id: title.payment_config_id }
                        });

                        let bankAccountId = null;
                        if (config && config.bank_account_id) {
                            bankAccountId = config.bank_account_id;
                            // Atualizar saldo bancário
                            await tx.bank_accounts.update({
                                where: { id: bankAccountId },
                                data: { current_balance: { increment: title.net_amount } }
                            });
                        }

                        await tx.financial_transactions.create({
                            data: {
                                type: 'revenue',
                                amount: title.net_amount,
                                description: `Recebimento Automático: ${title.description}`,
                                date: settlementDate,
                                issue_date: settlementDate,
                                due_date: title.due_date,
                                category: 'Recebimento de Cliente',
                                payment_method: title.payment_method,
                                status: 'paid',
                                customer_id: title.customer_id,
                                payment_config_id: title.payment_config_id,
                                bank_account_id: bankAccountId
                            }
                        });
                    }
                });
                console.log('✅ Auto-settlement complete.');
            }
            // -----------------------------

            const where = {};

            if (start_date) {
                where.due_date = { ...where.due_date, gte: new Date(start_date) };
            }
            if (end_date) {
                where.due_date = { ...where.due_date, lte: new Date(end_date) };
            }
            if (status && status !== 'Todos') { // Frontend envia 'Todos' as vezes
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

                // 3. Verificar configuração de pagamento para atualização bancária
                let bankAccountId = null;
                if (title.payment_config_id) {
                    const config = await tx.payment_methods_config.findUnique({
                        where: { id: title.payment_config_id }
                    });

                    if (config && config.bank_account_id) {
                        bankAccountId = config.bank_account_id;
                        // Atualizar saldo bancário
                        await tx.bank_accounts.update({
                            where: { id: bankAccountId },
                            data: { current_balance: { increment: title.net_amount } }
                        });
                    }
                }

                // 4. Registrar transação financeira (Entrada)
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
                        customer_id: title.customer_id,
                        payment_config_id: title.payment_config_id,
                        bank_account_id: bankAccountId
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
