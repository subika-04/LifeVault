import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  listExpenses,
  getExpense,
  createExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
} from '../controllers/expenseController.js';

const router = Router();

router.use(protect);

router.get('/', listExpenses);
router.get('/:id', getExpense);
router.post('/', createExpenseHandler);
router.put('/:id', updateExpenseHandler);
router.delete('/:id', deleteExpenseHandler);

export default router;
