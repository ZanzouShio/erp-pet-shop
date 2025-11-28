import pool from './src/db.js';
import fs from 'fs';

async function exportConstraint() {
    try {
        const res = await pool.query(`
            SELECT pg_get_constraintdef(c.oid) as definition
            FROM pg_constraint c
            WHERE conname = 'financial_transactions_type_check'
        `);
        if (res.rows.length > 0) {
            fs.writeFileSync('constraint_def.txt', res.rows[0].definition);
            console.log('Constraint saved to constraint_def.txt');
        } else {
            console.log('Constraint not found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

exportConstraint();
