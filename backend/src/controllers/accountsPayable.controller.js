import { prisma } from '../db.js';

export const accountsPayableController = {
    // Listar contas com filtros
    async list(req, res) {
        try {
            const { startDate, endDate, status, supplierId, categoryId } = req.query;

            const where = {};

            if (startDate) {
                where.due_date = { ...where.due_date, gte: new Date(startDate) };
            }
            if (endDate) {
                // Ajustar para final do dia para garantir inclusão de todos os registros
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                where.due_date = { ...where.due_date, lte: end };
            }
            if (status && status !== 'ALL') {
                where.status = status;
            }
            if (supplierId) {
                where.supplier_id = supplierId;
            }
            if (categoryId) {
                where.category_id = categoryId;
            }

            const accounts = await prisma.accounts_payable.findMany({
                where,
                include: {
                    suppliers: {
                        select: { trade_name: true }
                    },
                    expense_categories: {
                        select: { name: true, color: true }
                    },
                    financial_transactions: {
                        select: {
                            amount: true,
                            paid_date: true,
                            payment_method: true,
                            bank_accounts: { select: { name: true } },
                            interest: true,
                            discount: true
                        }
                    }
                },
                orderBy: { due_date: 'asc' }
            });

            // Buscar motivos de cancelamento para contas canceladas
            const cancelledIds = accounts
                .filter(acc => acc.status === 'cancelled')
                .map(acc => acc.id);

            let cancelReasons = {};
            if (cancelledIds.length > 0) {
                const logs = await prisma.audit_logs.findMany({
                    where: {
                        entity_type: 'accounts_payable',
                        entity_id: { in: cancelledIds },
                        action: 'CANCEL'
                    },
                    orderBy: { created_at: 'desc' },
                    select: { entity_id: true, reason: true }
                });

                logs.forEach(log => {
                    // Pega apenas o primeiro (mais recente) motivo encontrado para cada ID
                    if (!cancelReasons[log.entity_id]) {
                        cancelReasons[log.entity_id] = log.reason;
                    }
                });
            }

            // Mapear para formato amigável ao frontend
            const formattedAccounts = accounts.map(acc => ({
                ...acc,
                supplier_name: acc.suppliers?.trade_name,
                category_name: acc.expense_categories?.name,
                category_color: acc.expense_categories?.color,
                cancel_reason: cancelReasons[acc.id] || null
            }));

            res.json(formattedAccounts);
        } catch (error) {
            console.error('Erro ao listar contas a pagar:', error);
            res.status(500).json({ error: 'Erro ao listar contas a pagar' });
        }
    },

    // Criar nova conta
    async create(req, res) {
        try {
            const {
                description, amount, due_date, supplier_id, category_id,
                recurrence, installments, notes
            } = req.body;

            const newAccount = await prisma.accounts_payable.create({
                data: {
                    description,
                    amount,
                    due_date: new Date(due_date),
                    supplier_id: supplier_id || null,
                    category_id,
                    recurrence,
                    installments,
                    notes,
                    status: 'pending'
                }
            });

            res.status(201).json(newAccount);
        } catch (error) {
            console.error('Erro ao criar conta a pagar:', error);
            res.status(500).json({ error: 'Erro ao criar conta a pagar' });
        }
    },

    // Registrar pagamento (Baixa)
    async pay(req, res) {
        const { id } = req.params;
        const { amount_paid, payment_date, payment_method, account_id } = req.body;

        try {
            await prisma.$transaction(async (tx) => {
                // 1. Buscar conta atual
                const bill = await tx.accounts_payable.findUnique({
                    where: { id }
                });

                if (!bill) {
                    throw new Error('Conta não encontrada');
                }

                // 2. Calcular novo total pago e status
                const currentPaid = Number(bill.total_paid) || 0;
                const newTotalPaid = currentPaid + Number(amount_paid);
                let newStatus = bill.status;

                if (newTotalPaid >= Number(bill.amount)) {
                    newStatus = 'paid';
                } else {
                    newStatus = 'partial';
                }

                const pDate = payment_date ? new Date(payment_date) : new Date();

                // 3. Atualizar conta a pagar
                const updatedBill = await tx.accounts_payable.update({
                    where: { id },
                    data: {
                        total_paid: newTotalPaid,
                        status: newStatus,
                        payment_date: pDate,
                        updated_at: new Date()
                    }
                });

                // Buscar nome da categoria para histórico
                let categoryName = 'Pagamento de Conta';
                if (bill.category_id) {
                    const category = await tx.expense_categories.findUnique({
                        where: { id: bill.category_id },
                        select: { name: true }
                    });
                    if (category) categoryName = category.name;
                }

                // Atualizar saldo bancário se informado
                let bankAccountId = account_id || null;
                if (bankAccountId) {
                    await tx.bank_accounts.update({
                        where: { id: bankAccountId },
                        data: { current_balance: { decrement: Number(amount_paid) } }
                    });
                }

                // 4. Registrar transação financeira (saída)
                await tx.financial_transactions.create({
                    data: {
                        type: 'expense',
                        amount: amount_paid,
                        description: `Pagamento: ${bill.description}`,
                        date: pDate,
                        issue_date: pDate,
                        due_date: bill.due_date,
                        paid_date: pDate,
                        category: categoryName,
                        payment_method: payment_method,
                        account_payable_id: id,
                        status: 'paid',
                        supplier_id: bill.supplier_id,
                        cost_center_id: null,
                        bank_account_id: bankAccountId
                    }
                });

                return { updatedBill, bankAccountId };
            });

            res.json({ message: 'Pagamento registrado com sucesso' });

        } catch (error) {
            console.error('Erro ao pagar conta:', error);
            res.status(500).json({ error: error.message || 'Erro ao processar pagamento' });
        }
    },

    // Excluir conta
    async delete(req, res) {
        const { id } = req.params;
        try {
            await prisma.accounts_payable.delete({
                where: { id }
            });
            res.json({ message: 'Conta excluída com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Conta não encontrada' });
            }
            res.status(500).json({ error: 'Erro ao excluir conta' });
        }
    },

    // Cancelar conta (soft delete com auditoria)
    async cancel(req, res) {
        const { id } = req.params;
        const { reason } = req.body;

        try {
            await prisma.$transaction(async (tx) => {
                // 1. Buscar conta atual
                const bill = await tx.accounts_payable.findUnique({
                    where: { id }
                });

                if (!bill) {
                    throw new Error('Conta não encontrada');
                }

                if (bill.status === 'cancelled') {
                    throw new Error('Conta já está cancelada');
                }

                if (bill.status === 'paid') {
                    throw new Error('Não é possível cancelar uma conta já paga');
                }

                // 2. Atualizar status para cancelado
                await tx.accounts_payable.update({
                    where: { id },
                    data: {
                        status: 'cancelled',
                        updated_at: new Date()
                    }
                });

                // 3. Registrar log de auditoria
                await tx.audit_logs.create({
                    data: {
                        action: 'CANCEL',
                        entity_type: 'accounts_payable',
                        entity_id: id,
                        description: `Conta cancelada: ${bill.description} - R$ ${Number(bill.amount).toFixed(2)}`,
                        reason: reason || 'Sem motivo informado',
                        metadata: {
                            old_status: bill.status,
                            amount: bill.amount,
                            due_date: bill.due_date,
                            supplier_id: bill.supplier_id,
                            category_id: bill.category_id
                        }
                    }
                });
            });

            res.json({ message: 'Conta cancelada com sucesso' });

        } catch (error) {
            console.error('Erro ao cancelar conta:', error);
            res.status(500).json({ error: error.message || 'Erro ao cancelar conta' });
        }
    }
};
