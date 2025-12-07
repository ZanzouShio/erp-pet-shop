import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding Grooming Module...');

    // 1. Create Services
    const bath = await prisma.services.create({
        data: { name: 'Banho', base_price: 50.00 }
    });

    const cut = await prisma.services.create({
        data: { name: 'Tosa Higiênica', base_price: 30.00 }
    });

    const fullCut = await prisma.services.create({
        data: { name: 'Tosa Geral (Tesoura)', base_price: 80.00 }
    });

    // 2. Create Matrix (Duration)
    // Banho
    await prisma.service_matrix.createMany({
        data: [
            { service_id: bath.id, breed_size: 'P', coat_type: 'curto', base_duration: 30 },
            { service_id: bath.id, breed_size: 'P', coat_type: 'longo', base_duration: 45 },
            { service_id: bath.id, breed_size: 'M', coat_type: 'curto', base_duration: 45 },
            { service_id: bath.id, breed_size: 'M', coat_type: 'longo', base_duration: 60 },
            { service_id: bath.id, breed_size: 'G', coat_type: 'curto', base_duration: 60 },
            { service_id: bath.id, breed_size: 'G', coat_type: 'longo', base_duration: 90 },
        ]
    });

    // Tosa
    await prisma.service_matrix.createMany({
        data: [
            { service_id: fullCut.id, breed_size: 'P', coat_type: 'longo', base_duration: 60 },
            { service_id: fullCut.id, breed_size: 'M', coat_type: 'longo', base_duration: 90 },
            { service_id: fullCut.id, breed_size: 'G', coat_type: 'longo', base_duration: 120 },
        ]
    });

    // 3. Resources
    await prisma.resources.createMany({
        data: [
            { name: 'Banheira 01 (P/M)', type: 'BANHEIRA' },
            { name: 'Banheira 02 (G/GIG)', type: 'BANHEIRA' },
            { name: 'Mesa de Secagem 01', type: 'MESA' },
            { name: 'Mesa de Tosa 01', type: 'MESA' },
        ]
    });

    // 4. Update Admin User to be a Groomer (Senior) for testing
    // Find first user
    const user = await prisma.users.findFirst();
    if (user) {
        await prisma.users.update({
            where: { id: user.id },
            data: {
                is_groomer: true,
                seniority_level: 'SENIOR',
                speed_factor: 1.0,
                commission_rate: 10.0
            }
        });
        console.log(`Updated user ${user.name} to Groomer`);
    }

    console.log('✅ Seeding Finished');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
