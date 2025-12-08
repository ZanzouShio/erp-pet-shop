import express from 'express';
import cashRegisterController from '../controllers/cashRegister.controller.js';

const router = express.Router();

// Get all cash registers with filters
router.get('/', cashRegisterController.list);

// Get cash register status for a terminal
router.get('/status/:terminalId', cashRegisterController.getStatus);

// Get cash register report by ID
router.get('/:id/report', cashRegisterController.getReport);

// Get movements for a cash register
router.get('/:id/movements', cashRegisterController.getMovements);

// Open a new cash register
router.post('/open', cashRegisterController.open);

// Close a cash register
router.post('/:id/close', cashRegisterController.close);

// Perform sangria (cash withdrawal)
router.post('/:id/sangria', cashRegisterController.sangria);

// Perform suprimento (cash addition)
router.post('/:id/suprimento', cashRegisterController.suprimento);

export default router;
