import { prisma } from './src/db.js';

async function updateSaleItemsCosts() {
    try {
        console.log('Atualizando cost_price em sale_items...');

        // Update sale_items with cost_price from products
        const result = await prisma.$executeRawUnsafe(`
            UPDATE sale_items si
            SET cost_price = p.cost_price
            FROM products p
            WHERE si.product_id = p.id
            AND si.cost_price IS NULL
        `);

        console.log('✅ Registros atualizados:', result);

        // Verificar
        const check = await prisma.sale_items.findMany({
            where: { cost_price: { not: null } },
            take: 5,
            select: {
                id: true,
                cost_price: true,
                products: { select: { name: true } }
            }
        });

        console.log('\n📋 Amostra de itens atualizados:');
        check.forEach(item => {
            console.log(`  - ${item.products?.name}: R$ ${item.cost_price}`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

updateSaleItemsCosts();
