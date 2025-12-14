import { Router } from 'express';
import { getDiscountAnalytics } from '../controllers/discountReport.controller.js';

const router = Router();

router.get('/discounts', getDiscountAnalytics);

export default router;
