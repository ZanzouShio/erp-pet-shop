import pool from './src/db.js';

async function listTypes() {
    try {
        const res = await pool.query('SELECT DISTINCT type FROM financial_transactions');
        console.log('Existing types:', res.rows.map(r => r.type));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

listTypes();
