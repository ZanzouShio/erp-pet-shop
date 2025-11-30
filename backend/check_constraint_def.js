import fs from 'fs';
import { prisma } from './src/db.js';

async function checkConstraint() {
    try {
        const result = await prisma.$queryRaw`
            SELECT pg_get_constraintdef(oid) AS constraint_def
            FROM pg_constraint
            WHERE conname = 'pets_gender_check';
        `;

        fs.writeFileSync('constraint_def.txt', JSON.stringify(result, null, 2));
    } catch (error) {
        fs.writeFileSync('constraint_def.txt', `Erro: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

checkConstraint();
