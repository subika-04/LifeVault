import mongoose from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Electronics',
  'Utilities',
  'Shopping',
  'Healthcare',
  'Entertainment',
  'Subscription',
  'Other',
];

export const PAYMENT_METHODS = [
  'Cash',
  'Card',
  'UPI',
  'Net Banking',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: {
      type: String,
      enum: {
        values: EXPENSE_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: PAYMENT_METHODS,
        message: '{VALUE} is not a valid payment method',
      },
      default: 'Card',
    },
    // ---- Bill payment workflow (Part 9) ----
    // Set only by the explicit "I Have Paid This Bill" confirmation flow
    // (billPaymentService.markBillAsPaid) — never inferred or guessed.
    // linkedReminder deliberately keeps a historical reference even
    // though the Reminder itself is deleted once paid (see
    // Reminder -> DELETE in the payment workflow) — it's an audit trail,
    // not a live relationship, so it's fine for it to no longer resolve.
    sourceType: {
      type: String,
      enum: ['MANUAL', 'BILL_PAYMENT'],
      default: 'MANUAL',
    },
    sourceDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    linkedReminder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ user: 1, sourceDocumentId: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
