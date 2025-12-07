
import { prisma } from './src/db.js';

async function fixConstraint() {
    try {
        console.log('🔧 Dropping old constraint...');
        await prisma.$executeRaw`
      ALTER TABLE sale_payments DROP CONSTRAINT IF EXISTS sale_payments_payment_method_check;
    `;

        console.log('✅ Adding new constraint with cashback...');
        await prisma.$executeRaw`
      ALTER TABLE sale_payments ADD CONSTRAINT sale_payments_payment_method_check 
      CHECK (payment_method IN ('cash', 'debit_card', 'credit_card', 'pix', 'bank_slip', 'store_credit', 'cashback'));
    `;

        console.log('🎉 Constraint updated successfully!');
    } catch (error) {
        console.error('❌ Error updating constraint:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixConstraint();
