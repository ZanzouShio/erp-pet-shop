import { prisma } from './src/db.js';

async function main() {
    try {
        const sale = await prisma.sales.findFirst({
            where: { invoice_number: null }, // Find a sale without invoice
            select: { id: true }
        });
        console.log('Sale ID:', sale ? sale.id : 'No sale found');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
