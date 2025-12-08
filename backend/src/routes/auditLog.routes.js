import express from 'express';
import { auditLogController } from '../controllers/auditLog.controller.js';

const router = express.Router();

router.get('/', auditLogController.list);
router.get('/entity-types', auditLogController.getEntityTypes);
router.get('/actions', auditLogController.getActions);

export default router;
