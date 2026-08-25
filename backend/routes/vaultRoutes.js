import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getSummary, getTimeline } from '../controllers/vaultController.js';

const router = Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/timeline', getTimeline);

export default router;
