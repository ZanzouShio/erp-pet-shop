import pool from './src/db.js';

async function checkSchemas() {
    try {
        console.log('--- Sales Table ---');
        const sales = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sales'
        `);
        console.table(sales.rows);

        console.log('\n--- Customers Table ---');
        const customers = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'customers'
        `);
        console.table(customers.rows);

    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

checkSchemas();
