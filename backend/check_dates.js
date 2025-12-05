import { prisma } from './src/db.js';

async function main() {
    try {
        const invoices = await prisma.invoices.findMany();
        console.log('Invoices:', invoices.map(i => ({ id: i.id, created_at: i.created_at })));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
