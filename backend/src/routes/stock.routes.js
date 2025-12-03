import { Router } from 'express';
import { createStockMovement, getStockMovements, openPackage } from '../controllers/stock.controller.js';

const router = Router();

router.post('/', createStockMovement);
router.post('/open-package', openPackage);
router.get('/', getStockMovements);

export default router;
