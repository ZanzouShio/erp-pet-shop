import pool from './src/db.js';
import { prisma } from './src/db.js';

async function testReceivables() {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting Accounts Receivable Tests...');

        // 1. Test Immediate Settlement (0 days)
        console.log('\n--- Test 1: Immediate Settlement (0 days) ---');
        // Create a dummy payment config for 0 days
        const config0 = await prisma.payment_methods_config.create({
            data: {
                type: 'debit_card',
                name: 'Test Debit 0 Days',
                days_to_liquidate: 0,
                receivable_mode: 'immediate',
                is_active: true
            }
        });

        // Fetch a valid product
        const productsRes = await prisma.products.findMany({ take: 1 });
        if (productsRes.length === 0) throw new Error('No products found in DB');
        const productId = productsRes[0].id;
        console.log('Using Product ID:', productId);

        // Create sale
        const sale0Res = await fetch('http://localhost:3001/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [{ product_id: productId, quantity: 1, unit_price: 100 }],
                payment_method: 'debit_card',
                paymentConfigId: config0.id,
                customer_id: null
            })
        });
        const sale0 = await sale0Res.json();
        if (!sale0.sale) {
            console.error('Sale 0 creation failed:', sale0);
            throw new Error('Sale 0 creation failed');
        }
        console.log('Sale 0 created:', sale0.sale.sale_number);

        // Check receivable
        const receivable0 = await prisma.accounts_receivable.findFirst({
            where: { sale_id: sale0.sale.id }
        });
        console.log('Receivable 0 status:', receivable0.status);
        if (receivable0.status !== 'paid') throw new Error('Receivable 0 should be paid');


        // 2. Test Pending Settlement (1 day)
        console.log('\n--- Test 2: Pending Settlement (1 day) ---');
        const config1 = await prisma.payment_methods_config.create({
            data: {
                type: 'credit_card',
                name: 'Test Credit 1 Day',
                days_to_liquidate: 1,
                receivable_mode: 'immediate',
                is_active: true
            }
        });

        const sale1Res = await fetch('http://localhost:3001/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [{ product_id: productId, quantity: 1, unit_price: 50 }],
                payment_method: 'credit_card',
                paymentConfigId: config1.id,
                customer_id: null
            })
        });
        const sale1 = await sale1Res.json();
        if (!sale1.sale) throw new Error('Sale 1 creation failed');
        console.log('Sale 1 created:', sale1.sale.sale_number);

        const receivable1 = await prisma.accounts_receivable.findFirst({
            where: { sale_id: sale1.sale.id }
        });
        console.log('Receivable 1 status:', receivable1.status);
        if (receivable1.status !== 'pending') throw new Error('Receivable 1 should be pending');


        // 3. Test Cancellation
        console.log('\n--- Test 3: Cancellation ---');
        // Cancel Sale 1
        const cancelRes = await fetch(`http://localhost:3001/api/sales/${sale1.sale.id}/cancel`, {
            method: 'POST'
        });
        console.log('Cancel response:', await cancelRes.json());

        const receivable1Cancelled = await prisma.accounts_receivable.findFirst({
            where: { id: receivable1.id }
        });
        console.log('Receivable 1 status after cancel:', receivable1Cancelled.status);
        if (receivable1Cancelled.status !== 'cancelled') throw new Error('Receivable 1 should be cancelled');


        // 4. Test Auto-Settlement
        console.log('\n--- Test 4: Auto-Settlement ---');
        // Create another sale with 1 day
        const sale2Res = await fetch('http://localhost:3001/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [{ product_id: productId, quantity: 1, unit_price: 75 }],
                payment_method: 'credit_card',
                paymentConfigId: config1.id,
                customer_id: null
            })
        });
        const sale2 = await sale2Res.json();
        if (!sale2.sale) throw new Error('Sale 2 creation failed');
        console.log('Sale 2 created:', sale2.sale.sale_number);

        // 5. Test Pix with 1 Day (Should be Pending)
        console.log('\n--- Test 5: Pix with 1 Day (Should be Pending) ---');
        const configPix = await prisma.payment_methods_config.create({
            data: {
                type: 'pix',
                name: 'Test Pix 1 Day',
                days_to_liquidate: 1,
                receivable_mode: 'immediate',
                is_active: true
            }
        });

        const salePixRes = await fetch('http://localhost:3001/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [{ product_id: productId, quantity: 1, unit_price: 100 }],
                payment_method: 'pix',
                paymentConfigId: configPix.id,
                customer_id: null
            })
        });
        const salePix = await salePixRes.json();
        console.log('Sale Pix created:', salePix.sale.sale_number);

        const receivablePix = await prisma.accounts_receivable.findFirst({
            where: { sale_id: salePix.sale.id }
        });
        console.log('Receivable Pix status:', receivablePix.status);
        if (receivablePix.status !== 'pending') throw new Error('Receivable Pix should be pending');

        // Cleanup extra config
        await prisma.payment_methods_config.delete({ where: { id: configPix.id } });

        // Manually update due_date to yesterday
        await prisma.accounts_receivable.updateMany({
            where: { sale_id: sale2.sale.id },
            data: { due_date: new Date(Date.now() - 86400000) }
        });

        // Call list endpoint to trigger auto-settlement
        console.log('Calling list endpoint...');
        await fetch('http://localhost:3001/api/accounts-receivable');

        const receivable2 = await prisma.accounts_receivable.findFirst({
            where: { sale_id: sale2.sale.id }
        });
        console.log('Receivable 2 status after auto-settle:', receivable2.status);
        if (receivable2.status !== 'paid') throw new Error('Receivable 2 should be paid');


        // Cleanup
        await prisma.payment_methods_config.deleteMany({ where: { id: { in: [config0.id, config1.id] } } });
        console.log('\n✅ All tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        client.release();
        await prisma.$disconnect();
    }
}

testReceivables();
