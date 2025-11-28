import pool from './src/db.js';

const checkConstraints = async () => {
    try {
        console.log('🔍 Verificando constraints da tabela stock_movements...');
        const res = await pool.query(`
            SELECT conname, confrelid::regclass, pg_get_constraintdef(oid)
            FROM pg_constraint 
            WHERE conrelid = 'stock_movements'::regclass
        `);
        console.log(res.rows);
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await pool.end();
    }
};

checkConstraints();
