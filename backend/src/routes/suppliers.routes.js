import { Router } from 'express';
import suppliersController from '../controllers/suppliers.controller.js';

const router = Router();

router.post('/', suppliersController.create);
router.get('/', suppliersController.getAll);
router.get('/:id', suppliersController.getById);
router.put('/:id', suppliersController.update);
router.delete('/:id', suppliersController.delete);

export default router;
