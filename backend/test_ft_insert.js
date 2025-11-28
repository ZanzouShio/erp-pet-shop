import pool from './src/db.js';

async function testInsert() {
    const types = ['expense', 'revenue', 'Receita', 'Despesa'];

    for (const type of types) {
        try {
            console.log(`Trying type: '${type}'...`);
            await pool.query(`
                INSERT INTO financial_transactions 
                (type, amount, description, date, issue_date, due_date, category, payment_method, status)
                VALUES ($1, 10, 'Teste Type', NOW(), NOW(), NOW(), 'Teste', 'money', 'paid')
            `, [type]);
            console.log(`✅ SUCCESS: '${type}' is allowed!`);
            // Clean up
            await pool.query("DELETE FROM financial_transactions WHERE description = 'Teste Type'");
            break;
        } catch (error) {
            console.log(`❌ FAILED: '${type}' - ${error.message}`);
        }
    }
    process.exit();
}

testInsert();
