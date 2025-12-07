
import { prisma } from './src/db.js';

async function listConstraints() {
    try {
        const result = await prisma.$queryRaw`
      SELECT conname, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'sale_payments'::regclass;
    `;
        console.log('Constraints on sale_payments:', result);
    } catch (error) {
        console.error('Error fetching constraints:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listConstraints();
