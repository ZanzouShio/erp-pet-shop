import { prisma } from './src/db.js';

async function main() {
    try {
        const result = await prisma.$queryRaw`
            SELECT pg_get_constraintdef(oid) AS constraint_def
            FROM pg_constraint
            WHERE conname = 'invoices_type_check';
        `;
        console.log('Constraint definition:', result);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
