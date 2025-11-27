import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function applyMigration() {
    try {
        await client.connect();
        console.log('\n📊 Aplicando migration: adicionando campos de custo...\n');

        // Adicionar colunas
        await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS last_cost NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS average_cost NUMERIC DEFAULT 0
    `);
        console.log('✅ Colunas adicionadas: last_cost, average_cost');

        // Inicializar valores
        const result = await client.query(`
      UPDATE products 
      SET average_cost = cost_price, last_cost = cost_price
      WHERE average_cost IS NULL OR average_cost = 0
    `);
        console.log(`✅ ${result.rowCount} produtos atualizados com custos iniciais`);

        // Verificar
        const check = await client.query(`
      SELECT id, name, cost_price, last_cost, average_cost, profit_margin
      FROM products
      LIMIT 3
    `);

        console.log('\n📋 Amostra de produtos:');
        check.rows.forEach(p => {
            console.log(`  - ${p.name}: cost=${p.cost_price}, avg=${p.average_cost}, margin=${p.profit_margin}%`);
        });

        console.log('\n✅ Migration concluída com sucesso!\n');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await client.end();
    }
}

applyMigration();
