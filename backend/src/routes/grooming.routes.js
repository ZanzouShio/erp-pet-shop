import express from 'express';
import { getServices, getProfessionals, getResources, seedGroomingData } from '../controllers/groomingOptions.controller.js';

const router = express.Router();

router.post('/seed', seedGroomingData);

router.get('/services', getServices);
router.get('/professionals', getProfessionals);
router.get('/resources', getResources);

export default router;
