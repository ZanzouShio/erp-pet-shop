import { prisma } from '../db.js';

export const getServices = async (req, res) => {
    try {
        const services = await prisma.services.findMany({
            // where: { is_active: true } // Debugging empty list
        });
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching services' });
    }
};

export const getProfessionals = async (req, res) => {
    try {
        const professionals = await prisma.users.findMany({
            where: { is_groomer: true },
            select: {
                id: true,
                name: true,
                seniority_level: true,
                speed_factor: true,
                commission_rate: true
            }
        });
        res.json(professionals);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching professionals' });
    }
};

export const getResources = async (req, res) => {
    try {
        const resources = await prisma.resources.findMany({
            where: { is_active: true }
        });
        res.json(resources);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching resources' });
    }
};

export const seedGroomingData = async (req, res) => {
    try {
        console.log('🌱 Seeding Grooming Module via API...');

        // 1. Create Services
        // 1. Create Services (Upsert logic simulation or check)
        const services = ['Banho', 'Tosa Higiênica', 'Tosa Geral (Tesoura)'];
        const prices = [50, 30, 80];

        const createdServices = [];
        for (let i = 0; i < services.length; i++) {
            const existing = await prisma.services.findFirst({ where: { name: services[i] } });
            if (!existing) {
                createdServices.push(await prisma.services.create({ data: { name: services[i], base_price: prices[i] } }));
            } else {
                createdServices.push(existing);
            }
        }

        const [bath, cut, fullCut] = createdServices;

        // 2. Resources
        await prisma.resources.createMany({
            data: [
                { name: 'Banheira 01 (P/M)', type: 'BANHEIRA' },
                { name: 'Banheira 02 (G/GIG)', type: 'BANHEIRA' },
                { name: 'Mesa de Secagem 01', type: 'MESA' },
                { name: 'Mesa de Tosa 01', type: 'MESA' },
            ]
        });

        // 3. Update Admin to Groomer
        const user = await prisma.users.findFirst();
        if (user) {
            await prisma.users.update({
                where: { id: user.id },
                data: { is_groomer: true, seniority_level: 'SENIOR', speed_factor: 1.0, commission_rate: 10.0 }
            });
        }

        // 4. Matrix (Simplified for brevity)
        await prisma.service_matrix.createMany({
            data: [
                { service_id: bath.id, breed_size: 'P', coat_type: 'curto', base_duration: 30 },
                { service_id: bath.id, breed_size: 'M', coat_type: 'curto', base_duration: 45 },
                { service_id: fullCut.id, breed_size: 'M', coat_type: 'longo', base_duration: 90 },
            ]
        });

        res.json({ message: 'Seeding successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
