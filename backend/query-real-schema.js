import pg from 'pg';

const { Client } = pg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'erp_petshop',
    user: 'erp_admin',
    password: 'erp_pass_2024'
});

async function querySchema() {
    try {
        await client.connect();
        console.log('\n📊 CONSULTANDO SCHEMA REAL DO BANCO...\n');

        // 1. Listar todas as tabelas
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      ORDER BY table_name
    `);

        console.log('✅ TABELAS ENCONTRADAS (' + tables.rows.length + '):');
        tables.rows.forEach(t => console.log('  -', t.table_name));

        console.log('\n📋 DETALHANDO TABELAS PRINCIPAIS...\n');

        // 2. Para cada tabela importante, listar colunas
        const importantTables = ['products', 'sales', 'sale_items', 'sale_payments', 'users', 'product_categories'];

        for (const tableName of importantTables) {
            const exists = tables.rows.find(t => t.table_name === tableName);
            if (exists) {
                const columns = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

                console.log(`\n📌 ${tableName.toUpperCase()} (${columns.rows.length} colunas):`);
                columns.rows.forEach(col => {
                    const nullable = col.is_nullable === 'YES' ? '' : '[NOT NULL]';
                    console.log(`  - ${col.column_name} (${col.data_type}) ${nullable}`);
                });
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await client.end();
    }
}

querySchema();
