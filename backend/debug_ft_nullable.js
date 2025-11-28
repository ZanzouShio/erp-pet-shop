import pool from './src/db.js';

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'financial_transactions'
            AND column_name = 'due_date'
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

checkSchema();
