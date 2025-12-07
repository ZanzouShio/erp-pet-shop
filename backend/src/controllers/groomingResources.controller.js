import { prisma } from '../db.js';

export const listResources = async (req, res) => {
    try {
        const resources = await prisma.resources.findMany({
            orderBy: { name: 'asc' },
            where: { is_active: true }
        });
        res.json(resources);
    } catch (error) {
        console.error('Error listing resources:', error);
        res.status(500).json({ error: 'Erro ao listar recursos' });
    }
};

export const createResource = async (req, res) => {
    try {
        const { name, type } = req.body;

        const resource = await prisma.resources.create({
            data: {
                name,
                type: type || 'MESA', // Default
                is_active: true
            }
        });

        res.status(201).json(resource);
    } catch (error) {
        console.error('Error creating resource:', error);
        res.status(500).json({ error: 'Erro ao criar recurso' });
    }
};

export const updateResource = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, is_active } = req.body;

        const resource = await prisma.resources.update({
            where: { id },
            data: {
                name,
                type,
                is_active
            }
        });

        res.json(resource);
    } catch (error) {
        console.error('Error updating resource:', error);
        res.status(500).json({ error: 'Erro ao atualizar recurso' });
    }
};

export const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft Delete
        await prisma.resources.update({
            where: { id },
            data: { is_active: false }
        });

        res.json({ message: 'Recurso removido com sucesso' });
    } catch (error) {
        console.error('Error deleting resource:', error);
        res.status(500).json({ error: 'Erro ao remover recurso' });
    }
};
