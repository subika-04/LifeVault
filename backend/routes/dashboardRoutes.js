import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getDashboardData } from '../controllers/dashboardController.js';

const router = Router();

router.use(protect);

router.get('/', getDashboardData);

export default router;
