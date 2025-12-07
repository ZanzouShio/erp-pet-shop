import express from 'express';
import { listResources, createResource, updateResource, deleteResource } from '../controllers/groomingResources.controller.js';

const router = express.Router();

router.get('/', listResources);
router.post('/', createResource);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);

export default router;
