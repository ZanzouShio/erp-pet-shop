import { Router } from 'express';
import { cashFlowController } from '../controllers/cashFlow.controller.js';

const router = Router();

router.get('/projections', cashFlowController.getProjections);
router.get('/daily-view', cashFlowController.getDailyView);

export default router;
