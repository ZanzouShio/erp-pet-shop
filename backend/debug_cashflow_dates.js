import { prisma } from './src/db.js';

async function debugCashFlow() {
    console.log('🔍 Investigando contas a pagar e datas...');

    const today = new Date();
    console.log(`📅 Data Atual (Server): ${today.toISOString()}`);

    // 1. Listar todas as contas pendentes para ver as datas salvas
    const allPayables = await prisma.accounts_payable.findMany({
        where: { status: 'pending' },
        select: { id: true, description: true, due_date: true }
    });

    console.log('\n📋 Contas Pendentes Encontradas:');
    allPayables.forEach(p => {
        console.log(`- [${p.description}] Vencimento: ${p.due_date.toISOString()} (Raw: ${p.due_date})`);
    });

    // 2. Simular a lógica do Controller para D+7
    const days = 7;
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + days);

    const startDate = new Date();

    console.log(`\n🧮 Lógica do Controller (D+${days}):`);
    console.log(`   Start Date (gte): ${startDate.toISOString()}`);
    console.log(`   Limit Date (lte): ${limitDate.toISOString()}`);

    const filtered = await prisma.accounts_payable.findMany({
        where: {
            status: 'pending',
            due_date: {
                gte: startDate,
                lte: limitDate
            }
        }
    });

    console.log(`\n🔎 Resultados da Query Simulada (${filtered.length} itens):`);
    filtered.forEach(p => {
        console.log(`- ${p.description}`);
    });

    // 3. Teste com ajuste de horário (Start of Day / End of Day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfLimitDay = new Date(limitDate);
    endOfLimitDay.setHours(23, 59, 59, 999);

    console.log(`\n🧠 Lógica Ajustada (Sugestão):`);
    console.log(`   Start (00:00): ${startOfDay.toISOString()}`);
    console.log(`   Limit (23:59): ${endOfLimitDay.toISOString()}`);

    const filteredAdjusted = await prisma.accounts_payable.findMany({
        where: {
            status: 'pending',
            due_date: {
                gte: startOfDay,
                lte: endOfLimitDay
            }
        }
    });

    console.log(`\n✅ Resultados da Query Ajustada (${filteredAdjusted.length} itens):`);
    filteredAdjusted.forEach(p => {
        console.log(`- ${p.description}`);
    });
}

debugCashFlow();
