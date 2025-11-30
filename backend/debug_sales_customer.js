import pool from './src/db.js';

async function checkSales() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT id, sale_number, customer_id, created_at 
            FROM sales 
            ORDER BY created_at DESC 
            LIMIT 20
        `);
        console.table(res.rows);

        const customer = await client.query(`
            SELECT id, name, cpf_cnpj FROM customers LIMIT 5
        `);
        console.table(customer.rows);

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        process.exit();
    }
}

checkSales();
