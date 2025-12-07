import { Router } from 'express';
import CommissionsController from '../controllers/commissions.controller.js';

const router = Router();

router.get('/', CommissionsController.list);
router.post('/pay', CommissionsController.pay);

export default router;
