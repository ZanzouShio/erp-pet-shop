import { prisma } from './src/db.js';

async function test() {
    try {
        console.log('Testing Prisma connection...');
        const count = await prisma.accounts_receivable.count();
        console.log('Total Receivables:', count);

        console.log('Searching for Sales #30 and #31...');
        const specific = await prisma.accounts_receivable.findMany({
            where: {
                OR: [
                    { description: { contains: 'Venda #30' } },
                    { description: { contains: 'Venda #31' } }
                ]
            },
            select: {
                id: true,
                description: true,
                amount: true,
                payment_config_id: true,
                created_at: true
            }
        });
        console.log('Specific Receivables:', JSON.stringify(specific, null, 2));
    } catch (e) {
        console.error('ERROR:', e);
    }
}

test();
