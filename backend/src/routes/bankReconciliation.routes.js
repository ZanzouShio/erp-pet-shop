import { Router } from 'express';
import BankReconciliationController from '../controllers/bankReconciliation.controller.js';

const router = Router();

router.get('/', BankReconciliationController.index);
router.post('/import', BankReconciliationController.import);
router.post('/match', BankReconciliationController.match);
router.post('/create-and-match', BankReconciliationController.createAndMatch);

export default router;
