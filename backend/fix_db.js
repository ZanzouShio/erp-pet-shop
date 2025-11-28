import pool from './src/db.js';

const fixDb = async () => {
    try {
        console.log('🔄 Alterando coluna reference_id para VARCHAR...');
        await pool.query('ALTER TABLE stock_movements ALTER COLUMN reference_id TYPE VARCHAR(255)');
        console.log('✅ Sucesso! Coluna alterada.');
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await pool.end();
    }
};

fixDb();
