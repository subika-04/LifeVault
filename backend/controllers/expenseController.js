import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../services/expenseService.js';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../models/Expense.js';

export const listExpenses = async (req, res, next) => {
  try {
    const { category, search, startDate, endDate } = req.query;
    const expenses = await getExpenses(req.user._id, { category, search, startDate, endDate });

    res.status(200).json({
      success: true,
      data: { expenses },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpense = async (req, res, next) => {
  try {
    const expense = await getExpenseById(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

export const createExpenseHandler = async (req, res, next) => {
  try {
    const { amount, category, description, date, paymentMethod } = req.body;

    if (amount === undefined || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide amount, category, and description',
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
      });
    }

    if (!EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense category',
      });
    }

    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
    }

    const expense = await createExpense(req.user._id, {
      amount: Number(amount),
      category,
      description,
      date,
      paymentMethod,
    });

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

export const updateExpenseHandler = async (req, res, next) => {
  try {
    const { amount, category, description, date, paymentMethod } = req.body;

    if (amount !== undefined && Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
      });
    }

    if (category && !EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense category',
      });
    }

    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
    }

    const expense = await updateExpense(req.user._id, req.params.id, {
      amount: amount !== undefined ? Number(amount) : undefined,
      category,
      description,
      date,
      paymentMethod,
    });

    res.status(200).json({
      success: true,
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpenseHandler = async (req, res, next) => {
  try {
    await deleteExpense(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
