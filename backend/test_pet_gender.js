import fs from 'fs';
import { prisma } from './src/db.js';

async function testGender() {
    const customer = await prisma.customers.findFirst();
    if (!customer) {
        fs.writeFileSync('test_gender_output.txt', 'Nenhum cliente encontrado para teste.\n');
        return;
    }

    const genders = ['m', 'f', 'Masculino', 'Feminino', 'boy', 'girl'];
    fs.writeFileSync('test_gender_output.txt', 'Iniciando testes...\n');

    for (const gender of genders) {
        try {
            await prisma.pets.create({
                data: {
                    customer_id: customer.id,
                    name: `Teste ${gender}`,
                    species: 'Cachorro',
                    gender: gender
                }
            });
            fs.appendFileSync('test_gender_output.txt', `✅ SUCESSO com gender: '${gender}'\n`);
        } catch (error) {
            fs.appendFileSync('test_gender_output.txt', `❌ FALHA com gender: '${gender}' - Erro: ${error.message.split('\n').pop()}\n`);
        }
    }
}

testGender()
    .catch(e => fs.appendFileSync('test_gender_output.txt', `Erro fatal: ${e.message}\n`))
    .finally(async () => {
        await prisma.$disconnect();
    });
