import { Router } from 'express';
import PetSpeciesController from '../controllers/petSpecies.controller.js';

const router = Router();

router.get('/', PetSpeciesController.list);
router.post('/', PetSpeciesController.create);
router.put('/:id', PetSpeciesController.update);
router.delete('/:id', PetSpeciesController.delete);

export default router;
