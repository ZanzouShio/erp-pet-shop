import pool from './src/db.js';

async function listTables() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        console.table(res.rows);
    } catch (error) {
        console.error(error);
    } finally {
        pool.end();
    }
}

listTables();
