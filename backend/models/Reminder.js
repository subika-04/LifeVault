import mongoose from 'mongoose';

export const PRIORITIES = ['High', 'Medium', 'Low'];

// Where a reminder came from. 'manual' = user-created (existing behavior,
// default so old reminders and the existing create/update flows are
// unaffected). 'document' = automatically generated from AI-extracted
// document data (Part 7 — Automatic Reminder Generation).
export const REMINDER_SOURCES = ['manual', 'document'];

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Reminder title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITIES,
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    // ---- Automatic reminder generation (Part 7) ----
    source: {
      type: String,
      enum: {
        values: REMINDER_SOURCES,
        message: '{VALUE} is not a valid reminder source',
      },
      default: 'manual',
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to calculate status dynamically from dueDate and isCompleted
reminderSchema.virtual('status').get(function () {
  if (this.isCompleted) {
    return 'Completed';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(this.dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'Overdue';
  } else if (diffDays === 0) {
    return 'Due Today';
  } else if (diffDays <= 3) {
    return 'Due Soon';
  } else {
    return 'Upcoming';
  }
});

reminderSchema.index({ user: 1, dueDate: 1 });

// Duplicate-prevention: a document can only ever back ONE auto-generated
// reminder. Partial index (only applies when source is 'document') so it
// never restricts manual reminders, which always have document: null.
reminderSchema.index(
  { document: 1 },
  { unique: true, partialFilterExpression: { source: 'document' } }
);

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder;
