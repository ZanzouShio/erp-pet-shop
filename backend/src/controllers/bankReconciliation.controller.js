import { prisma } from '../db.js';

class BankReconciliationController {
    // Listar itens para conciliação (Extrato vs Sistema)
    async index(req, res) {
        const { bank_account_id, start_date, end_date } = req.query;

        if (!bank_account_id) {
            return res.status(400).json({ error: 'Conta bancária é obrigatória' });
        }

        try {
            const start = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 30));
            const end = end_date ? new Date(end_date) : new Date();

            // Ajustar horas
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            // 1. Buscar itens do Extrato (Pendentes)
            const bankTransactions = await prisma.bank_reconciliations.findMany({
                where: {
                    bank_account_id,
                    status: 'pending',
                    bank_transaction_date: {
                        gte: start,
                        lte: end
                    }
                },
                orderBy: { bank_transaction_date: 'asc' }
            });

            // 2. Buscar transações do Sistema (Não conciliadas)
            // Precisamos encontrar transações financeiras dessa conta que NÃO estão na tabela bank_reconciliations (como transaction_id)
            // OU que estão mas com status diferente de 'reconciled' (embora a lógica seja: se tá conciliado, tem link)

            // Vamos buscar todas as transações financeiras do período e conta
            const systemTransactions = await prisma.financial_transactions.findMany({
                where: {
                    bank_account_id,
                    date: {
                        gte: start,
                        lte: end
                    },
                    // Excluir as que já foram conciliadas
                    bank_reconciliations: {
                        none: {}
                    }
                },
                orderBy: { date: 'asc' }
            });

            res.json({
                bankTransactions,
                systemTransactions
            });

        } catch (error) {
            console.error('Erro ao listar conciliação:', error);
            res.status(500).json({ error: 'Erro ao listar dados para conciliação' });
        }
    }

    // Importar Extrato (Simulado ou CSV)
    async import(req, res) {
        const { bank_account_id, transactions } = req.body;

        try {
            if (!transactions || !Array.isArray(transactions)) {
                throw new Error('Transações inválidas');
            }

            const created = await prisma.$transaction(
                transactions.map(t => prisma.bank_reconciliations.create({
                    data: {
                        bank_account_id,
                        bank_transaction_date: new Date(t.date),
                        bank_description: t.description,
                        bank_amount: String(t.amount),
                        status: 'pending'
                    }
                }))
            );

            res.json({ message: `${created.length} transações importadas com sucesso.` });
        } catch (error) {
            console.error('Erro ao importar extrato:', error);
            res.status(500).json({ error: 'Erro ao importar extrato' });
        }
    }

    // Conciliar (Match Manual)
    async match(req, res) {
        const { bank_reconciliation_id, financial_transaction_id } = req.body;

        try {
            await prisma.$transaction(async (tx) => {
                // 1. Atualizar reconciliação
                await tx.bank_reconciliations.update({
                    where: { id: bank_reconciliation_id },
                    data: {
                        transaction_id: financial_transaction_id,
                        status: 'reconciled',
                        reconciled_at: new Date()
                    }
                });

                // 2. Se a transação financeira estava pendente, marcar como paga?
                // Geralmente conciliação é pós-pagamento. Mas se estiver pendente, confirmamos o pagamento.
                const transaction = await tx.financial_transactions.findUnique({
                    where: { id: financial_transaction_id }
                });

                if (transaction && transaction.status === 'pending') {
                    await tx.financial_transactions.update({
                        where: { id: financial_transaction_id },
                        data: {
                            status: 'paid',
                            paid_date: new Date() // Ou usar a data do banco? Melhor usar data atual de confirmação ou manter a original se for passado.
                        }
                    });
                }
            });

            res.json({ message: 'Conciliação realizada com sucesso' });
        } catch (error) {
            console.error('Erro ao conciliar:', error);
            res.status(500).json({ error: 'Erro ao realizar conciliação' });
        }
    }

    // Criar e Conciliar (Quando não existe no sistema)
    async createAndMatch(req, res) {
        const { bank_reconciliation_id, transaction_data } = req.body;
        // transaction_data: { description, category, ... }

        try {
            await prisma.$transaction(async (tx) => {
                // 1. Buscar dados do item bancário para garantir valores
                const bankItem = await tx.bank_reconciliations.findUnique({
                    where: { id: bank_reconciliation_id }
                });

                if (!bankItem) throw new Error('Item do extrato não encontrado');

                // 2. Criar Transação Financeira
                const newTransaction = await tx.financial_transactions.create({
                    data: {
                        type: Number(bankItem.bank_amount) >= 0 ? 'revenue' : 'expense',
                        amount: Math.abs(Number(bankItem.bank_amount)),
                        description: transaction_data.description || bankItem.bank_description,
                        date: bankItem.bank_transaction_date,
                        issue_date: bankItem.bank_transaction_date,
                        due_date: bankItem.bank_transaction_date,
                        paid_date: bankItem.bank_transaction_date,
                        status: 'paid',
                        category: transaction_data.category || 'Ajuste Bancário',
                        bank_account_id: bankItem.bank_account_id,
                        payment_method: 'Transferência/Outros'
                    }
                });

                // 3. Atualizar Reconciliação
                await tx.bank_reconciliations.update({
                    where: { id: bank_reconciliation_id },
                    data: {
                        transaction_id: newTransaction.id,
                        status: 'reconciled',
                        reconciled_at: new Date()
                    }
                });
            });

            res.json({ message: 'Transação criada e conciliada com sucesso' });
        } catch (error) {
            console.error('Erro ao criar e conciliar:', error);
            res.status(500).json({ error: 'Erro ao processar operação' });
        }
    }
}

export default new BankReconciliationController();
