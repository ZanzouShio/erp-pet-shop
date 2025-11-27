// Script para verificar schema da tabela sales
import pool from './src/db.js';

console.log('\n📋 Consultando estrutura da tabela SALES...\n');

try {
    const result = await pool.query(`
        SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_name = 'sales'
        ORDER BY ordinal_position;
    `);

    if (result.rows.length === 0) {
        console.log('❌ Tabela "sales" NÃO ENCONTRADA!\n');
    } else {
        console.log('✅ Colunas encontradas (' + result.rows.length + '):\n');
        result.rows.forEach(col => {
            const notNull = col.is_nullable === 'NO' ? '[NOT NULL]' : '';
            console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(25)} ${notNull}`);
        });
        console.log('\n');
    }

    await pool.end();
} catch (error) {
    console.error('\n❌ Erro:', error.message);
    await pool.end();
    process.exit(1);
}
