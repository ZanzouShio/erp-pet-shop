import { Router } from 'express';
import BankAccountController from '../controllers/bankAccount.controller.js';

const router = Router();

router.get('/', BankAccountController.list);
router.get('/:id', BankAccountController.getById);
router.post('/', BankAccountController.create);
router.put('/:id', BankAccountController.update);
router.delete('/:id', BankAccountController.delete);

export default router;
