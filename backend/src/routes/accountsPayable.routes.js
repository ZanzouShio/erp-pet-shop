import express from 'express';
import { expenseCategoryController } from '../controllers/expenseCategory.controller.js';
import { accountsPayableController } from '../controllers/accountsPayable.controller.js';

const router = express.Router();

// Rotas de Categorias
router.get('/categories', expenseCategoryController.list);
router.post('/categories', expenseCategoryController.create);
router.put('/categories/:id', expenseCategoryController.update);
router.delete('/categories/:id', expenseCategoryController.delete);

// Rotas de Contas a Pagar
router.get('/', accountsPayableController.list);
router.post('/', accountsPayableController.create);
router.post('/:id/pay', accountsPayableController.pay); // Registrar pagamento
router.post('/:id/cancel', accountsPayableController.cancel); // Cancelar conta
router.delete('/:id', accountsPayableController.delete);

export default router;
