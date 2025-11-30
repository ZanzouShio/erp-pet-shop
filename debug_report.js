import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/erp_petshop'
});

async function test() {
    try {
        console.log('Testing connection...');
        const client = await pool.connect();
        console.log('Connected.');

        console.log('Checking columns in accounts_receivable...');
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'accounts_receivable';
        `);
        console.log('Columns:', res.rows.map(r => r.column_name));

        console.log('Testing Group By Query...');
        const query = `
            SELECT payment_config_id, total_installments, 
                   SUM(amount) as total_gross, 
                   SUM(net_amount) as total_net, 
                   SUM(tax_amount) as total_fees, 
                   COUNT(id) as count
            FROM accounts_receivable
            WHERE origin_type = 'sale' AND payment_config_id IS NOT NULL
            GROUP BY payment_config_id, total_installments
        `;
        const report = await client.query(query);
        console.log('Report Data:', report.rows);

        client.release();
    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        pool.end();
    }
}

test();
