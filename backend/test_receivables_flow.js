import fetch from 'node-fetch';
import pool from './src/db.js';

const API_URL = 'http://localhost:3001/api';

async function runTest() {
    console.log('🚀 Iniciando Teste de Integração: Contas a Receber');

    try {
        // 1. Limpar dados de teste anteriores (opcional, mas bom para garantir)
        // await pool.query("DELETE FROM payment_rates WHERE provider = 'TEST_PROVIDER'");

        // 2. Criar Taxa de Pagamento (Simulando configuração)
        console.log('\n1️⃣  Criando Taxa de Pagamento (Crédito 2x-12x, 5% taxa, 30 dias liq)...');
        const rateRes = await fetch(`${API_URL}/payment-rates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'TEST_PROVIDER',
                payment_type: 'credit_installment',
                installments_min: 2,
                installments_max: 12,
                fee_percent: 5.0,
                days_to_liquidate: 30
            })
        });

        if (!rateRes.ok) throw new Error(`Falha ao criar taxa: ${await rateRes.text()}`);
        const rate = await rateRes.json();
        console.log('✅ Taxa criada:', rate);

        // 3. Criar Produto de Teste (se não existir)
        const productRes = await pool.query("SELECT id FROM products LIMIT 1");
        let productId;
        if (productRes.rows.length === 0) {
            // Criar um rapidinho se não tiver
            const newProd = await pool.query("INSERT INTO products (name, price, stock_quantity) VALUES ('Prod Teste', 100, 100) RETURNING id");
            productId = newProd.rows[0].id;
        } else {
            productId = productRes.rows[0].id;
        }

        // 4. Simular Venda (R$ 300,00 em 3x no Crédito)
        console.log('\n2️⃣  Simulando Venda (R$ 300,00 em 3x)...');
        const saleRes = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [
                    { product_id: productId, quantity: 3, unit_price: 100 }
                ],
                payment_method: 'credit_card',
                installments: 3,
                discount_amount: 0
            })
        });

        if (!saleRes.ok) throw new Error(`Falha ao criar venda: ${await saleRes.text()}`);
        const saleData = await saleRes.json();
        console.log('✅ Venda criada:', saleData.sale);

        // 5. Verificar Títulos Gerados
        console.log('\n3️⃣  Verificando Títulos a Receber...');
        const titlesRes = await fetch(`${API_URL}/accounts-receivable`);
        const titles = await titlesRes.json();

        // Filtrar pelos títulos desta venda
        const saleTitles = titles.filter(t => t.description.includes(saleData.sale.sale_number));

        console.log(`📊 Títulos encontrados para a venda #${saleData.sale.sale_number}: ${saleTitles.length}`);

        if (saleTitles.length !== 3) {
            console.error('❌ ERRO: Deveriam ser 3 parcelas!');
        } else {
            saleTitles.forEach((t, index) => {
                console.log(`   🔸 Parcela ${t.installment_number}: Bruto R$ ${t.amount} | Líquido R$ ${t.net_amount} | Taxa R$ ${t.tax_amount} | Vencimento: ${t.due_date.split('T')[0]}`);

                // Validações básicas
                if (Number(t.amount) !== 100.00) console.error('      ❌ Valor bruto incorreto');
                if (Number(t.tax_amount) !== 5.00) console.error('      ❌ Valor da taxa incorreto (esperado 5.00)');
                if (Number(t.net_amount) !== 95.00) console.error('      ❌ Valor líquido incorreto (esperado 95.00)');
            });
            console.log('✅ Validação de valores concluída com sucesso!');
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        // pool.end(); // Não fechar pool se for script único, mas aqui ok
        process.exit();
    }
}

runTest();
