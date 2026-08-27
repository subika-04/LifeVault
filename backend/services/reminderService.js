import Reminder from '../models/Reminder.js';

export const getReminders = async (userId, { priority, isCompleted } = {}) => {
  const query = { user: userId };

  if (priority && priority !== 'all') {
    query.priority = priority;
  }

  if (isCompleted !== undefined && isCompleted !== 'all') {
    query.isCompleted = isCompleted === 'true' || isCompleted === true;
  }

  return await Reminder.find(query).sort({ dueDate: 1 });
};

export const getReminderById = async (userId, reminderId) => {
  const reminder = await Reminder.findOne({ _id: reminderId, user: userId });
  if (!reminder) {
    const error = new Error('Reminder not found');
    error.statusCode = 404;
    throw error;
  }
  return reminder;
};

export const createReminder = async (userId, reminderData) => {
  const reminder = await Reminder.create({
    user: userId,
    title: reminderData.title,
    description: reminderData.description || '',
    dueDate: reminderData.dueDate,
    priority: reminderData.priority || 'Medium',
    isCompleted: reminderData.isCompleted || false,
    amount:
      reminderData.amount !== undefined && reminderData.amount !== null && reminderData.amount !== ''
        ? Number(reminderData.amount)
        : null,
  });
  return reminder;
};

export const updateReminder = async (userId, reminderId, reminderData) => {
  const reminder = await getReminderById(userId, reminderId);

  if (reminderData.title !== undefined) reminder.title = reminderData.title;
  if (reminderData.description !== undefined) reminder.description = reminderData.description;
  if (reminderData.dueDate !== undefined) reminder.dueDate = reminderData.dueDate;
  if (reminderData.priority !== undefined) reminder.priority = reminderData.priority;
  if (reminderData.amount !== undefined) {
    reminder.amount =
      reminderData.amount === null || reminderData.amount === '' ? null : Number(reminderData.amount);
  }
  if (reminderData.isCompleted !== undefined) {
    reminder.isCompleted = reminderData.isCompleted;
    if (reminderData.isCompleted) {
      // Manual completion — only stamp completedAt if not already set by
      // the payment-sync engine (don't overwrite an automatic completion).
      if (!reminder.completedAt) reminder.completedAt = new Date();
    } else {
      // Reopening a reminder clears any prior completion trail.
      reminder.completedAt = null;
      reminder.completedByExpense = null;
    }
  }

  await reminder.save();
  return reminder;
};

export const deleteReminder = async (userId, reminderId) => {
  const reminder = await getReminderById(userId, reminderId);
  await reminder.deleteOne();
  return reminder;
};

// ------------------------------------------------------------------
// Part 7 — Automatic Reminder Generation from AI-Extracted Document Dates
// ------------------------------------------------------------------

const humanize = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();

/**
 * Decide, from a document's AI-extracted data, whether an automatic
 * reminder should be created — and if so, what its title/priority should
 * be. Returns null when there is nothing actionable to remind the user
 * about (e.g. only purchaseDate/seller/amount were extracted).
 *
 * Business rule: purchaseDate/invoiceDate/createdDate-type fields are
 * NEVER actionable. Only aiData.dueDate (generic bill/renewal/insurance
 * due date) or aiData.warrantyExpiryDate qualify.
 */
const buildReminderPlan = (document) => {
  const aiData = document.aiData || {};

  if (aiData.dueDate) {
    const type = humanize(aiData.documentType);
    let verb = 'Action required for';
    if (/bill|invoice|payment|subscription|due|electricity|utility|rent/.test(type)) {
      verb = 'Pay';
    } else if (/insurance|policy|renewal|membership|registration/.test(type)) {
      verb = 'Renew';
    }

    const subject = type || document.title || 'document';

    return {
      title: `${verb} ${subject}`.slice(0, 150),
      description: aiData.summary || `Auto-generated from ${document.fileName || document.title}.`,
      dueDate: aiData.dueDate,
      priority: 'High',
      // Carries the bill amount through so it displays on the reminder
      // and pre-fills the "I Have Paid This Bill" confirmation dialog
      // (see billPaymentService.markBillAsPaid).
      amount: aiData.amount != null ? aiData.amount : null,
    };
  }

  if (aiData.warrantyExpiryDate) {
    const subject =
      [aiData.brand, aiData.model].filter(Boolean).join(' ') ||
      aiData.productName ||
      document.title;

    return {
      title: `Warranty expires — ${subject}`.slice(0, 150),
      description: aiData.summary || `Auto-generated from ${document.fileName || document.title}.`,
      dueDate: aiData.warrantyExpiryDate,
      priority: 'Medium',
      amount: null,
    };
  }

  return null;
};

/**
 * Automatically create a Reminder from a just-analyzed Document, if (and
 * only if) its AI-extracted data contains an actionable date. Idempotent:
 * calling this again for the same document (e.g. re-analysis) will NOT
 * create a duplicate reminder.
 *
 * Ownership is enforced by the caller (documentAIService.analyzeDocument
 * only ever loads documents scoped to req.user._id), and re-verified here
 * so this function is never trusted to run against the wrong user.
 *
 * @param {string} userId
 * @param {import('../models/Document.js').default} document
 * @returns {Promise<import('../models/Reminder.js').default|null>}
 */
export const createReminderFromDocument = async (userId, document) => {
  if (!document || String(document.user) !== String(userId)) {
    const error = new Error('Document does not belong to this user');
    error.statusCode = 403;
    throw error;
  }

  const plan = buildReminderPlan(document);
  if (!plan) {
    return null; // No actionable date extracted — nothing to remind about.
  }

  // Idempotency check: a document can only ever back one auto-reminder.
  const existing = await Reminder.findOne({ document: document._id, source: 'document' });
  if (existing) {
    return existing;
  }

  try {
    return await Reminder.create({
      user: userId,
      title: plan.title,
      description: plan.description,
      dueDate: plan.dueDate,
      priority: plan.priority,
      amount: plan.amount != null ? plan.amount : null,
      isCompleted: false,
      source: 'document',
      document: document._id,
    });
  } catch (err) {
    // Race condition: two concurrent analyses of the same document both
    // passed the check above. The unique partial index rejects the second
    // insert — treat that as "already created", not a real failure.
    if (err.code === 11000) {
      return await Reminder.findOne({ document: document._id, source: 'document' });
    }
    throw err;
  }
};
