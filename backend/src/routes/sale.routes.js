import { Router } from 'express';
import { createSale, getAllSales, getSaleById, cancelSale } from '../controllers/sale.controller.js';

const router = Router();

router.post('/', createSale);
router.get('/', getAllSales);
router.get('/:id', getSaleById);
router.post('/:id/cancel', cancelSale);

export default router;
