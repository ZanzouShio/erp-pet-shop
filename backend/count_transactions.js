
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: './backend/.env' });
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkTransactions() {
    try {
        const res = await pool.query('SELECT COUNT(*) FROM financial_transactions');
        console.log('Transaction Count:', res.rows[0].count);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkTransactions();
