import { prisma } from './src/db.js';

async function seedSpecies() {
    const initialSpecies = ['Cachorro', 'Gato', 'Outro'];

    console.log('Iniciando seed de espécies...');

    for (const name of initialSpecies) {
        const existing = await prisma.pet_species.findUnique({
            where: { name }
        });

        if (!existing) {
            await prisma.pet_species.create({
                data: { name }
            });
            console.log(`Espécie criada: ${name}`);
        } else {
            console.log(`Espécie já existe: ${name}`);
        }
    }

    console.log('Seed concluído!');
}

seedSpecies()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
