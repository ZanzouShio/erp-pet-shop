import { prisma } from './src/db.js';

async function main() {
    try {
        console.log('Dropping constraints...');

        // Drop status check if exists
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;`);
            console.log('Dropped invoices_status_check');
        } catch (e) {
            console.log('Error dropping invoices_status_check (might not exist):', e.message);
        }

        // Drop type check if exists
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_type_check;`);
            console.log('Dropped invoices_type_check');
        } catch (e) {
            console.log('Error dropping invoices_type_check (might not exist):', e.message);
        }

        console.log('Constraints dropped successfully.');
    } catch (error) {
        console.error('Critical Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
