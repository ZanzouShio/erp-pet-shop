import pg from 'pg';

const { Client } = pg;
const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'erp_petshop',
    user: 'erp_admin',
    password: 'erp_pass_2024'
});

async function queryStockMovements() {
    try {
        await client.connect();

        const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'stock_movements'
      ORDER BY ordinal_position
    `);

        console.log('\n✅ Colunas de stock_movements:\n');
        result.rows.forEach(col => {
            const nullable = col.is_nullable === 'NO' ? '[NOT NULL]' : '';
            console.log(`  - ${col.column_name} (${col.data_type}) ${nullable}`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await client.end();
    }
}

queryStockMovements();
