import { prisma } from './src/db.js';

async function checkLoyaltySettings() {
    try {
        let settings = await prisma.company_settings.findFirst();

        if (!settings) {
            console.log('⚠️ Nenhuma configuração encontrada. Criando padrão...');
            settings = await prisma.company_settings.create({
                data: {
                    company_name: 'Minha Loja',
                    cnpj: '00.000.000/0001-91',
                    loyalty_enabled: true,
                    loyalty_points_per_real: 1.0
                }
            });
        }

        console.log('🔧 Configurações de Fidelidade:');
        console.log(`- Habilitado: ${settings.loyalty_enabled}`);
        console.log(`- Pontos por Real: ${settings.loyalty_points_per_real}`);

    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

checkLoyaltySettings();
