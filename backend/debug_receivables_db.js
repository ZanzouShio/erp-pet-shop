import pool from './src/db.js';

async function debugReceivables() {
    try {
        console.log('🔍 Verificando tabela accounts_receivable...');
        const res = await pool.query('SELECT id, description, amount, due_date, status FROM accounts_receivable');

        console.log(`📊 Total de registros encontrados: ${res.rowCount}`);

        if (res.rowCount === 0) {
            console.log('⚠️ A tabela está vazia!');
        } else {
            res.rows.forEach(row => {
                console.log(`   🔸 [${row.status}] ${row.description} | Vencimento: ${row.due_date} | Valor: ${row.amount}`);
            });
        }
    } catch (error) {
        console.error('❌ Erro ao consultar banco:', error);
    } finally {
        process.exit();
    }
}

debugReceivables();
