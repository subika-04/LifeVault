/**
 * billPaymentService.js
 * ------------------------------------------------------------------
 * Part 9 — Explicit "I Have Paid This Bill" payment workflow.
 *
 * Replaces the earlier automatic expense<->reminder fuzzy matching
 * (Part 8) with a single, explicit, user-confirmed action point: a
 * reminder representing a bill is only ever resolved when the user
 * clicks "I Have Paid This Bill" and confirms. No expense creation,
 * anywhere else in the app, ever touches a reminder implicitly.
 *
 * On confirmation:
 *   1. The linked bill Document (if any) is marked paymentStatus: 'paid'.
 *   2. An Expense is created from the bill's data (amount/category/date
 *      can be confirmed or adjusted by the user in the dialog first).
 *   3. The Reminder is deleted outright — not just marked complete —
 *      so it disappears from active reminders, the dashboard, and the
 *      AI assistant's context immediately.
 *
 * All three steps happen inside a MongoDB transaction where the
 * deployment supports one (Atlas / any replica set — this app's
 * MONGO_URI is an Atlas SRV cluster, so it does). If a transaction
 * genuinely cannot be started (standalone mongod with no replica set),
 * falls back to a sequential best-effort path with the same
 * idempotency checks, documented inline.
 * ------------------------------------------------------------------
 */

import mongoose from 'mongoose';
import Reminder from '../models/Reminder.js';
import Document from '../models/Document.js';
import Expense, { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../models/Expense.js';

export class BillPaymentError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'BillPaymentError';
    this.statusCode = statusCode;
  }
}

// Ordered keyword groups — first match wins. Deliberately maps onto the
// app's EXISTING expense categories only (no new categories invented),
// per "use the application's existing category system".
const CATEGORY_RULES = [
  { category: 'Utilities', keywords: ['electric', 'power', 'current', 'water', 'gas', 'lpg', 'cylinder', 'internet', 'wifi', 'broadband', 'isp', 'phone', 'mobile', 'recharge', 'telecom', 'utility', 'utilities', 'dth', 'cable'] },
  { category: 'Subscription', keywords: ['subscription', 'netflix', 'prime', 'hotstar', 'spotify', 'ott', 'membership'] },
  { category: 'Healthcare', keywords: ['health', 'medical', 'hospital', 'pharmacy', 'clinic', 'doctor'] },
  { category: 'Electronics', keywords: ['electronics', 'laptop', 'gadget', 'appliance', 'warranty'] },
  { category: 'Transport', keywords: ['transport', 'travel', 'fuel', 'cab', 'taxi', 'flight', 'vehicle', 'insurance_vehicle', 'car'] },
  { category: 'Shopping', keywords: ['shopping', 'purchase', 'order', 'retail'] },
  { category: 'Food', keywords: ['food', 'restaurant', 'grocery', 'grocer'] },
];

/**
 * Map a bill's document type / reminder title to one of the app's
 * existing EXPENSE_CATEGORIES. Falls back to 'Other' rather than
 * inventing a category the app doesn't have (e.g. there's no
 * "Insurance" or "Housing" expense category today).
 */
export const mapToExpenseCategory = (...texts) => {
  const haystack = texts.filter(Boolean).join(' ').toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) return rule.category;
  }
  return 'Other';
};

/**
 * Look up the most recent BILL_PAYMENT expense for a document, for
 * reporting back an already-paid state without creating a duplicate.
 */
const findExistingPaymentExpense = (userId, documentId) =>
  Expense.findOne({ user: userId, sourceType: 'BILL_PAYMENT', sourceDocumentId: documentId })
    .sort({ createdAt: -1 });

/**
 * Core payment recording logic, run once inside (or, in the fallback
 * path, without) a transaction session.
 */
const performPayment = async (userId, reminder, document, overrides, session) => {
  const opts = session ? { session } : {};

  const effectiveAmount =
    overrides.amount != null && Number(overrides.amount) > 0
      ? Number(overrides.amount)
      : reminder.amount ?? document?.aiData?.amount ?? null;

  if (effectiveAmount == null) {
    throw new BillPaymentError('Please enter the bill amount to record this payment.', 400);
  }

  const category =
    overrides.category && EXPENSE_CATEGORIES.includes(overrides.category)
      ? overrides.category
      : mapToExpenseCategory(document?.aiData?.documentType, reminder.title, reminder.description);

  const paymentMethod =
    overrides.paymentMethod && PAYMENT_METHODS.includes(overrides.paymentMethod)
      ? overrides.paymentMethod
      : 'Card';

  const paymentDate = overrides.date ? new Date(overrides.date) : new Date();
  if (Number.isNaN(paymentDate.getTime())) {
    throw new BillPaymentError('Invalid payment date.', 400);
  }

  const [expense] = await Expense.create(
    [
      {
        user: userId,
        amount: effectiveAmount,
        category,
        description: reminder.title,
        date: paymentDate,
        paymentMethod,
        sourceType: 'BILL_PAYMENT',
        sourceDocumentId: document ? document._id : null,
        linkedReminder: reminder._id,
      },
    ],
    opts
  );

  if (document) {
    document.paymentStatus = 'paid';
    document.paidAt = paymentDate;
    await document.save(opts);
  }

  await Reminder.deleteOne({ _id: reminder._id, user: userId }, opts);

  return { expense, document: document || null };
};

/**
 * Mark a bill reminder as paid: create the Expense, mark the linked
 * Document paid, and delete the Reminder — atomically where the
 * deployment supports transactions.
 *
 * `overrides` — { amount, category, paymentMethod, date } — all
 * optional; these are the values the user confirmed/edited in the
 * "I Have Paid This Bill" dialog. Falls back to the reminder's/
 * document's own data where not provided.
 *
 * Idempotent: a second call for a bill whose document is already
 * 'paid' returns `{ alreadyPaid: true, expense, document }` instead of
 * creating a duplicate expense. A second call after the reminder is
 * already deleted (e.g. a near-simultaneous double click) throws a 404
 * BillPaymentError, which the controller reports as a friendly
 * "already processed" rather than an error.
 */
export const markBillAsPaid = async (userId, reminderId, overrides = {}) => {
  const reminder = await Reminder.findOne({ _id: reminderId, user: userId });
  if (!reminder) {
    throw new BillPaymentError('This reminder no longer exists — it may already be marked as paid.', 404);
  }

  let document = null;
  if (reminder.source === 'document' && reminder.document) {
    document = await Document.findOne({ _id: reminder.document, user: userId });
  }

  if (document && document.paymentStatus === 'paid') {
    const existingExpense = await findExistingPaymentExpense(userId, document._id);
    return { alreadyPaid: true, expense: existingExpense, document };
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      // Re-fetch inside the transaction to guard against a concurrent
      // request racing between the pre-check above and here.
      const lockedReminder = await Reminder.findOne({ _id: reminderId, user: userId }).session(session);
      if (!lockedReminder) {
        throw new BillPaymentError('This reminder no longer exists — it may already be marked as paid.', 404);
      }

      let lockedDocument = null;
      if (lockedReminder.source === 'document' && lockedReminder.document) {
        lockedDocument = await Document.findOne({ _id: lockedReminder.document, user: userId }).session(session);
        if (lockedDocument && lockedDocument.paymentStatus === 'paid') {
          throw new BillPaymentError('ALREADY_PAID', 200);
        }
      }

      result = await performPayment(userId, lockedReminder, lockedDocument, overrides, session);
    });
    return { alreadyPaid: false, ...result };
  } catch (err) {
    if (err instanceof BillPaymentError && err.message === 'ALREADY_PAID') {
      const existingExpense = document ? await findExistingPaymentExpense(userId, document._id) : null;
      return { alreadyPaid: true, expense: existingExpense, document };
    }

    // Transactions require a replica set. If this deployment's MongoDB
    // genuinely doesn't support them, fall back to a sequential
    // best-effort path with the same idempotency pre-checks — still
    // safe against the common cases (this app's MONGO_URI is an Atlas
    // cluster, so this branch is not expected to run in production).
    const message = String(err?.message || '');
    const transactionsUnsupported =
      err?.code === 20 || message.includes('Transaction numbers') || message.includes('replica set');

    if (!transactionsUnsupported) throw err;

    const fallbackReminder = await Reminder.findOne({ _id: reminderId, user: userId });
    if (!fallbackReminder) {
      throw new BillPaymentError('This reminder no longer exists — it may already be marked as paid.', 404);
    }
    const fallbackResult = await performPayment(userId, fallbackReminder, document, overrides, null);
    return { alreadyPaid: false, ...fallbackResult };
  } finally {
    session.endSession();
  }
};
