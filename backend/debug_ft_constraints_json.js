import pool from './src/db.js';

async function checkConstraints() {
    try {
        const res = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid) as definition
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conname = 'financial_transactions_type_check'
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

checkConstraints();
