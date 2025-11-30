import { prisma } from './src/db.js';

async function main() {
    const existing = await prisma.bank_accounts.findFirst();
    if (existing) {
        console.log('Conta existente:', existing.id);
        return;
    }

    const account = await prisma.bank_accounts.create({
        data: {
            name: 'Conta Principal',
            bank_name: 'Banco do Brasil',
            account_number: '12345-6',
            agency: '1234',
            initial_balance: 1000.00,
            current_balance: 1000.00
        }
    });

    console.log('Conta criada:', account.id);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
