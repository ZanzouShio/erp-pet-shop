import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔍 Creating Test Customer & Pet...');

    // 1. Create or Find Customer
    let customer = await prisma.customers.findFirst({
        where: { email: 'cliente@teste.com' }
    });

    if (!customer) {
        customer = await prisma.customers.create({
            data: {
                name: 'Cliente Teste',
                email: 'cliente@teste.com',
                phone: '11999999999'
            }
        });
        console.log('✅ Created Customer.');
    } else {
        console.log('ℹ️ Customer found.');
    }

    // 2. Create Species (Dog) if needed
    let species = await prisma.pet_species.findFirst({ where: { name: 'Cachorro' } });
    if (!species) {
        species = await prisma.pet_species.create({ data: { name: 'Cachorro' } });
    }

    // 3. Create or Find Pet
    let pet = await prisma.pets.findFirst({
        where: { customer_id: customer.id }
    });

    if (!pet) {
        pet = await prisma.pets.create({
            data: {
                name: 'Rex O Matador de Bugs',
                customer_id: customer.id,
                species: 'Cachorro', // Fixed field name
                // species_id: species.id, // REMOVED 
                // Wait, if species_id is required, I need a species.
                // I added species creation above.
                // size: 'G', // Causing check constraint error
                // coat_type: 'longo', // Potentially causing check constraint error
                // gender: 'M' // Causing check constraint error
            }
        });
        console.log('✅ Created Pet.');
    } else {
        // Ensure properties are set
        if (!pet.size || !pet.coat_type) {
            pet = await prisma.pets.update({
                where: { id: pet.id },
                data: { size: 'G', coat_type: 'longo' }
            });
            console.log('upgraded pet properties');
        }
    }

    console.log('DATA_IDS:');
    console.log(`CUSTOMER_ID: ${customer.id}`);
    console.log(`PET_ID: ${pet.id}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
