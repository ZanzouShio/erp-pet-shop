import fetch from 'node-fetch';

async function testCreateSale() {
    try {
        const response = await fetch('http://localhost:3001/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                    { product_id: 'prod_1', quantity: 1, unit_price: 10 } // Preciso de um ID de produto válido
                ],
                payment_method: 'money',
                discount_amount: 0
            })
        });

        const data = await response.json();
        console.log('Response:', data);

        if (data.sale) {
            console.log('Sale created with customer_id:', data.sale.customer_id); // O controller retorna customer_id?
            // Vou verificar no banco depois
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Preciso pegar um produto válido primeiro
import pool from './src/db.js';

async function getProductAndTest() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id FROM products LIMIT 1');
        if (res.rows.length > 0) {
            const productId = res.rows[0].id;
            console.log('Using product ID:', productId);

            const response = await fetch('http://localhost:3001/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: [
                        { product_id: productId, quantity: 1, unit_price: 10 }
                    ],
                    payment_method: 'cash',
                    discount_amount: 0
                })
            });

            const data = await response.json();
            console.log('Sale created:', data);

            // Verificar no banco
            if (data.sale && data.sale.id) {
                const saleRes = await client.query('SELECT customer_id FROM sales WHERE id = $1', [data.sale.id]);
                console.log('Database customer_id:', saleRes.rows[0].customer_id);
            }

        } else {
            console.log('No products found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        process.exit();
    }
}

getProductAndTest();
