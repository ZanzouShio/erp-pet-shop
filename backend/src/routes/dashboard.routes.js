import { Router } from 'express';
import { getSummary, getTopProducts } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/top-products', getTopProducts);

export default router;
