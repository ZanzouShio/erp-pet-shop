import { prisma } from '../db.js';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, addDays } from 'date-fns';

class ReportsController {
    // 1. Resumo de Vendas do Dia
    async getDailySalesSummary(req, res) {
        try {
            const dateParam = req.query.date ? new Date(req.query.date + 'T00:00:00') : new Date();
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
            const dateParam = req.query.date ? new Date(req.query.date + 'T00:00:00') : new Date();
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
            const dateParam = req.query.date ? new Date(req.query.date + 'T00:00:00') : new Date();
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

    // 6. Relatório de Taxas de Pagamento
    async getPaymentFeesReport(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? startOfDay(new Date(startDate + 'T00:00:00')) : startOfDay(subDays(new Date(), 30));
            const end = endDate ? endOfDay(new Date(endDate + 'T00:00:00')) : endOfDay(new Date());

            // Agrupar por Configuração de Pagamento (Operador) e Parcelas
            // Usamos accounts_receivable pois é onde as taxas reais ficam gravadas
            const feesByConfig = await prisma.accounts_receivable.groupBy({
                by: ['payment_config_id', 'total_installments'],
                where: {
                    created_at: { gte: start, lte: end },
                    origin_type: 'sale',
                    payment_config_id: { not: null } // Apenas onde temos config rastreada
                },
                _sum: {
                    amount: true,      // Valor Bruto (Parcela)
                    net_amount: true,  // Valor Líquido
                    tax_amount: true   // Valor da Taxa
                },
                _count: {
                    id: true // Quantidade de parcelas geradas
                }
            });

            // Enriquecer com nome do operador
            const reportData = await Promise.all(feesByConfig.map(async (item) => {
                const config = await prisma.payment_methods_config.findUnique({
                    where: { id: item.payment_config_id },
                    select: { name: true, type: true, color: true }
                });

                return {
                    operatorId: item.payment_config_id,
                    operatorName: config?.name || 'Desconhecido',
                    paymentType: config?.type || 'N/A',
                    color: config?.color || '#3b82f6',
                    installments: item.total_installments || 1,
                    totalGross: Number(item._sum.amount || 0),
                    totalNet: Number(item._sum.net_amount || 0),
                    totalFees: Number(item._sum.tax_amount || 0),
                    count: item._count.id
                };
            }));

            // Agrupar por Operador (Resumo)
            const summaryByOperator = reportData.reduce((acc, curr) => {
                if (!acc[curr.operatorName]) {
                    acc[curr.operatorName] = {
                        name: curr.operatorName,
                        color: curr.color, // Propagando a cor para o resumo
                        totalGross: 0,
                        totalFees: 0,
                        avgFeePercent: 0
                    };
                }
                acc[curr.operatorName].totalGross += curr.totalGross;
                acc[curr.operatorName].totalFees += curr.totalFees;
                return acc;
            }, {});

            // Calcular % média
            Object.values(summaryByOperator).forEach(op => {
                if (op.totalGross > 0) {
                    op.avgFeePercent = (op.totalFees / op.totalGross) * 100;
                }
            });

            res.json({
                period: { start, end },
                details: reportData.sort((a, b) => a.operatorName.localeCompare(b.operatorName) || a.installments - b.installments),
                summary: Object.values(summaryByOperator)
            });

        } catch (error) {
            console.error('Erro ao gerar relatório de taxas:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório de taxas' });
        }
    }

    // 7. Relatório de Breakeven (Ponto de Equilíbrio)
    async getBreakeven(req, res) {
        try {
            const { startDate, endDate } = req.query;

            // Date Filters
            const dateFilter = {};
            if (startDate && endDate) {
                dateFilter.date = {
                    gte: new Date(startDate + 'T00:00:00'),
                    lte: new Date(endDate + 'T23:59:59')
                };
            }

            // 1. Calculate Revenue (Total Sales)
            // Only completed sales
            const sales = await prisma.sales.findMany({
                where: {
                    status: 'completed',
                    created_at: startDate && endDate ? {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    } : undefined
                },
                include: {
                    sale_items: {
                        include: {
                            products: {
                                select: {
                                    cost_price: true
                                }
                            }
                        }
                    }
                }
            });

            const revenue = sales.reduce((acc, sale) => acc + Number(sale.total), 0);

            // 2. Calculate Variable Costs
            // Sales Items Cost (CMV) - use item cost_price, fallback to product cost_price
            let variableCosts = 0;
            sales.forEach(sale => {
                sale.sale_items.forEach(item => {
                    const qty = Number(item.quantity);
                    // Use cost from sale_item, or fallback to product's current cost
                    const cost = Number(item.cost_price) || Number(item.products?.cost_price) || 0;
                    variableCosts += (cost * qty);
                });
            });

            // 3. Calculate Margin %
            // Margin = (Revenue - Variable Costs) / Revenue
            let marginPercentage = 0;
            if (revenue > 0) {
                const margin = revenue - variableCosts;
                marginPercentage = (margin / revenue); // Decimal (e.g., 0.40)
            }

            // 4. Calculate OPEX (Fixed Costs)
            // First, get all fixed expense categories
            const fixedCategories = await prisma.expense_categories.findMany({
                where: {
                    is_fixed: true
                },
                select: {
                    id: true
                }
            });

            const fixedCategoryIds = fixedCategories.map(c => c.id);

            const expenseDateFilter = startDate && endDate ? {
                due_date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            } : {};

            const fixedExpenses = await prisma.accounts_payable.findMany({
                where: {
                    ...expenseDateFilter,
                    status: { not: 'cancelled' },
                    category_id: {
                        in: fixedCategoryIds
                    }
                }
            });

            const opex = fixedExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0);

            // 5. Calculate Breakeven Point
            // Breakeven = OPEX / Margin %
            let breakevenPoint = 0;
            if (marginPercentage > 0) {
                breakevenPoint = opex / marginPercentage;
            }

            res.json({
                revenue,
                variableCosts,
                margin: revenue - variableCosts,
                marginPercentage,
                opex,
                breakevenPoint,
                salesCount: sales.length,
                fixedExpensesCount: fixedExpenses.length
            });

        } catch (error) {
            console.error('Error calculating breakeven:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    // GET /api/reports/average-ticket
    async getAverageTicket(req, res) {
        try {
            const { startDate, endDate } = req.query;

            // Default: current month
            const start = startDate
                ? new Date(startDate + 'T00:00:00')
                : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const end = endDate
                ? new Date(endDate + 'T23:59:59')
                : new Date();

            // Also calculate for previous period (same duration, prior)
            const duration = end.getTime() - start.getTime();
            const prevStart = new Date(start.getTime() - duration);
            const prevEnd = new Date(end.getTime() - duration);

            // 1. Current Period Sales
            const currentSales = await prisma.sales.findMany({
                where: {
                    status: 'completed',
                    created_at: {
                        gte: start,
                        lte: end
                    }
                },
                include: {
                    sale_items: {
                        include: {
                            products: {
                                select: {
                                    category_id: true,
                                    product_categories: {
                                        select: { name: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // 2. Previous Period Sales
            const prevSales = await prisma.sales.findMany({
                where: {
                    status: 'completed',
                    created_at: {
                        gte: prevStart,
                        lte: prevEnd
                    }
                }
            });

            // General Metrics - Current
            const currentRevenue = currentSales.reduce((acc, s) => acc + Number(s.total), 0);
            const currentCount = currentSales.length;
            const currentTicket = currentCount > 0 ? currentRevenue / currentCount : 0;

            // General Metrics - Previous
            const prevRevenue = prevSales.reduce((acc, s) => acc + Number(s.total), 0);
            const prevCount = prevSales.length;
            const prevTicket = prevCount > 0 ? prevRevenue / prevCount : 0;

            // Variation
            const ticketVariation = prevTicket > 0
                ? ((currentTicket - prevTicket) / prevTicket) * 100
                : (currentTicket > 0 ? 100 : 0);

            // 3. By Day of Week
            const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            const byDayOfWeek = Array(7).fill(null).map((_, i) => ({
                day: dayNames[i],
                dayIndex: i,
                count: 0,
                revenue: 0,
                ticket: 0
            }));

            currentSales.forEach(sale => {
                const dayIndex = new Date(sale.created_at).getDay();
                byDayOfWeek[dayIndex].count += 1;
                byDayOfWeek[dayIndex].revenue += Number(sale.total);
            });

            byDayOfWeek.forEach(day => {
                day.ticket = day.count > 0 ? day.revenue / day.count : 0;
            });

            // 4. By Category
            const categoryMap = new Map();

            currentSales.forEach(sale => {
                sale.sale_items.forEach(item => {
                    const categoryName = item.products?.product_categories?.name || 'Sem Categoria';
                    const itemTotal = Number(item.total) || 0;

                    if (!categoryMap.has(categoryName)) {
                        categoryMap.set(categoryName, {
                            name: categoryName,
                            revenue: 0,
                            count: 0,
                            itemCount: 0
                        });
                    }

                    const cat = categoryMap.get(categoryName);
                    cat.revenue += itemTotal;
                    cat.itemCount += 1;
                });
            });

            // Calculate ticket per category (revenue / items)
            const byCategory = Array.from(categoryMap.values())
                .map(cat => ({
                    ...cat,
                    ticketPerItem: cat.itemCount > 0 ? cat.revenue / cat.itemCount : 0
                }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);

            res.json({
                period: {
                    start: start.toISOString(),
                    end: end.toISOString()
                },
                general: {
                    revenue: currentRevenue,
                    salesCount: currentCount,
                    averageTicket: currentTicket,
                    previousTicket: prevTicket,
                    variation: ticketVariation
                },
                byDayOfWeek,
                byCategory
            });

        } catch (error) {
            console.error('Error calculating average ticket:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    // GET /api/reports/revenue-analysis
    async getRevenueAnalysis(req, res) {
        try {
            const { startDate, endDate } = req.query;

            // Default: current month
            const start = startDate
                ? new Date(startDate + 'T00:00:00')
                : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const end = endDate
                ? new Date(endDate + 'T23:59:59')
                : new Date();

            // Previous period calculation
            const duration = end.getTime() - start.getTime();
            const prevStart = new Date(start.getTime() - duration);
            const prevEnd = new Date(end.getTime() - duration);

            // 1. Current Period Revenue (Sales)
            const currentSales = await prisma.sales.findMany({
                where: {
                    status: 'completed',
                    created_at: {
                        gte: start,
                        lte: end
                    }
                },
                include: {
                    sale_items: {
                        include: {
                            products: {
                                select: { cost_price: true }
                            }
                        }
                    }
                }
            });

            // 2. Previous Period Revenue
            const prevSales = await prisma.sales.findMany({
                where: {
                    status: 'completed',
                    created_at: {
                        gte: prevStart,
                        lte: prevEnd
                    }
                }
            });

            // 3. Current Period Expenses (for net profit)
            const currentExpenses = await prisma.accounts_payable.findMany({
                where: {
                    status: 'paid',
                    payment_date: {
                        gte: start,
                        lte: end
                    }
                }
            });

            // Calculate metrics
            const currentRevenue = currentSales.reduce((acc, s) => acc + Number(s.total), 0);
            const prevRevenue = prevSales.reduce((acc, s) => acc + Number(s.total), 0);

            // Cost of goods sold (CMV)
            let totalCMV = 0;
            currentSales.forEach(sale => {
                sale.sale_items.forEach(item => {
                    const cost = Number(item.cost_price) || Number(item.products?.cost_price) || 0;
                    totalCMV += cost * Number(item.quantity);
                });
            });

            // Total expenses
            const totalExpenses = currentExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

            // Gross Profit (Receita - CMV)
            const grossProfit = currentRevenue - totalCMV;

            // Net Profit (Lucro Bruto - Despesas)
            const netProfit = grossProfit - totalExpenses;

            // Growth Rate
            const growthRate = prevRevenue > 0
                ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
                : (currentRevenue > 0 ? 100 : 0);

            // Net Profit Margin
            const netProfitMargin = currentRevenue > 0
                ? (netProfit / currentRevenue) * 100
                : 0;

            // Gross Profit Margin
            const grossProfitMargin = currentRevenue > 0
                ? (grossProfit / currentRevenue) * 100
                : 0;

            // Monthly breakdown for chart (last 6 months)
            const monthlyData = [];
            for (let i = 5; i >= 0; i--) {
                const monthStart = new Date(end.getFullYear(), end.getMonth() - i, 1);
                const monthEnd = new Date(end.getFullYear(), end.getMonth() - i + 1, 0);

                const monthSales = await prisma.sales.aggregate({
                    where: {
                        status: 'completed',
                        created_at: {
                            gte: monthStart,
                            lte: monthEnd
                        }
                    },
                    _sum: { total: true },
                    _count: true
                });

                monthlyData.push({
                    month: monthStart.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
                    revenue: Number(monthSales._sum.total) || 0,
                    count: monthSales._count
                });
            }

            res.json({
                period: {
                    start: start.toISOString(),
                    end: end.toISOString()
                },
                metrics: {
                    totalRevenue: currentRevenue,
                    previousRevenue: prevRevenue,
                    growthRate,
                    grossProfit,
                    grossProfitMargin,
                    netProfit,
                    netProfitMargin,
                    totalCMV,
                    totalExpenses,
                    salesCount: currentSales.length
                },
                monthlyData
            });

        } catch (error) {
            console.error('Error calculating revenue analysis:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }
}

export default new ReportsController();
