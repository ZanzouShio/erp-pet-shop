import { Router } from 'express';
import accountsReceivableController from '../controllers/accountsReceivable.controller.js';

const router = Router();

router.get('/', accountsReceivableController.index);
router.get('/customer/:customerId', accountsReceivableController.getByCustomer);
router.post('/:id/receive', accountsReceivableController.receive);

export default router;
