import { Router } from 'express';
import CustomersController from '../controllers/customers.controller.js';

const router = Router();

// Rotas de Clientes
router.get('/', CustomersController.list);
router.get('/:id', CustomersController.getById);
router.post('/', CustomersController.create);
router.put('/:id', CustomersController.update);
router.delete('/:id', CustomersController.delete);

// Rotas de Pets (sub-recurso)
router.post('/:id/pets', CustomersController.addPet);
router.put('/pets/:petId', CustomersController.updatePet);
router.delete('/pets/:petId', CustomersController.deletePet);

export default router;
