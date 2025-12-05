import { prisma } from './src/db.js';

async function checkPaymentMethods() {
    try {
        const receivables = await prisma.accounts_receivable.findMany({
            select: { payment_method: true, status: true, description: true },
            take: 20,
            orderBy: { created_at: 'desc' }
        });
        console.log(receivables);
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPaymentMethods();
