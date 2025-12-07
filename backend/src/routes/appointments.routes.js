import express from 'express';
import { calculateDuration, createAppointment, getAppointments, updateAppointment, cancelAppointment } from '../controllers/appointments.controller.js';
import { authApiKey } from '../middleware/authApiKey.js';

const router = express.Router();

// ... comments ...

router.post('/calculate', calculateDuration);
router.post('/', createAppointment);
router.get('/', getAppointments);
router.patch('/:id', updateAppointment);
router.delete('/:id', cancelAppointment);

export default router;
