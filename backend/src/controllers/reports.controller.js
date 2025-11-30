import { prisma } from '../db.js';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, addDays } from 'date-fns';

class ReportsController {
    // 1. Resumo de Vendas do Dia
    async getDailySalesSummary(req, res) {
        try {
            const dateParam = req.query.date ? new Date(req.query.date) : new Date();
            const todayStart = startOfDay(dateParam);
            const todayEnd = endOfDay(dateParam);

            // Comparativos
            const yesterdayStart = startOfDay(subDays(dateParam, 1));
            const yesterdayEnd = endOfDay(subDays(dateParam, 1));
            const lastWeekStart = startOfDay(subDays(dateParam, 7));
            const lastWeekEnd = endOfDay(subDays(dateParam, 7));

            // Função auxiliar para buscar totais
            const getTotals = async (start, end) => {
                const aggregations = await prisma.sales.aggregate({
                    where: {
                        created_at: { gte: start, lte: end },
                        status: 'completed'
                    },
                    _sum: { total: true },
                    _count: { id: true }
                });
                return {
                    total: Number(aggregations._sum.total || 0),
                    count: aggregations._count.id,
                    ticket: aggregations._count.id > 0 ? Number(aggregations._sum.total || 0) / aggregations._count.id : 0
                };
            };

            const [today, yesterday, lastWeek] = await Promise.all([
                getTotals(todayStart, todayEnd),
                getTotals(yesterdayStart, yesterdayEnd),
                getTotals(lastWeekStart, lastWeekEnd)
            ]);

            // Top Produtos
            const topProducts = await prisma.sale_items.groupBy({
                by: ['product_id'],
                where: {
                    sales: {
                        created_at: { gte: todayStart, lte: todayEnd },
                        status: 'completed'
                    }
                },
                _sum: {
                    quantity: true,
                    total: true
                },
                orderBy: {
                    _sum: { total: 'desc' }
                },
                take: 10
            });

            // Buscar nomes dos produtos
            const topProductsWithNames = await Promise.all(topProducts.map(async (item) => {
                const product = await prisma.products.findUnique({
                    where: { id: item.product_id },
                    select: { name: true }
                });
                return {
                    name: product?.name || 'Desconhecido',
                    quantity: Number(item._sum.quantity || 0),
                    total: Number(item._sum.total || 0)
                };
            }));

            // Formas de Pagamento
            const paymentMethods = await prisma.sale_payments.groupBy({
                by: ['payment_method'],
                where: {
                    sales: {
                        created_at: { gte: todayStart, lte: todayEnd },
                        status: 'completed'
                    }
                },
                _sum: { amount: true }
            });

            // Vendas por Operador
            const salesByOperator = await prisma.sales.groupBy({
                by: ['user_id'],
                where: {
                    created_at: { gte: todayStart, lte: todayEnd },
                    status: 'completed'
                },
                _sum: { total: true },
                _count: { id: true }
            });

            const operatorsWithNames = await Promise.all(salesByOperator.map(async (item) => {
                const user = await prisma.users.findUnique({
                    where: { id: item.user_id },
                    select: { name: true }
                });
                return {
                    name: user?.name || 'Desconhecido',
                    total: Number(item._sum.total || 0),
                    count: item._count.id
                };
            }));

            res.json({
                date: dateParam,
                summary: {
                    today,
                    yesterday,
                    lastWeek
                },
                topProducts: topProductsWithNames,
                paymentMethods: paymentMethods.map(p => ({
                    method: p.payment_method,
                    total: Number(p._sum.amount || 0)
                })),
                salesByOperator: operatorsWithNames
            });

        } catch (error) {
            console.error('Erro ao gerar resumo de vendas:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório' });
        }
    }
    // 2. Posição de Caixa
    async getCashPosition(req, res) {
        try {
            const dateParam = req.query.date ? new Date(req.query.date) : new Date();
            const start = startOfDay(dateParam);
            const end = endOfDay(dateParam);

            // 1. Saldo Atual de todas as contas
            const bankAccounts = await prisma.bank_accounts.findMany();
            const currentBalance = bankAccounts.reduce((acc, accItem) => acc + Number(accItem.current_balance), 0);

            // 2. Movimentações do dia (apenas pagas)
            const transactions = await prisma.financial_transactions.findMany({
                where: {
                    paid_date: { gte: start, lte: end },
                    status: 'paid'
                }
            });

            const inflows = transactions
                .filter(t => t.type === 'revenue')
                .reduce((acc, t) => acc + Number(t.amount), 0);

            const outflows = transactions
                .filter(t => t.type === 'expense')
                .reduce((acc, t) => acc + Number(t.amount), 0);

            // 3. Saldo Inicial do Dia (Estimado)
            // Se estamos vendo o dia de hoje, Saldo Inicial = Saldo Atual - Entradas + Saídas
            // Se for data passada, essa lógica não funciona perfeitamente sem histórico de saldo diário.
            // Para simplificar neste MVP, assumiremos que o relatório é focado no "Hoje" ou que o saldo atual reflete o estado pós-transações.
            // Para datas passadas, o ideal seria reconstruir o saldo, mas é complexo sem tabela de snapshot.
            // Vamos mostrar o Saldo Atual (Real do Banco) e as movimentações da data selecionada.

            // Cálculo do "Saldo do Dia" (Apenas movimentação)
            const dayBalance = inflows - outflows;

            // 4. Detalhamento por Método de Pagamento (Entradas)
            const paymentMethods = transactions
                .filter(t => t.type === 'revenue')
                .reduce((acc, t) => {
                    const method = t.payment_method || 'Outros';
                    acc[method] = (acc[method] || 0) + Number(t.amount);
                    return acc;
                }, {});

            res.json({
                date: dateParam,
                currentBalance, // Saldo acumulado real das contas hoje
                daySummary: {
                    inflows,
                    outflows,
                    balance: dayBalance
                },
                paymentMethods: Object.entries(paymentMethods).map(([method, total]) => ({ method, total }))
            });

        } catch (error) {
            console.error('Erro ao gerar posição de caixa:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório' });
        }
    }
    // 3. Situação Financeira
    async getFinancialSituation(req, res) {
        try {
            const today = startOfDay(new Date());
            const next7Days = endOfDay(addDays(today, 7));

            // 1. Contas a Pagar/Receber Hoje
            const todayPayable = await prisma.financial_transactions.aggregate({
                where: {
                    type: 'expense',
                    status: 'pending',
                    due_date: { gte: today, lte: endOfDay(today) }
                },
                _sum: { amount: true },
                _count: { id: true }
            });

            const todayReceivable = await prisma.financial_transactions.aggregate({
                where: {
                    type: 'revenue',
                    status: 'pending',
                    due_date: { gte: today, lte: endOfDay(today) }
                },
                _sum: { amount: true },
                _count: { id: true }
            });

            // 2. Inadimplência (Atrasados)
            const overduePayable = await prisma.financial_transactions.aggregate({
                where: {
                    type: 'expense',
                    status: 'pending',
                    due_date: { lt: today }
                },
                _sum: { amount: true },
                _count: { id: true }
            });

            const overdueReceivable = await prisma.financial_transactions.aggregate({
                where: {
                    type: 'revenue',
                    status: 'pending',
                    due_date: { lt: today }
                },
                _sum: { amount: true },
                _count: { id: true }
            });

            // 3. Previsão 7 dias
            const forecastRaw = await prisma.financial_transactions.groupBy({
                by: ['due_date', 'type'],
                where: {
                    status: 'pending',
                    due_date: { gte: today, lte: next7Days }
                },
                _sum: { amount: true }
            });

            // Organizar forecast por dia
            const forecastMap = {};
            // Inicializar próximos 7 dias
            for (let i = 0; i <= 7; i++) {
                const d = addDays(today, i).toISOString().split('T')[0];
                forecastMap[d] = { date: d, payable: 0, receivable: 0 };
            }

            forecastRaw.forEach(item => {
                const d = item.due_date.toISOString().split('T')[0];
                if (forecastMap[d]) {
                    if (item.type === 'expense') forecastMap[d].payable += Number(item._sum.amount || 0);
                    if (item.type === 'revenue') forecastMap[d].receivable += Number(item._sum.amount || 0);
                }
            });

            res.json({
                date: today,
                today: {
                    payable: { total: Number(todayPayable._sum.amount || 0), count: todayPayable._count.id },
                    receivable: { total: Number(todayReceivable._sum.amount || 0), count: todayReceivable._count.id }
                },
                overdue: {
                    payable: { total: Number(overduePayable._sum.amount || 0), count: overduePayable._count.id },
                    receivable: { total: Number(overdueReceivable._sum.amount || 0), count: overdueReceivable._count.id }
                },
                forecast: Object.values(forecastMap)
            });

        } catch (error) {
            console.error('Erro ao gerar situação financeira:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório' });
        }
    }
    // 4. Alertas de Estoque
    async getStockAlerts(req, res) {
        console.log('Iniciando geração de alertas de estoque...');
        try {
            const today = startOfDay(new Date());
            const thirtyDaysFromNow = addDays(today, 30);
            const thirtyDaysAgo = subDays(today, 30);

            // 1. Estoque Baixo (Abaixo do Mínimo)
            console.log('Buscando estoque baixo...');
            // Prisma não suporta comparação direta de colunas no where, usamos queryRaw
            // Necessário converter BigInt/Decimal para Number para evitar erro de serialização
            const lowStockRaw = await prisma.$queryRaw`
                SELECT id, name, stock_quantity, min_stock, unit
                FROM products
                WHERE stock_quantity <= min_stock
                AND is_active = true
                LIMIT 20
            `;

            const lowStock = Array.isArray(lowStockRaw) ? lowStockRaw.map(p => ({
                id: p.id,
                name: p.name,
                stock_quantity: Number(p.stock_quantity),
                min_stock: Number(p.min_stock),
                unit: p.unit
            })) : [];

            // 2. Estoque Zerado
            console.log('Buscando estoque zerado...');
            const outOfStock = await prisma.products.findMany({
                where: {
                    stock_quantity: { lte: 0 },
                    is_active: true
                },
                select: { id: true, name: true, unit: true },
                take: 20
            });

            // 3. Lotes Vencendo (Próximos 30 dias) ou Vencidos
            console.log('Buscando lotes vencendo...');
            const expiringBatches = await prisma.product_batches.findMany({
                where: {
                    expiry_date: { lte: thirtyDaysFromNow },
                    quantity: { gt: 0 }
                },
                include: {
                    products: { select: { name: true, unit: true } }
                },
                orderBy: { expiry_date: 'asc' },
                take: 20
            });

            // 4. Produtos sem Giro (Sem vendas nos últimos 30 dias)
            console.log('Buscando produtos sem giro...');
            const soldProductIds = await prisma.sale_items.findMany({
                where: {
                    sales: {
                        created_at: { gte: thirtyDaysAgo }
                    }
                },
                select: { product_id: true },
                distinct: ['product_id']
            });

            const soldIds = soldProductIds.map(item => item.product_id);

            // const slowMoving = await prisma.products.findMany({
            //     where: {
            //         id: { notIn: soldIds },
            //         is_active: true,
            //         stock_quantity: { gt: 0 } 
            //     },
            //     select: { id: true, name: true, stock_quantity: true, last_sync_at: true },
            //     take: 20
            // });
            const slowMoving = [];

            console.log('Relatório gerado com sucesso.');
            res.json({
                date: today,
                lowStock,
                outOfStock,
                expiringBatches: expiringBatches.map(b => ({
                    id: b.id,
                    productName: b.products.name,
                    batchNumber: b.batch_number,
                    expiryDate: b.expiry_date,
                    quantity: Number(b.quantity),
                    unit: b.products.unit
                })),
                slowMoving: slowMoving.map(p => ({
                    ...p,
                    stock_quantity: Number(p.stock_quantity)
                }))
            });

        } catch (error) {
            console.error('Erro ao gerar alertas de estoque:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
        }
    }
    // 5. Performance de Produtos
    async getProductPerformance(req, res) {
        try {
            const dateParam = req.query.date ? new Date(req.query.date) : new Date();
            const start = startOfDay(subDays(dateParam, 30)); // Últimos 30 dias por padrão
            const end = endOfDay(dateParam);

            // 1. Produtos Mais Vendidos (Quantidade e Valor) - Base para Curva ABC
            const topSellingRaw = await prisma.sale_items.groupBy({
                by: ['product_id'],
                where: {
                    sales: {
                        created_at: { gte: start, lte: end },
                        status: 'completed'
                    }
                },
                _sum: {
                    quantity: true,
                    total: true
                },
                orderBy: {
                    _sum: { total: 'desc' }
                },
                take: 50
            });

            const topSelling = await Promise.all(topSellingRaw.map(async (item) => {
                const product = await prisma.products.findUnique({
                    where: { id: item.product_id },
                    select: { name: true, cost_price: true, sale_price: true, category_id: true }
                });

                const totalRevenue = Number(item._sum.total || 0);
                const quantity = Number(item._sum.quantity || 0);
                const cost = Number(product?.cost_price || 0);
                const estimatedProfit = totalRevenue - (cost * quantity);
                const margin = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

                return {
                    id: item.product_id,
                    name: product?.name || 'Desconhecido',
                    quantity,
                    revenue: totalRevenue,
                    profit: estimatedProfit,
                    margin: margin.toFixed(2)
                };
            }));

            // 2. Produtos com Maior Margem (Cadastro)
            // Margem teórica baseada no cadastro (Preço Venda vs Custo)
            // QueryRaw para calcular margem no banco e ordenar
            const bestMarginsRaw = await prisma.$queryRaw`
                SELECT id, name, cost_price, sale_price, 
                       ((sale_price - cost_price) / NULLIF(sale_price, 0)) * 100 as margin_percent
                FROM products
                WHERE is_active = true 
                AND sale_price > 0
                ORDER BY margin_percent DESC
                LIMIT 10
            `;

            const bestMargins = Array.isArray(bestMarginsRaw) ? bestMarginsRaw.map(p => ({
                id: p.id,
                name: p.name,
                costPrice: Number(p.cost_price),
                salePrice: Number(p.sale_price),
                margin: Number(p.margin_percent).toFixed(2)
            })) : [];

            // 3. Produtos com Menor Margem (Alerta)
            const lowMarginsRaw = await prisma.$queryRaw`
                SELECT id, name, cost_price, sale_price, 
                       ((sale_price - cost_price) / NULLIF(sale_price, 0)) * 100 as margin_percent
                FROM products
                WHERE is_active = true 
                AND sale_price > 0
                AND ((sale_price - cost_price) / NULLIF(sale_price, 0)) * 100 < 30
                ORDER BY margin_percent ASC
                LIMIT 10
            `;

            const lowMargins = Array.isArray(lowMarginsRaw) ? lowMarginsRaw.map(p => ({
                id: p.id,
                name: p.name,
                costPrice: Number(p.cost_price),
                salePrice: Number(p.sale_price),
                margin: Number(p.margin_percent).toFixed(2)
            })) : [];

            res.json({
                period: { start, end },
                topSelling,
                bestMargins,
                lowMargins
            });

        } catch (error) {
            console.error('Erro ao gerar performance de produtos:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório' });
        }
    }
}

export default new ReportsController();
