import { prisma } from '../db.js';

export const cashFlowController = {
    // Obter projeções de fluxo de caixa (Saldo Diário)
    async getProjections(req, res) {
        try {
            const { startDate, endDate } = req.query;

            // Ajustar datas para cobrir o dia inteiro
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            // 1. Obter Saldo Atual das Contas Bancárias
            const bankAccounts = await prisma.bank_accounts.findMany({
                where: { is_active: true }
            });
            const currentBalance = bankAccounts.reduce((acc, curr) => acc + Number(curr.current_balance), 0);

            // 2. Buscar Transações Realizadas (Histórico)
            // Consideramos 'date' para o fluxo de caixa realizado
            const transactions = await prisma.financial_transactions.findMany({
                where: {
                    date: {
                        gte: start,
                        lte: end
                    }
                }
            });

            // 3. Buscar Contas a Receber (Pendentes - Futuro)
            const receivables = await prisma.accounts_receivable.groupBy({
                by: ['due_date'],
                where: {
                    status: 'pending',
                    due_date: {
                        gte: start,
                        lte: end
                    }
                },
                _sum: {
                    amount: true
                }
            });

            // 4. Buscar Contas a Pagar (Pendentes - Futuro)
            const payables = await prisma.accounts_payable.groupBy({
                by: ['due_date'],
                where: {
                    status: 'pending',
                    due_date: {
                        gte: start,
                        lte: end
                    }
                },
                _sum: {
                    amount: true
                }
            });

            // 5. Consolidar Dados por Dia
            const projections = [];

            // Criar mapa de datas
            const dateMap = new Map();

            // Helper para adicionar ao mapa
            const addToMap = (date, type, amount) => {
                const dateStr = date.toISOString().split('T')[0];
                if (!dateMap.has(dateStr)) dateMap.set(dateStr, { in: 0, out: 0 });
                const entry = dateMap.get(dateStr);
                if (type === 'in') entry.in += Number(amount);
                if (type === 'out') entry.out += Number(amount);
            };

            // Processar Transações Realizadas
            transactions.forEach(t => {
                if (t.type === 'revenue') addToMap(t.date, 'in', t.amount);
                if (t.type === 'expense') addToMap(t.date, 'out', t.amount);
            });

            // Processar Recebíveis Pendentes
            receivables.forEach(r => {
                addToMap(r.due_date, 'in', r._sum.amount || 0);
            });

            // Processar Pagáveis Pendentes
            payables.forEach(p => {
                addToMap(p.due_date, 'out', p._sum.amount || 0);
            });

            // Ordenar datas
            const sortedDates = Array.from(dateMap.keys()).sort();

            // Calcular saldo acumulado
            // NOTA: O saldo acumulado aqui é uma projeção simples partindo do saldo ATUAL.
            // Para datas passadas, isso pode não refletir o saldo histórico exato, 
            // mas mostra a tendência se tivéssemos esse saldo.
            // Para o gráfico de "Receitas vs Despesas", usamos apenas 'in' e 'out'.

            let runningBalance = currentBalance;

            // Se quisermos um gráfico de saldo contínuo, precisamos decidir o ponto de partida.
            // Por simplicidade, vamos calcular o saldo projetado APENAS para o futuro (a partir de hoje).
            // Para o passado, o saldo não faz tanto sentido nessa visualização híbrida sem reconstrução histórica completa.
            // Mas o usuário pediu "entradas e saídas", então o foco é nas barras/áreas.

            // Vamos iterar para construir o array final
            for (const date of sortedDates) {
                const dayData = dateMap.get(date);

                // Apenas atualiza o runningBalance se a data for futura ou hoje?
                // Não, vamos deixar o saldo fluir, mas o frontend deve saber interpretar.
                // Se a data for anterior a hoje, o saldo calculado aqui será (Saldo Atual + Movimentação Passada),
                // o que é matematicamente estranho (seria Saldo Futuro).
                // CORREÇÃO: O saldo projetado deve ser:
                // Saldo(d) = Saldo(d-1) + Entradas(d) - Saídas(d)
                // Mas não temos o Saldo(d-1) inicial (lá no passado).
                // Temos o Saldo(Hoje).
                // Então: Saldo(Amanhã) = Saldo(Hoje) + Entradas(Amanhã) - Saídas(Amanhã).
                // E Saldo(Ontem)? Seria Saldo(Hoje) - Entradas(Hoje) + Saídas(Hoje).
                // Vamos implementar essa lógica de "Reconstrução Reversa" para o passado?
                // É mais seguro apenas retornar in/out e deixar o saldo projetado ser calculado apenas do dia atual para frente.

                projections.push({
                    date,
                    in: dayData.in,
                    out: dayData.out,
                    // O balance será calculado no frontend ou ignorado para datas passadas
                    balance: 0
                });
            }

            // Recalcular saldo projetado (apenas do dia atual para frente)
            const todayStr = new Date().toISOString().split('T')[0];
            let futureBalance = currentBalance;

            // Ordenar projeções
            projections.sort((a, b) => a.date.localeCompare(b.date));

            // Ajustar balances
            // 1. Encontrar índice de hoje
            const todayIndex = projections.findIndex(p => p.date >= todayStr);

            if (todayIndex !== -1) {
                // Do dia atual para frente: Saldo Acumulado
                for (let i = todayIndex; i < projections.length; i++) {
                    futureBalance = futureBalance + projections[i].in - projections[i].out;
                    projections[i].balance = futureBalance;
                }
                // Para trás: não calculamos saldo (fica 0), pois exigiria histórico de saldo inicial
            }

            res.json({
                current_balance: currentBalance,
                projections
            });

        } catch (error) {
            console.error('Erro ao obter projeções de fluxo de caixa:', error);
            res.status(500).json({ error: 'Erro ao obter projeções' });
        }
    },

    // Obter visão detalhada (D+7, D+15, D+30 ou Custom)
    async getDailyView(req, res) {
        try {
            const { days, startDate: queryStart, endDate: queryEnd } = req.query;

            let start, end;

            if (queryStart && queryEnd) {
                start = new Date(queryStart);
                start.setHours(0, 0, 0, 0);

                end = new Date(queryEnd);
                end.setHours(23, 59, 59, 999);
            } else {
                start = new Date();
                start.setHours(0, 0, 0, 0);

                end = new Date();
                end.setDate(end.getDate() + Number(days || 30));
                end.setHours(23, 59, 59, 999);
            }

            // Buscar Transações Realizadas (Histórico)
            const transactions = await prisma.financial_transactions.findMany({
                where: {
                    date: {
                        gte: start,
                        lte: end
                    }
                },
                include: {
                    customers: { select: { name: true } },
                    suppliers: { select: { trade_name: true } },
                    chart_of_accounts: { select: { name: true } } // Categoria
                },
                orderBy: { date: 'asc' }
            });

            // Buscar Recebíveis Detalhados (Pendentes)
            const receivables = await prisma.accounts_receivable.findMany({
                where: {
                    status: 'pending',
                    due_date: {
                        gte: start,
                        lte: end
                    }
                },
                include: {
                    customers: { select: { name: true } }
                },
                orderBy: { due_date: 'asc' }
            });

            // Buscar Pagáveis Detalhados (Pendentes)
            const payables = await prisma.accounts_payable.findMany({
                where: {
                    status: 'pending',
                    due_date: {
                        gte: start,
                        lte: end
                    }
                },
                include: {
                    suppliers: { select: { trade_name: true } },
                    expense_categories: { select: { name: true, color: true } }
                },
                orderBy: { due_date: 'asc' }
            });

            // Formatar Transações Realizadas
            const formattedTransactions = transactions.map(t => ({
                id: t.id,
                type: t.type === 'revenue' ? 'in' : 'out',
                description: t.description,
                entity: t.customer_id ? t.customers?.name : (t.supplier_id ? t.suppliers?.trade_name : 'Outros'),
                category: t.category || t.chart_of_accounts?.name,
                amount: Number(t.amount),
                date: t.date,
                status: 'paid'
            }));

            // Formatar resposta
            const formattedReceivables = receivables.map(r => ({
                id: r.id,
                type: 'in',
                description: r.description,
                entity: r.customers?.name || 'Cliente Balcão',
                amount: Number(r.amount),
                date: r.due_date,
                status: r.status
            }));

            const formattedPayables = payables.map(p => ({
                id: p.id,
                type: 'out',
                description: p.description,
                entity: p.suppliers?.trade_name || 'Fornecedor Diverso',
                category: p.expense_categories?.name,
                color: p.expense_categories?.color,
                amount: Number(p.amount),
                date: p.due_date,
                status: p.status
            }));

            // Combinar e ordenar
            const allTransactions = [...formattedTransactions, ...formattedReceivables, ...formattedPayables].sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            );

            res.json(allTransactions);

        } catch (error) {
            console.error('Erro ao obter visão detalhada:', error);
            res.status(500).json({ error: 'Erro ao obter visão detalhada' });
        }
    }
};
