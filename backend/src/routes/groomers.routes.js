import express from 'express';
import { listGroomers, createGroomer, updateGroomer, deleteGroomer } from '../controllers/groomers.controller.js';

const router = express.Router();

router.get('/', listGroomers);
router.post('/', createGroomer);
router.put('/:id', updateGroomer);
router.delete('/:id', deleteGroomer);

export default router;
