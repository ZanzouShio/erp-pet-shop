import { Router } from 'express';
import PaymentConfigurationController from '../controllers/paymentConfiguration.controller.js';

const router = Router();

router.get('/', PaymentConfigurationController.list);
router.post('/', PaymentConfigurationController.create);
router.put('/:id', PaymentConfigurationController.update);
router.delete('/:id', PaymentConfigurationController.delete);
router.get('/active/:type', PaymentConfigurationController.getActiveByType);

export default router;
