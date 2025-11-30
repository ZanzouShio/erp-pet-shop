import { Router } from 'express';
import ReportsController from '../controllers/reports.controller.js';

const router = Router();

router.get('/daily-sales', ReportsController.getDailySalesSummary);
router.get('/cash-position', ReportsController.getCashPosition);
router.get('/financial-situation', ReportsController.getFinancialSituation);
router.get('/stock-alerts', ReportsController.getStockAlerts);
router.get('/product-performance', ReportsController.getProductPerformance);
router.get('/payment-fees', ReportsController.getPaymentFeesReport);

export default router;
