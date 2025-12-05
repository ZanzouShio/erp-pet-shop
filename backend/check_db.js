import { prisma } from './src/db.js';

async function main() {
    try {
        console.log('Checking DB...');
        console.log('URL:', process.env.DATABASE_URL ? 'Defined' : 'Undefined');

        const invoices = await prisma.invoices.findMany();
        console.log('Invoices found:', invoices.length);

        const sales = await prisma.sales.findMany({
            where: { invoice_number: { not: null } },
            select: { id: true, sale_number: true, invoice_number: true }
        });
        console.log('Sales with invoice:', sales.length);
        console.log(JSON.stringify(sales, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
