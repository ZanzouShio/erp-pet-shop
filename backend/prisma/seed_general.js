
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper for random string
const randomString = (length) => Math.random().toString(36).substring(2, 2 + length);
// Helper for random CPF (simple generator, not valid val)
const randomCPF = () => Math.floor(Math.random() * 10000000000 + 10000000000).toString().substring(0, 11);

async function main() {
    console.log('🌱 Starting General Seed...');

    // 1. Categories (Model: product_categories)
    const categoriesData = [
        { name: 'Alimentos', description: 'Rações e petiscos' },
        { name: 'Farmácia', description: 'Medicamentos e vitaminas' },
        { name: 'Higiene', description: 'Shampoos, tapetes, areia' },
        { name: 'Acessórios', description: 'Coleiras, guias, brinquedos' },
    ];

    const categories = {};
    for (const cat of categoriesData) {
        let created = await prisma.product_categories.findFirst({ where: { name: cat.name } });
        if (!created) {
            created = await prisma.product_categories.create({ data: cat });
        }
        categories[cat.name] = created.id;
        console.log(`Created Category: ${cat.name}`);
    }

    // 2. Suppliers (Model: suppliers uses company_name)
    const suppliersData = [
        { company_name: 'Distribuidora PetGlobal', email: 'contato@petglobal.com', cnpj: '12345678000199', phone: '11999999999' },
        { company_name: 'VetPharma Ltda', email: 'vendas@vetpharma.com', cnpj: '98765432000188', phone: '11888888888' },
    ];

    const suppliers = [];
    for (const sup of suppliersData) {
        let supplier = await prisma.suppliers.findFirst({ where: { email: sup.email } });
        if (!supplier) {
            supplier = await prisma.suppliers.create({ data: sup });
        }
        suppliers.push(supplier.id);
        console.log(`Created/Found Supplier: ${sup.company_name}`);
    }

    // 3. Products
    const productsData = [
        { name: 'Ração Golden Adulto 15kg', category_key: 'Alimentos', price: 149.90, cost_price: 100.00, stock_quantity: 20, min_stock: 5, barcode: '789100010001' },
        { name: 'Ração Premium Filhote 3kg', category_key: 'Alimentos', price: 45.90, cost_price: 25.00, stock_quantity: 15, min_stock: 3, barcode: '789100010002' },
        { name: 'Petisco Bifinho Carne', category_key: 'Alimentos', price: 5.90, cost_price: 2.50, stock_quantity: 100, min_stock: 20, barcode: '789100010003' },
        { name: 'Shampoo Antipulgas 500ml', category_key: 'Higiene', price: 32.50, cost_price: 18.00, stock_quantity: 10, min_stock: 2, barcode: '789100020001' },
        { name: 'Tapete Higiênico 30un', category_key: 'Higiene', price: 59.90, cost_price: 35.00, stock_quantity: 25, min_stock: 5, barcode: '789100020002' },
        { name: 'Simparic 10mg (3 cães)', category_key: 'Farmácia', price: 99.90, cost_price: 70.00, stock_quantity: 30, min_stock: 5, barcode: '789100030001' },
        { name: 'Apoquel 5.4mg', category_key: 'Farmácia', price: 210.00, cost_price: 160.00, stock_quantity: 5, min_stock: 1, barcode: '789100030002' },
        { name: 'Brinquedo Bola Corda', category_key: 'Acessórios', price: 15.00, cost_price: 8.00, stock_quantity: 50, min_stock: 10, barcode: '789100040001' },
        { name: 'Coleira Peitoral P', category_key: 'Acessórios', price: 45.00, cost_price: 20.00, stock_quantity: 8, min_stock: 2, barcode: '789100040002' },
    ];

    for (const prod of productsData) {
        const supplierId = suppliers[Math.floor(Math.random() * suppliers.length)];
        // Check if exists
        const exists = await prisma.products.findFirst({ where: { name: prod.name } });
        if (!exists) {
            // Destructure to remove category_key, price, and barcode (and verify other fields)
            const { category_key, price, barcode, ...otherProps } = prod;

            await prisma.products.create({
                data: {
                    ...otherProps, // spread name, cost_price, etc.
                    sale_price: price, // correct mapping
                    ean: barcode, // correct mapping
                    category_id: categories[prod.category_key],
                    supplier_id: supplierId,
                    is_active: true
                }
            });
            console.log(`Created Product: ${prod.name}`);
        } else {
            console.log(`Product already exists: ${prod.name}`);
        }
    }

    // 4. Customers
    const customersData = [
        { name: 'João Silva', email: 'joao@email.com', phone: '11999991111', cpf: randomCPF() },
        { name: 'Maria Oliveira', email: 'maria@email.com', phone: '11999992222', cpf: randomCPF() },
        { name: 'Carlos Santos', email: 'carlos@email.com', phone: '11999993333', cpf: randomCPF() },
    ];

    for (const cust of customersData) {
        let created = await prisma.customers.findFirst({ where: { email: cust.email } });

        if (!created) {
            created = await prisma.customers.create({ data: cust });
            console.log(`Created Customer: ${cust.name}`);
        } else {
            console.log(`Customer already exists: ${cust.name}`);
        }

        // Create Pet for customer if not exists
        const existingPet = await prisma.pets.findFirst({ where: { customer_id: created.id } });
        if (!existingPet) {
            await prisma.pets.create({
                data: {
                    name: `Pet do ${cust.name.split(' ')[0]}`,
                    species: 'Cachorro',
                    breed: 'Vira-lata',
                    customer_id: created.id,
                    size: 'M',
                    coat_type: 'curto'
                }
            });
            console.log(`Created Pet for ${cust.name}`);
        }
    }

    console.log('✅ Seed Finished Successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
