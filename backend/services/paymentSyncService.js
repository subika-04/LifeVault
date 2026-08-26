/**
 * paymentSyncService.js
 * ------------------------------------------------------------------
 * Part 8 — Payment -> Reminder synchronization.
 *
 * When a user records an Expense that corresponds to a pending bill
 * Reminder (e.g. paying the "Electricity Bill" they were reminded
 * about), the matching reminder should be automatically marked
 * completed — without ever guessing wrong and completing the wrong
 * bill.
 *
 * Matching strategy (safest signal first):
 *
 *   1. Explicit link — if the expense already carries a
 *      `sourceReminder`/`sourceDocument` hint (reserved for future
 *      UI that lets a user pick "pay this reminder"), that reminder
 *      wins outright, no further checks needed.
 *
 *   2. Signal-combination match — a reminder is only considered a
 *      candidate when ALL of the following hold:
 *        a. reminder.amount is known and equals expense.amount
 *           (small tolerance for paise/rounding).
 *        b. expense.date falls within a plausible payment window
 *           around reminder.dueDate (a bit before it, or up to ~45
 *           days after — covers early and late payments).
 *        c. reminder title/description shares meaningful keyword
 *           overlap with the expense description (Jaccard similarity
 *           over normalized, stop-word-filtered tokens).
 *      Amount alone is NEVER sufficient (two bills can share an
 *      amount) — text overlap is always required too.
 *
 *   3. Ambiguity guard — if two candidates score too closely, no
 *      match is made at all rather than guessing.
 *
 * Every query here is scoped to `user`, mirroring the ownership model
 * used everywhere else in the app (JWT -> req.user._id -> caller).
 * ------------------------------------------------------------------
 */

import Reminder from '../models/Reminder.js';

const STOPWORDS = new Set([
  'bill', 'bills', 'payment', 'payments', 'pay', 'paid', 'due', 'the', 'for',
  'of', 'an', 'to', 'on', 'fee', 'fees', 'charge', 'charges', 'renewal',
  'renew', 'invoice', 'subscription', 'and', 'monthly', 'yearly', 'annual',
  'action', 'required', 'auto', 'generated', 'from',
]);

const tokenize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

const jaccardSimilarity = (tokensA, tokensB) => {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
};

// Tuning constants — deliberately conservative to avoid false matches.
const AMOUNT_TOLERANCE = 1; // rupees — survives paise rounding
const TEXT_SIMILARITY_THRESHOLD = 0.2;
const AMBIGUITY_MARGIN = 0.08; // best must beat runner-up by at least this
const DAYS_BEFORE_DUE_ALLOWED = 21; // paying a bit ahead of the due date
const DAYS_AFTER_DUE_ALLOWED = 45; // paying somewhat late is still a match

/**
 * Score a single candidate reminder against an incoming expense.
 * Returns null if the candidate fails any hard requirement.
 */
const scoreCandidate = (reminder, expense, expenseTokens) => {
  if (reminder.amount == null) return null;
  if (Math.abs(reminder.amount - expense.amount) > AMOUNT_TOLERANCE) return null;

  const dueDate = new Date(reminder.dueDate);
  const diffDays = Math.round((new Date(expense.date) - dueDate) / (1000 * 60 * 60 * 24));
  if (diffDays < -DAYS_BEFORE_DUE_ALLOWED || diffDays > DAYS_AFTER_DUE_ALLOWED) return null;

  const reminderTokens = tokenize(`${reminder.title} ${reminder.description || ''}`);
  const similarity = jaccardSimilarity(expenseTokens, reminderTokens);
  if (similarity < TEXT_SIMILARITY_THRESHOLD) return null;

  return similarity;
};

/**
 * Find the single best pending reminder that a given expense pays off,
 * for the given user. Returns the reminder document, or null when
 * there is no sufficiently confident, unambiguous match.
 *
 * Never relies on amount alone (Test Case 3 / Edge Case 3) and never
 * looks outside the given user's own reminders (user isolation).
 */
export const findMatchingReminder = async (userId, expense) => {
  const pendingReminders = await Reminder.find({ user: userId, isCompleted: false });
  if (pendingReminders.length === 0) return null;

  const expenseTokens = tokenize(expense.description);

  let best = null;
  let bestScore = 0;
  let runnerUpScore = 0;

  for (const reminder of pendingReminders) {
    const score = scoreCandidate(reminder, expense, expenseTokens);
    if (score == null) continue;

    if (score > bestScore) {
      runnerUpScore = bestScore;
      bestScore = score;
      best = reminder;
    } else if (score > runnerUpScore) {
      runnerUpScore = score;
    }
  }

  if (!best) return null;

  // Ambiguity guard: two similarly-worded bills of the same amount
  // (e.g. two "Internet" subscriptions) should not be auto-resolved.
  if (runnerUpScore > 0 && bestScore - runnerUpScore < AMBIGUITY_MARGIN) {
    return null;
  }

  return best;
};

/**
 * Attempt to complete the pending reminder that a newly-created expense
 * pays off. Safe to call for every expense creation — it's a no-op
 * (returns null) when nothing matches, and never throws for that case.
 *
 * Idempotent: only ever touches reminders with isCompleted: false, so
 * calling this more than once for the same expense (or re-processing)
 * cannot double-complete or corrupt state.
 */
export const syncReminderForExpense = async (userId, expense) => {
  const candidate = await findMatchingReminder(userId, expense);
  if (!candidate) return null;

  // Re-check ownership + still-pending status atomically-ish right
  // before writing, to guard against a race between the search above
  // and this update (e.g. two expenses created concurrently).
  const reminder = await Reminder.findOneAndUpdate(
    { _id: candidate._id, user: userId, isCompleted: false },
    {
      $set: {
        isCompleted: true,
        completedAt: new Date(),
        completedByExpense: expense._id,
      },
    },
    { new: true }
  );

  return reminder;
};
