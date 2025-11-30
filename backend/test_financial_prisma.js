import { confirmEntry } from './src/controllers/financial.controller.js';
import { prisma } from './src/db.js';

async function runTest() {
    console.log('🚀 Iniciando teste do FinancialController (Prisma)...');

    // Dados Mockados (Simulando o frontend enviando dados da NFe)
    const mockNfeData = {
        number: '99999', // Número alto para evitar colisão
        series: '1',
        supplier: {
            cnpj: '00.000.000/0001-91', // CNPJ Teste
            name: 'Fornecedor Teste Prisma',
            tradeName: 'Teste Ltda'
        }
    };

    const mockItems = [
        {
            name: 'Produto Teste Prisma',
            ean: '7890000000001', // EAN Fictício
            quantity: 10,
            unitPrice: 50.00,
            matchedProduct: null // Forçar criação de novo produto
        }
    ];

    const req = {
        body: {
            nfeData: mockNfeData,
            items: mockItems
        }
    };

    const res = {
        status: (code) => {
            console.log(`Response Status: ${code}`);
            return res;
        },
        json: (data) => {
            console.log('Response JSON:', data);
        }
    };

    try {
        // 1. Limpar dados anteriores (se houver)
        console.log('🧹 Limpando dados anteriores...');
        const uniqueKey = `00000000000191-${mockNfeData.number}`;
        await prisma.stock_movements.deleteMany({
            where: { reference_id: uniqueKey }
        });
        await prisma.products.deleteMany({
            where: { ean: '7890000000001' }
        });

        // 2. Executar confirmEntry
        console.log('▶️ Executando confirmEntry...');
        await confirmEntry(req, res);

        // 3. Verificar no Banco
        console.log('\n🔍 Verificando no banco de dados...');
        const product = await prisma.products.findFirst({
            where: { ean: '7890000000001' }
        });

        if (product) {
            console.log(`✅ Produto criado: ${product.name} (ID: ${product.id})`);
            console.log(`   Estoque: ${product.stock_quantity}`);
            console.log(`   Custo: ${product.cost_price}`);

            const movement = await prisma.stock_movements.findFirst({
                where: { reference_id: uniqueKey }
            });

            if (movement) {
                console.log(`✅ Movimentação de estoque registrada (ID: ${movement.id})`);
            } else {
                console.error('❌ Movimentação de estoque NÃO encontrada.');
            }

        } else {
            console.error('❌ Produto NÃO encontrado.');
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        // Limpeza final (opcional, bom para não sujar o banco)
        console.log('\n🧹 Limpeza final...');
        const uniqueKey = `00000000000191-${mockNfeData.number}`;
        await prisma.stock_movements.deleteMany({ where: { reference_id: uniqueKey } });
        await prisma.products.deleteMany({ where: { ean: '7890000000001' } });
        console.log('✨ Teste concluído.');
    }
}

runTest();
