import { prisma } from '../db.js';

class PetSpeciesController {
    // Listar todas as espécies
    async list(req, res) {
        try {
            const species = await prisma.pet_species.findMany({
                orderBy: { name: 'asc' }
            });
            res.json(species);
        } catch (error) {
            console.error('Erro ao listar espécies:', error);
            res.status(500).json({ error: 'Erro ao listar espécies' });
        }
    }

    // Criar nova espécie
    async create(req, res) {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Nome é obrigatório' });
            }

            const existing = await prisma.pet_species.findUnique({
                where: { name }
            });

            if (existing) {
                return res.status(400).json({ error: 'Espécie já cadastrada' });
            }

            const species = await prisma.pet_species.create({
                data: { name }
            });

            res.status(201).json(species);
        } catch (error) {
            console.error('Erro ao criar espécie:', error);
            res.status(500).json({ error: 'Erro ao criar espécie' });
        }
    }

    // Atualizar espécie
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, active } = req.body;

            const species = await prisma.pet_species.update({
                where: { id },
                data: { name, active }
            });

            res.json(species);
        } catch (error) {
            console.error('Erro ao atualizar espécie:', error);
            res.status(500).json({ error: 'Erro ao atualizar espécie' });
        }
    }

    // Excluir espécie
    async delete(req, res) {
        try {
            const { id } = req.params;

            // Verificar se existem pets usando esta espécie
            // Como o campo species em pets é string, verificamos pelo nome
            const species = await prisma.pet_species.findUnique({ where: { id } });

            if (species) {
                const inUse = await prisma.pets.findFirst({
                    where: { species: { equals: species.name, mode: 'insensitive' } }
                });

                if (inUse) {
                    return res.status(400).json({ error: 'Não é possível excluir esta espécie pois existem pets vinculados a ela. Tente inativá-la.' });
                }
            }

            await prisma.pet_species.delete({ where: { id } });
            res.json({ message: 'Espécie excluída com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir espécie:', error);
            res.status(500).json({ error: 'Erro ao excluir espécie' });
        }
    }
}

export default new PetSpeciesController();
