import pool from './src/db.js';

async function checkSchemas() {
    try {
        const sales = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sales'
        `);
        console.log('SALES:', JSON.stringify(sales.rows, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

checkSchemas();
