import { cashFlowController } from './src/controllers/cashFlow.controller.js';
import { prisma } from './src/db.js';

async function runTest() {
    console.log('🚀 Iniciando teste de Fluxo de Caixa (Prisma)...');

    // Mock Response Helper
    const mockRes = () => {
        const res = {};
        res.status = (code) => {
            res.statusCode = code;
            return res;
        };
        res.json = (data) => {
            res.data = data;
            return res;
        };
        return res;
    };

    try {
        // 1. Criar Dados de Teste (Receitas e Despesas Futuras)
        console.log('\n1️⃣ Criando dados de teste...');
        const today = new Date();
        const d7 = new Date(); d7.setDate(today.getDate() + 7);
        const d15 = new Date(); d15.setDate(today.getDate() + 15);
        const d30 = new Date(); d30.setDate(today.getDate() + 30);

        // Receita para D+7
        await prisma.accounts_receivable.create({
            data: {
                description: 'Venda Futura D+7',
                amount: 500.00,
                net_amount: 500.00,
                due_date: d7,
                status: 'pending'
            }
        });

        // Despesa para D+15
        await prisma.accounts_payable.create({
            data: {
                description: 'Conta Futura D+15',
                amount: 200.00,
                due_date: d15,
                status: 'pending'
            }
        });

        // Receita para D+30
        await prisma.accounts_receivable.create({
            data: {
                description: 'Venda Futura D+30',
                amount: 1000.00,
                net_amount: 1000.00,
                due_date: d30,
                status: 'pending'
            }
        });

        // 2. Testar Projeções (getProjections)
        console.log('\n2️⃣ Testando Projeções (getProjections)...');
        const reqProj = {
            query: {
                startDate: today.toISOString(),
                endDate: d30.toISOString()
            }
        };
        const resProj = mockRes();
        await cashFlowController.getProjections(reqProj, resProj);

        if (resProj.data && Array.isArray(resProj.data.projections)) {
            console.log(`✅ Projeções retornadas: ${resProj.data.projections.length} dias com movimentação.`);
            const proj = resProj.data.projections;

            // Verificar se as datas aparecem
            const hasD7 = proj.some(p => p.in > 0);
            const hasD15 = proj.some(p => p.out > 0);

            if (hasD7 && hasD15) {
                console.log('✅ Movimentações de D+7 e D+15 identificadas nas projeções.');
            } else {
                console.error('❌ Movimentações não encontradas nas projeções.');
            }
        } else {
            console.error('❌ Falha ao obter projeções.', resProj.data);
        }

        // 3. Testar Visão Detalhada (getDailyView - D+15)
        console.log('\n3️⃣ Testando Visão Detalhada (D+15)...');
        const reqView = {
            query: { days: 15 }
        };
        const resView = mockRes();
        await cashFlowController.getDailyView(reqView, resView);

        if (Array.isArray(resView.data)) {
            console.log(`✅ Visão D+15 retornou ${resView.data.length} itens.`);
            const d7Item = resView.data.find(i => i.description === 'Venda Futura D+7');
            const d15Item = resView.data.find(i => i.description === 'Conta Futura D+15');
            const d30Item = resView.data.find(i => i.description === 'Venda Futura D+30');

            if (d7Item && d15Item) {
                console.log('✅ Itens de D+7 e D+15 encontrados.');
            } else {
                console.error('❌ Itens de D+7 ou D+15 faltando.');
            }

            if (!d30Item) {
                console.log('✅ Item de D+30 corretamente ignorado (fora do range).');
            } else {
                console.error('❌ Item de D+30 apareceu indevidamente.');
            }

        } else {
            console.error('❌ Falha ao obter visão detalhada.', resView.data);
        }

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    } finally {
        // Limpeza
        console.log('\n🧹 Limpando dados de teste...');
        await prisma.accounts_receivable.deleteMany({ where: { description: { in: ['Venda Futura D+7', 'Venda Futura D+30'] } } });
        await prisma.accounts_payable.deleteMany({ where: { description: 'Conta Futura D+15' } });
        console.log('✨ Teste finalizado.');
    }
}

runTest();
