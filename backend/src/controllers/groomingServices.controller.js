import { prisma } from '../db.js';

export const listServices = async (req, res) => {
    try {
        const services = await prisma.services.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { items: true } // Check usage
                }
            }
        });
        res.json(services);
    } catch (error) {
        console.error('Error listing services:', error);
        res.status(500).json({ error: 'Erro ao listar serviços' });
    }
};

export const createService = async (req, res) => {
    try {
        const { name, base_price, description } = req.body;

        const service = await prisma.services.create({
            data: {
                name,
                base_price: base_price || 0,
                description,
                is_active: true
            }
        });

        res.status(201).json(service);
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Erro ao criar serviço' });
    }
};

export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, base_price, description, is_active } = req.body;

        const service = await prisma.services.update({
            where: { id },
            data: {
                name,
                base_price,
                description,
                is_active
            }
        });

        res.json(service);
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Erro ao atualizar serviço' });
    }
};

export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        // Check for existing usages in appointments
        const usage = await prisma.appointment_services.findFirst({ where: { service_id: id } });

        if (usage) {
            // Soft Delete
            await prisma.services.update({
                where: { id },
                data: { is_active: false }
            });
            return res.json({ message: 'Serviço inativado (possui agendamentos vinculados)' });
        }

        // Hard Delete
        await prisma.services.delete({ where: { id } });
        res.json({ message: 'Serviço removido com sucesso' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Erro ao remover serviço' });
    }
};
