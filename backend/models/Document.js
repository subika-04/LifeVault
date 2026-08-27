import mongoose from 'mongoose';

export const DOCUMENT_CATEGORIES = [
  'identity',
  'financial',
  'medical',
  'legal',
  'insurance',
  'education',
  'other',
];

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      enum: {
        values: DOCUMENT_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: 0,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    // ---- Bill payment workflow (Part 9) ----
    // Only meaningful for bill-type documents (ones with aiData.dueDate,
    // which is what generates a reminder in the first place) — irrelevant
    // documents (IDs, certificates, etc.) simply stay 'due' forever,
    // unused. Set to 'paid' exclusively by the explicit
    // "I Have Paid This Bill" confirmation flow — see
    // billPaymentService.markBillAsPaid. Never set implicitly.
    paymentStatus: {
      type: String,
      enum: ['due', 'paid'],
      default: 'due',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },

    // ---- AI-generated metadata (Part 2) ----
    aiStatus: {
      type: String,
      enum: ['not_analyzed', 'analyzing', 'analyzed', 'failed'],
      default: 'not_analyzed',
    },
    aiAnalyzedAt: {
      type: Date,
      default: null,
    },
    aiError: {
      type: String,
      default: null,
    },
    aiData: {
      documentType: { type: String, default: null },
      productName: { type: String, default: null },
      brand: { type: String, default: null },
      model: { type: String, default: null },
      purchaseDate: { type: Date, default: null },
      amount: { type: Number, default: null },
      currency: { type: String, default: 'INR' },
      seller: { type: String, default: null },
      warrantyPeriodMonths: { type: Number, default: null },
      warrantyExpiryDate: { type: Date, default: null },
      // Generic ACTIONABLE date (bill/payment due date, subscription or
      // policy renewal, insurance expiry, etc). Deliberately distinct from
      // purchaseDate (a record of the past, never actionable). Used to
      // auto-generate a Reminder — see reminderService.createReminderFromDocument.
      dueDate: { type: Date, default: null },
      serialNumber: { type: String, default: null },
      aiCategory: { type: String, default: null },
      summary: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ user: 1, category: 1 });
documentSchema.index({ user: 1, aiStatus: 1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
