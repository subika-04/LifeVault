import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  listReminders,
  getReminder,
  createReminderHandler,
  updateReminderHandler,
  deleteReminderHandler,
} from '../controllers/reminderController.js';

const router = Router();

router.use(protect);

router.get('/', listReminders);
router.get('/:id', getReminder);
router.post('/', createReminderHandler);
router.put('/:id', updateReminderHandler);
router.delete('/:id', deleteReminderHandler);

export default router;
