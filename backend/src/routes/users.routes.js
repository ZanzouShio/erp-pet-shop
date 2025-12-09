import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// CRUD
router.get('/', usersController.list);
router.get('/:id', usersController.getById);
router.post('/', usersController.create);
router.put('/:id', usersController.update);
router.delete('/:id', usersController.delete);

// Password management
router.post('/change-password', usersController.changePassword);
router.post('/:id/reset-password', usersController.resetPassword);

// Status toggle
router.post('/:id/toggle-status', usersController.toggleStatus);

// Login history
router.get('/:id/login-history', usersController.getLoginHistory);

export default router;
