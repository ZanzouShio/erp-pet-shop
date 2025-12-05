import { prisma } from './src/db.js';
import http from 'http';

function postRequest(path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(data))
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    console.error('JSON Parse Error:', body);
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function verifyBankBalanceUpdates() {
    try {
        console.log('🧪 Starting Bank Balance Verification...');

        // 1. Create a dummy bank account
        const bank = await prisma.bank_accounts.create({
            data: {
                name: 'Test Bank Account',
                bank_name: 'Test Bank',
                account_number: '12345',
                agency: '0001',
                current_balance: 1000,
                is_active: true
            }
        });
        // console.log('Created bank:', bank.id, 'Balance:', bank.current_balance);

        // 2. Create a payment config linked to this bank
        const config = await prisma.payment_methods_config.create({
            data: {
                type: 'debit_card',
                name: 'Test Debit Linked',
                days_to_liquidate: 0,
                receivable_mode: 'immediate',
                is_active: true,
                bank_account_id: bank.id
            }
        });
        // console.log('Created config:', config.id);

        // 3. Test Immediate Sale (Debit Linked)
        const product = await prisma.products.findFirst();
        // console.log('Using product:', product.id);

        const saleRes = await postRequest('/api/sales', {
            items: [{ product_id: product.id, quantity: 1, unit_price: 100 }],
            payment_method: 'debit_card',
            paymentConfigId: config.id,
            customer_id: null
        });
        const saleData = saleRes.data;

        if (saleRes.status !== 201 && saleRes.status !== 200) throw new Error('Sale creation failed: ' + saleRes.status + ' ' + JSON.stringify(saleData));
        console.log('Created sale:', saleData.sale.id);

        // Verify bank balance increased
        const bankAfterSale = await prisma.bank_accounts.findUnique({ where: { id: bank.id } });
        // console.log('Bank Balance after Sale (should be 1100):', bankAfterSale.current_balance);
        if (Number(bankAfterSale.current_balance) !== 1100) throw new Error('Bank balance did not update for sale!');

        // 4. Test Accounts Payable (Debit from Bank)
        // Create a bill
        const bill = await prisma.accounts_payable.create({
            data: {
                description: 'Test Bill',
                amount: 50,
                due_date: new Date(),
                status: 'pending'
            }
        });

        // Pay the bill using the bank account
        const payRes = await postRequest(`/api/accounts-payable/${bill.id}/pay`, {
            amount_paid: 50,
            payment_date: new Date(),
            payment_method: 'transfer',
            account_id: bank.id
        });
        const payData = payRes.data;
        console.log('Pay Status:', payRes.status);
        if (payData.error) console.log('Pay Error:', payData.error);
        // console.log('Paid bill MSG:', payData.message);
        // if (payData.debug) console.log('Debug:', JSON.stringify(payData.debug));

        // Verify bank balance decreased
        const bankAfterPay = await prisma.bank_accounts.findUnique({ where: { id: bank.id } });
        console.log('Bank Balance after Pay:', bankAfterPay.current_balance);
        if (Number(bankAfterPay.current_balance) !== 1050) throw new Error('Bank balance did not update for payment!');

        // Cleanup
        await prisma.sale_items.deleteMany({ where: { sale_id: saleData.sale.id } });
        await prisma.financial_transactions.deleteMany({ where: { description: { contains: 'Test' } } });
        await prisma.accounts_receivable.deleteMany({ where: { sale_id: saleData.sale.id } });
        await prisma.sales.delete({ where: { id: saleData.sale.id } });
        await prisma.accounts_payable.delete({ where: { id: bill.id } });
        await prisma.payment_methods_config.delete({ where: { id: config.id } });
        await prisma.bank_accounts.delete({ where: { id: bank.id } });

        console.log('✅ Verification Passed!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.message || error);
        if (error.meta) console.error('Meta:', error.meta);
    } finally {
        await prisma.$disconnect();
    }
}

verifyBankBalanceUpdates();
