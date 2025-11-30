import { prisma } from './src/db.js';

const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
    console.log('🚀 Iniciando testes de Contas a Receber...');
    let customerId = null;
    let receivableId = null;

    try {
        // 1. Criar Cliente de Teste
        console.log('\n1️⃣ Criando cliente de teste...');
        const customer = await prisma.customers.create({
            data: {
                name: 'Cliente Teste API Prisma',
                email: 'teste.api@prisma.com',
                cpf_cnpj: '12345678901', // CPF fictício
                phone: '11999999999'
            }
        });
        customerId = customer.id;
        console.log(`✅ Cliente criado: ${customerId}`);

        // 2. Criar Título a Receber
        console.log('\n2️⃣ Criando título a receber...');
        const receivable = await prisma.accounts_receivable.create({
            data: {
                customer_id: customerId,
                description: 'Venda Teste API',
                amount: 100.00,
                net_amount: 100.00,
                due_date: new Date(),
                status: 'pending',
                payment_method: 'credit_card'
            }
        });
        receivableId = receivable.id;
        console.log(`✅ Título criado: ${receivableId}`);

        // 3. Testar GET /accounts-receivable
        console.log('\n3️⃣ Testando GET /accounts-receivable...');
        const resList = await fetch(`${BASE_URL}/accounts-receivable?customer_id=${customerId}`);
        const listData = await resList.json();
        
        if (listData.length > 0 && listData.some(t => t.id === receivableId)) {
            console.log('✅ Listagem retornou o título criado.');
        } else {
            console.error('❌ Título não encontrado na listagem.', listData);
        }

        // 4. Testar GET /accounts-receivable/customer/:id
        console.log(`\n4️⃣ Testando GET /accounts-receivable/customer/${customerId}...`);
        const resCustomer = await fetch(`${BASE_URL}/accounts-receivable/customer/${customerId}`);
        const customerData = await resCustomer.json();

        if (customerData.summary.total_pending == 100) {
            console.log('✅ Resumo do cliente correto (Total Pending: 100).');
        } else {
            console.error('❌ Resumo incorreto.', customerData.summary);
        }

        // 5. Testar POST /accounts-receivable/:id/receive
        console.log(`\n5️⃣ Testando Recebimento (POST /receive)...`);
        const resReceive = await fetch(`${BASE_URL}/accounts-receivable/${receivableId}/receive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_date: new Date().toISOString() })
        });
        const receiveData = await resReceive.json();
        console.log('Resposta:', receiveData);

        if (resReceive.ok) {
            console.log('✅ Recebimento processado com sucesso via API.');
        } else {
            console.error('❌ Falha no recebimento.', receiveData);
        }

        // 6. Verificação no Banco de Dados
        console.log('\n6️⃣ Verificando consistência no banco...');
        const updatedTitle = await prisma.accounts_receivable.findUnique({ where: { id: receivableId } });
        const transaction = await prisma.financial_transactions.findFirst({ 
            where: { description: `Recebimento: ${receivable.description}` } 
        });

        if (updatedTitle.status === 'paid') {
            console.log('✅ Status do título atualizado para "paid".');
        } else {
            console.error(`❌ Status incorreto: ${updatedTitle.status}`);
        }

        if (transaction) {
            console.log('✅ Transação financeira criada com sucesso.');
        } else {
            console.error('❌ Transação financeira não encontrada.');
        }

    } catch (error) {
        console.error('❌ Erro durante os testes:', error);
    } finally {
        // Limpeza
        console.log('\n🧹 Limpando dados de teste...');
        if (receivableId) {
            await prisma.financial_transactions.deleteMany({ where: { description: 'Recebimento: Venda Teste API' } });
            await prisma.accounts_receivable.delete({ where: { id: receivableId } });
        }
        if (customerId) {
            await prisma.customers.delete({ where: { id: customerId } });
        }
        console.log('✨ Teste finalizado.');
    }
}

runTests();
