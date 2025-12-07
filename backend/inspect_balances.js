
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: './backend/.env' });
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkBalances() {
    try {
        const res = await pool.query('SELECT name, current_balance, is_active FROM bank_accounts');
        console.table(res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkBalances();
