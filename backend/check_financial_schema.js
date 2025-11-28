import pool from './src/db.js';

async function checkTables() {
    try {
        console.log('--- Suppliers ---');
        const suppliers = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'suppliers'
        `);
        console.table(suppliers.rows);

        console.log('\n--- Financial Transactions ---');
        const transactions = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'financial_transactions'
        `);
        console.table(transactions.rows);

        console.log('\n--- Expense Categories (Check if exists) ---');
        const categories = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'expense_categories'
        `);
        console.table(categories.rows);

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        pool.end();
    }
}

checkTables();
