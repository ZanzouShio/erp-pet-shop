import { Router } from 'express';
import { rolesController } from '../controllers/roles.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get available permissions list
router.get('/permissions', rolesController.getPermissions);

// Seed default roles
router.post('/seed', rolesController.seedDefaults);

// CRUD
router.get('/', rolesController.list);
router.get('/:id', rolesController.getById);
router.post('/', rolesController.create);
router.put('/:id', rolesController.update);
router.delete('/:id', rolesController.delete);

export default router;
