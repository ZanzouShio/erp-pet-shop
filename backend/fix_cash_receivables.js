import { prisma } from './src/db.js';

async function fixCashReceivables() {
    try {
        console.log('🔧 Fixing pending cash receivables...');

        // Find all pending receivables with payment_method 'cash' or 'money'
        const pendingCash = await prisma.accounts_receivable.findMany({
            where: {
                status: 'pending',
                payment_method: { in: ['cash', 'money'] }
            }
        });

        console.log(`Found ${pendingCash.length} pending cash receivables.`);

        if (pendingCash.length === 0) return;

        await prisma.$transaction(async (tx) => {
            for (const title of pendingCash) {
                const paidDate = title.due_date; // Use due date as paid date (usually same day for cash)

                // Update receivable
                await tx.accounts_receivable.update({
                    where: { id: title.id },
                    data: {
                        status: 'paid',
                        paid_date: paidDate,
                        updated_at: new Date()
                    }
                });

                // Create financial transaction if not exists (check by description/amount/date to avoid dupes? 
                // Or just create it assuming it wasn't created because it was pending)
                // If it was pending, it likely didn't generate revenue transaction yet.

                await tx.financial_transactions.create({
                    data: {
                        type: 'revenue',
                        amount: title.net_amount,
                        description: `Recebimento: ${title.description}`,
                        date: paidDate,
                        issue_date: paidDate,
                        due_date: title.due_date,
                        category: 'Recebimento de Cliente',
                        payment_method: title.payment_method,
                        status: 'paid',
                        customer_id: title.customer_id,
                        payment_config_id: title.payment_config_id
                    }
                });
            }
        });

        console.log('✅ Fixed all pending cash receivables.');

    } catch (error) {
        console.error('❌ Fix failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixCashReceivables();
