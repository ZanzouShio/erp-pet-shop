import pool from './src/db.js';

async function checkSchema() {
    try {
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('suppliers', 'financial_transactions', 'expense_categories', 'accounts_payable')
        `);
        console.log('Tables found:', JSON.stringify(tables.rows, null, 2));

        if (tables.rows.find(t => t.table_name === 'suppliers')) {
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'suppliers'
            `);
            console.log('Suppliers columns:', JSON.stringify(cols.rows, null, 2));
        }

    } catch (error) {
        console.error(error);
    } finally {
        pool.end();
    }
}

checkSchema();
