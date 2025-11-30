import { prisma } from './src/db.js';

async function debugReceivables() {
    console.log('🔍 Investigando Contas a Receber...');

    const allReceivables = await prisma.accounts_receivable.findMany({
        include: {
            customers: { select: { name: true } }
        }
    });

    console.log(`\n📋 Total de Recebíveis: ${allReceivables.length}`);

    if (allReceivables.length === 0) {
        console.log('⚠️ Nenhuma conta a receber encontrada. Verifique se a Venda gerou o registro.');
    } else {
        allReceivables.forEach(r => {
            console.log(`- ID: ${r.id} | Cliente: ${r.customers?.name} | Valor: ${r.amount} | Vencimento: ${r.due_date.toISOString()} | Status: ${r.status} | Tipo: ${r.payment_method}`);
        });
    }

    // Verificar Vendas também para garantir
    const sales = await prisma.sales.findMany({
        take: 5,
        orderBy: { created_at: 'desc' }
    });
    console.log(`\n🛒 Últimas 5 Vendas:`);
    sales.forEach(s => {
        console.log(`- ID: ${s.id} | Total: ${s.total_amount} | Status: ${s.status} | Data: ${s.created_at.toISOString()}`);
    });
}

debugReceivables();
