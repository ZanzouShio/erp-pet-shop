import { prisma } from './src/db.js';

async function checkSaleItems() {
    try {
        const items = await prisma.sale_items.findMany({
            take: 10,
            select: {
                id: true,
                quantity: true,
                unit_price: true,
                cost_price: true,
                total: true,
                products: {
                    select: {
                        name: true,
                        cost_price: true
                    }
                }
            }
        });

        console.log('=== SALE ITEMS ===');
        items.forEach((item, i) => {
            console.log(`\n[${i + 1}] Produto: ${item.products?.name}`);
            console.log(`    Qtd: ${item.quantity}`);
            console.log(`    Preço Unitário: ${item.unit_price}`);
            console.log(`    Custo no Item (cost_price): ${item.cost_price}`);
            console.log(`    Custo no Cadastro: ${item.products?.cost_price}`);
        });

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkSaleItems();
