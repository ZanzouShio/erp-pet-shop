import { prisma } from '../db.js';

export const getServiceMatrix = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const matrix = await prisma.service_matrix.findMany({
            where: { service_id: serviceId }
        });
        res.json(matrix);
    } catch (error) {
        console.error('Error getting service matrix:', error);
        res.status(500).json({ error: 'Erro ao buscar matriz de preço' });
    }
};

export const upsertMatrixEntry = async (req, res) => {
    try {
        const { service_id, breed_size, coat_type, base_duration, price_adder } = req.body;

        const entry = await prisma.service_matrix.upsert({
            where: {
                service_id_breed_size_coat_type: {
                    service_id,
                    breed_size,
                    coat_type
                }
            },
            update: {
                base_duration: parseInt(base_duration),
                price_adder: parseFloat(price_adder)
            },
            create: {
                service_id,
                breed_size,
                coat_type,
                base_duration: parseInt(base_duration),
                price_adder: parseFloat(price_adder)
            }
        });

        res.json(entry);
    } catch (error) {
        console.error('Error upserting matrix entry:', error);
        res.status(500).json({ error: 'Erro ao atualizar matriz' });
    }
};

export const deleteMatrixEntry = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.service_matrix.delete({
            where: { id }
        });
        res.json({ message: 'Entrada removida com sucesso' });
    } catch (error) {
        console.error('Error deleting matrix entry:', error);
        res.status(500).json({ error: 'Erro ao remover entrada' });
    }
};
