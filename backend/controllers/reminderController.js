import {
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
} from '../services/reminderService.js';
import { markBillAsPaid, BillPaymentError } from '../services/billPaymentService.js';
import { PRIORITIES } from '../models/Reminder.js';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../models/Expense.js';

export const listReminders = async (req, res, next) => {
  try {
    const { priority, isCompleted } = req.query;
    const reminders = await getReminders(req.user._id, { priority, isCompleted });

    res.status(200).json({
      success: true,
      data: { reminders },
    });
  } catch (error) {
    next(error);
  }
};

export const getReminder = async (req, res, next) => {
  try {
    const reminder = await getReminderById(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      data: { reminder },
    });
  } catch (error) {
    next(error);
  }
};

export const createReminderHandler = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, isCompleted, amount } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reminder title and due date',
      });
    }

    if (priority && !PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority value',
      });
    }

    if (amount !== undefined && amount !== null && amount !== '' && Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount cannot be negative',
      });
    }

    const reminder = await createReminder(req.user._id, {
      title,
      description,
      dueDate,
      priority,
      isCompleted,
      amount,
    });

    res.status(201).json({
      success: true,
      data: { reminder },
    });
  } catch (error) {
    next(error);
  }
};

export const updateReminderHandler = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, isCompleted, amount } = req.body;

    if (priority && !PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority value',
      });
    }

    if (amount !== undefined && amount !== null && amount !== '' && Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount cannot be negative',
      });
    }

    const reminder = await updateReminder(req.user._id, req.params.id, {
      title,
      description,
      dueDate,
      priority,
      isCompleted,
      amount,
    });

    res.status(200).json({
      success: true,
      data: { reminder },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReminderHandler = async (req, res, next) => {
  try {
    await deleteReminder(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reminders/:id/mark-paid
 *
 * The single, explicit user action point for resolving a bill reminder.
 * Only ever runs after the user has confirmed "Yes, I Paid It" in the
 * frontend dialog — nothing in the app calls this implicitly.
 *
 * body (all optional — the dialog pre-fills from the reminder/document,
 * but the user may confirm/adjust before submitting):
 *   { amount, category, paymentMethod, date }
 *
 * On success: the linked Document (if any) is marked paid, an Expense
 * is created, and the Reminder is deleted outright.
 * Idempotent: a repeat call (e.g. a double click) never creates a
 * second expense — it either reports the already-paid state or, if the
 * reminder was already deleted by the first call, responds gracefully
 * rather than erroring.
 */
export const markBillPaidHandler = async (req, res, next) => {
  try {
    const { amount, category, paymentMethod, date } = req.body;

    if (amount !== undefined && amount !== null && amount !== '' && Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero',
      });
    }
    if (category !== undefined && category !== null && category !== '' && !EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category value',
      });
    }
    if (paymentMethod !== undefined && paymentMethod !== null && paymentMethod !== '' && !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method value',
      });
    }

    const result = await markBillAsPaid(req.user._id, req.params.id, {
      amount,
      category,
      paymentMethod,
      date,
    });

    if (result.alreadyPaid) {
      return res.status(200).json({
        success: true,
        message: 'This bill was already marked as paid — no duplicate payment was recorded.',
        data: {
          alreadyPaid: true,
          expense: result.expense || null,
          document: result.document || null,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully.',
      data: {
        alreadyPaid: false,
        expense: result.expense,
        document: result.document,
      },
    });
  } catch (error) {
    if (error instanceof BillPaymentError) {
      // A 404 here specifically means "the reminder is already gone" —
      // most likely a near-simultaneous double click. Treat it the same
      // as an already-paid response rather than a scary error: no
      // duplicate was created either way, which is what matters.
      if (error.statusCode === 404) {
        return res.status(200).json({
          success: true,
          message: 'This bill was already marked as paid — no duplicate payment was recorded.',
          data: { alreadyPaid: true, expense: null, document: null },
        });
      }
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
