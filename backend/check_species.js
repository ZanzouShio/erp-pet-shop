import { prisma } from './src/db.js';

async function checkSpecies() {
    console.log('Verificando espécies no banco...');
    const species = await prisma.pet_species.findMany();
    console.log('Espécies encontradas:', species);
}

checkSpecies()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
