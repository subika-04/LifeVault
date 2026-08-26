import {
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
} from '../services/reminderService.js';
import { reconcilePendingReminders } from '../services/paymentSyncService.js';
import { PRIORITIES } from '../models/Reminder.js';

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
 * POST /api/reminders/reconcile-payments
 *
 * Re-checks every pending reminder for the authenticated user against
 * their existing expenses and completes any confident, unambiguous
 * match it finds — covering reminders whose corresponding expense was
 * recorded before payment-sync existed (or before a matching fix
 * shipped), without requiring the user to delete/re-add anything.
 */
export const reconcilePaymentsHandler = async (req, res, next) => {
  try {
    const completedReminders = await reconcilePendingReminders(req.user._id);

    res.status(200).json({
      success: true,
      message:
        completedReminders.length > 0
          ? `${completedReminders.length} reminder${completedReminders.length === 1 ? '' : 's'} matched to an existing payment and marked completed.`
          : 'No additional matches found — everything is already in sync.',
      data: { completedReminders },
    });
  } catch (error) {
    next(error);
  }
};
