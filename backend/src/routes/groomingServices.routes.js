import express from 'express';
import { listServices, createService, updateService, deleteService } from '../controllers/groomingServices.controller.js';

const router = express.Router();

router.get('/', listServices);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

export default router;
