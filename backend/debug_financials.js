import { prisma } from './src/db.js';

async function debugFinancials() {
    console.log('🔍 Investigando Transações Financeiras...');

    const transactions = await prisma.financial_transactions.findMany({
        take: 5,
        orderBy: { created_at: 'desc' }
    });

    console.log(`\n💰 Últimas 5 Transações:`);
    transactions.forEach(t => {
        console.log(`- ID: ${t.id} | Desc: ${t.description} | Valor: ${t.amount} | Tipo: ${t.type} | Categoria: ${t.category}`);
    });

    const bankAccounts = await prisma.bank_accounts.findMany();
    console.log(`\n🏦 Contas Bancárias:`);
    bankAccounts.forEach(b => {
        console.log(`- ${b.bank_name}: R$ ${b.current_balance}`);
    });
}

debugFinancials();
