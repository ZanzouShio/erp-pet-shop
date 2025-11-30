import fetch from 'node-fetch';
import { prisma } from './src/db.js';

async function testLoyalty() {
    try {
        // 1. Pegar um cliente existente (ou criar um)
        let customer = await prisma.customers.findFirst();
        if (!customer) {
            console.log('Criando cliente de teste...');
            customer = await prisma.customers.create({
                data: {
                    name: 'Cliente Fidelidade',
                    cpf_cnpj: '123.456.789-00',
                    email: 'fidelidade@teste.com'
                }
            });
        }
        console.log(`Cliente: ${customer.name} (ID: ${customer.id})`);
        console.log(`Pontos Iniciais: ${customer.loyalty_points || 0}`);

        // 2. Pegar um produto
        const product = await prisma.products.findFirst();
        if (!product) {
            console.error('Nenhum produto encontrado');
            return;
        }

        // 3. Criar venda para esse cliente
        console.log('Criando venda de R$ 100,00...');
        const response = await fetch('http://localhost:3001/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                    { product_id: product.id, quantity: 1, unit_price: 100 }
                ],
                payment_method: 'cash',
                discount_amount: 0,
                customer_id: customer.id
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Erro na venda:', data);
            return;
        }
        console.log('Venda criada:', data.sale.sale_number);

        // 4. Verificar pontos atualizados
        const updatedCustomer = await prisma.customers.findUnique({
            where: { id: customer.id }
        });
        console.log(`Pontos Finais: ${updatedCustomer.loyalty_points}`);

        if (updatedCustomer.loyalty_points > (customer.loyalty_points || 0)) {
            console.log('✅ SUCESSO: Pontos creditados!');
        } else {
            console.log('❌ FALHA: Pontos não creditados.');
        }

        // 5. Verificar transação
        const transaction = await prisma.loyalty_transactions.findFirst({
            where: { reference_id: data.sale.id }
        });
        if (transaction) {
            console.log('✅ SUCESSO: Transação registrada:', transaction);
        } else {
            console.log('❌ FALHA: Transação não encontrada.');
        }

    } catch (error) {
        console.error('Erro:', error);
    }
}

testLoyalty();
