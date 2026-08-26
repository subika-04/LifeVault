import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  listReminders,
  getReminder,
  createReminderHandler,
  updateReminderHandler,
  deleteReminderHandler,
  reconcilePaymentsHandler,
} from '../controllers/reminderController.js';

const router = Router();

router.use(protect);

router.get('/', listReminders);
// Must be declared before '/:id' would otherwise be ambiguous for GET —
// this is POST-only so there's no actual collision, but keeping it near
// the top documents intent clearly.
router.post('/reconcile-payments', reconcilePaymentsHandler);
router.get('/:id', getReminder);
router.post('/', createReminderHandler);
router.put('/:id', updateReminderHandler);
router.delete('/:id', deleteReminderHandler);

export default router;
