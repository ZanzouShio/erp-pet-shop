import pool from './src/db.js';

async function checkSchema() {
    try {
        console.log('🔍 Verificando colunas de financial_transactions...');
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'financial_transactions'
        `);
        console.table(res.rows);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

checkSchema();
