import { Router } from 'express';
import { createStockMovement, getStockMovements } from '../controllers/stock.controller.js';

const router = Router();

router.post('/', createStockMovement);
router.get('/', getStockMovements);

export default router;
