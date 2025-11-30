import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Conexão com PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Testar conexão
pool.on('connect', () => {
    console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Erro no PostgreSQL:', err);
});

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({
    adapter,
});

export default pool;
