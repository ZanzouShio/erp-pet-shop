import pool from './src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'create_receivables_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executando migração...');
        await pool.query(sql);
        console.log('Tabelas criadas com sucesso!');

    } catch (error) {
        console.error('Erro na migração:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
