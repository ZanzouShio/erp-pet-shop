import express from 'express';
import { getServiceMatrix, upsertMatrixEntry, deleteMatrixEntry } from '../controllers/serviceMatrix.controller.js';

const router = express.Router();

router.get('/:serviceId', getServiceMatrix);
router.post('/', upsertMatrixEntry);
router.delete('/:id', deleteMatrixEntry);

export default router;
