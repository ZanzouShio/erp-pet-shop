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
    console.log('🔍 Checking for Groomers...');

    const groomer = await prisma.users.findFirst({
        where: { is_groomer: true }
    });

    if (groomer) {
        console.log(`✅ Groomer found: ${groomer.name} (${groomer.id})`);
    } else {
        console.log('⚠️ No groomer found. Promoting the first user or creating one.');

        const user = await prisma.users.findFirst();
        if (user) {
            const updated = await prisma.users.update({
                where: { id: user.id },
                data: {
                    is_groomer: true,
                    seniority_level: 'SENIOR',
                    speed_factor: 1.0,
                    commission_rate: 10.0
                }
            });
            console.log(`✅ User ${updated.name} promoted to Groomer.`);
        } else {
            // Create dummy user
            const newUser = await prisma.users.create({
                data: {
                    name: 'Tosador Teste',
                    email: 'tosador@teste.com',
                    password: '123', // plain text for dev/test if schema allows, or handle hash
                    role: 'ADMIN',
                    is_groomer: true,
                    seniority_level: 'MID',
                    speed_factor: 1.0,
                    commission_rate: 20.0
                }
            });
            console.log(`✅ Created new Groomer: ${newUser.name}`);
        }
    }

    // Also check Services
    const services = await prisma.services.findMany();
    console.log(`ℹ️ Services count: ${services.length}`);

    if (services.length === 0) {
        console.log('⚠️ No services found. Creating basics...');

        const bath = await prisma.services.create({
            data: { name: 'Banho', base_price: 50.00, is_active: true }
        });
        console.log('Created Service: Banho');

        const cut = await prisma.services.create({
            data: { name: 'Tosa Higiênica', base_price: 30.00, is_active: true }
        });
        console.log('Created Service: Tosa Higiênica');

        const fullCut = await prisma.services.create({
            data: { name: 'Tosa Geral (Tesoura)', base_price: 80.00, is_active: true }
        });
        console.log('Created Service: Tosa Geral');

        // Matrix
        console.log('creating matrix...');
        await prisma.service_matrix.createMany({
            data: [
                { service_id: bath.id, breed_size: 'P', coat_type: 'curto', base_duration: 30 },
                { service_id: bath.id, breed_size: 'M', coat_type: 'curto', base_duration: 45 },
                { service_id: fullCut.id, breed_size: 'M', coat_type: 'longo', base_duration: 90 },
            ]
        });
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
