import { prisma } from './src/db.js';

async function verifyDecoupling() {
    try {
        console.log('🧪 Starting Decoupling Verification...');

        // 1. Create a dummy config
        const config = await prisma.payment_methods_config.create({
            data: {
                type: 'credit_card',
                name: 'Test Decouple Config',
                days_to_liquidate: 30,
                receivable_mode: 'immediate',
                is_active: true
            }
        });
        console.log('Created config:', config.id);

        // 2. Create a dummy sale linked to this config (and receivable)
        // We need a product first
        const product = await prisma.products.findFirst();
        if (!product) throw new Error('No product found');

        const saleRes = await fetch('http://localhost:3001/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [{ product_id: product.id, quantity: 1, unit_price: 100 }],
                payment_method: 'credit_card',
                paymentConfigId: config.id,
                customer_id: null
            })
        });
        const saleData = await saleRes.json();
        if (!saleData.sale) throw new Error('Sale creation failed');
        console.log('Created sale:', saleData.sale.id);

        // Check receivable link
        const receivable = await prisma.accounts_receivable.findFirst({
            where: { sale_id: saleData.sale.id }
        });
        console.log('Receivable config ID:', receivable.payment_config_id);
        if (receivable.payment_config_id !== config.id) throw new Error('Link mismatch');

        // 3. Delete the config
        console.log('Attempting to delete config...');
        await prisma.payment_methods_config.delete({
            where: { id: config.id }
        });
        console.log('Config deleted successfully!');

        // 4. Verify receivable still exists but has null config
        const receivableAfter = await prisma.accounts_receivable.findUnique({
            where: { id: receivable.id }
        });
        console.log('Receivable after delete:', receivableAfter);

        if (!receivableAfter) throw new Error('Receivable was deleted!');
        if (receivableAfter.payment_config_id !== null) throw new Error('Config ID not null');

        // Cleanup
        await prisma.sale_items.deleteMany({ where: { sale_id: saleData.sale.id } });
        await prisma.accounts_receivable.deleteMany({ where: { sale_id: saleData.sale.id } });
        await prisma.sales.delete({ where: { id: saleData.sale.id } });

        console.log('✅ Verification Passed!');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyDecoupling();
