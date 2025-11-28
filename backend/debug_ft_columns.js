import pool from './src/db.js';

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'financial_transactions'
        `);
        console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

checkSchema();
