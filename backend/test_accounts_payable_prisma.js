import { accountsPayableController } from './src/controllers/accountsPayable.controller.js';
import { expenseCategoryController } from './src/controllers/expenseCategory.controller.js';
import { prisma } from './src/db.js';

async function runTest() {
    console.log('🚀 Iniciando teste de Contas a Pagar (Prisma)...');

    let categoryId = null;
    let accountId = null;

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
        // 1. Criar Categoria de Despesa
        console.log('\n1️⃣ Criando Categoria de Despesa...');
        const reqCat = {
            body: {
                name: 'Categoria Teste Prisma',
                description: 'Categoria para testes automatizados',
                color: '#FF0000'
            }
        };
        const resCat = mockRes();
        await expenseCategoryController.create(reqCat, resCat);

        if (resCat.data && resCat.data.id) {
            categoryId = resCat.data.id;
            console.log(`✅ Categoria criada: ${categoryId}`);
        } else {
            throw new Error('Falha ao criar categoria');
        }

        // 2. Criar Conta a Pagar
        console.log('\n2️⃣ Criando Conta a Pagar...');
        const reqAcc = {
            body: {
                description: 'Conta de Luz Teste',
                amount: 150.50,
                due_date: new Date().toISOString(),
                category_id: categoryId,
                notes: 'Teste de integração'
            }
        };
        const resAcc = mockRes();
        await accountsPayableController.create(reqAcc, resAcc);

        if (resAcc.data && resAcc.data.id) {
            accountId = resAcc.data.id;
            console.log(`✅ Conta criada: ${accountId}`);
        } else {
            throw new Error('Falha ao criar conta');
        }

        // 3. Listar Contas (Filtro)
        console.log('\n3️⃣ Listando Contas...');
        const reqList = {
            query: {
                categoryId: categoryId,
                status: 'pending'
            }
        };
        const resList = mockRes();
        await accountsPayableController.list(reqList, resList);

        if (Array.isArray(resList.data) && resList.data.length > 0) {
            console.log(`✅ Listagem retornou ${resList.data.length} itens.`);
            const found = resList.data.find(a => a.id === accountId);
            if (found) {
                console.log('✅ Conta criada encontrada na listagem.');
            } else {
                console.error('❌ Conta criada NÃO encontrada na listagem.');
            }
        } else {
            console.error('❌ Listagem vazia ou inválida.');
        }

        // 4. Pagar Conta
        console.log('\n4️⃣ Pagando Conta...');
        const reqPay = {
            params: { id: accountId },
            body: {
                amount_paid: 150.50,
                payment_date: new Date().toISOString(),
                payment_method: 'pix'
            }
        };
        const resPay = mockRes();
        await accountsPayableController.pay(reqPay, resPay);

        if (resPay.data && resPay.data.message === 'Pagamento registrado com sucesso') {
            console.log('✅ Pagamento registrado com sucesso.');
        } else {
            console.error('❌ Falha no pagamento.', resPay.data);
        }

        // 5. Verificar Transação e Status
        console.log('\n5️⃣ Verificando consistência no banco...');
        const updatedAccount = await prisma.accounts_payable.findUnique({ where: { id: accountId } });
        const transaction = await prisma.financial_transactions.findFirst({
            where: { account_payable_id: accountId }
        });

        if (updatedAccount.status === 'paid') {
            console.log('✅ Status da conta atualizado para "paid".');
        } else {
            console.error(`❌ Status incorreto: ${updatedAccount.status}`);
        }

        if (transaction) {
            console.log(`✅ Transação financeira criada (ID: ${transaction.id}).`);
        } else {
            console.error('❌ Transação financeira NÃO encontrada.');
        }

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    } finally {
        // Limpeza
        console.log('\n🧹 Limpando dados de teste...');
        if (accountId) {
            await prisma.financial_transactions.deleteMany({ where: { account_payable_id: accountId } });
            await prisma.accounts_payable.delete({ where: { id: accountId } });
        }
        if (categoryId) {
            await prisma.expense_categories.delete({ where: { id: categoryId } });
        }
        console.log('✨ Teste finalizado.');
    }
}

runTest();
