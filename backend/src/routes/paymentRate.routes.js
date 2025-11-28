import { Router } from 'express';
import paymentRateController from '../controllers/paymentRate.controller.js';

const router = Router();

router.get('/', paymentRateController.index);
router.post('/', paymentRateController.create);
router.put('/:id', paymentRateController.update);
router.delete('/:id', paymentRateController.delete);

export default router;
