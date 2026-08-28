import mongoose from 'mongoose';
import Document, { DOCUMENT_CATEGORIES } from '../models/Document.js';
import Asset from '../models/Asset.js';
import Expense from '../models/Expense.js';
import Reminder from '../models/Reminder.js';

const EXPIRING_SOON_DAYS = 30;

export const getVaultSummary = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const expiringThreshold = new Date();
  expiringThreshold.setDate(expiringThreshold.getDate() + EXPIRING_SOON_DAYS);

  const [categoryCounts, totals, expiringSoon, totalAssets, totalExpenses, totalReminders] = await Promise.all([
    Document.aggregate([
      { $match: { user: userObjectId, isArchived: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    Document.aggregate([
      { $match: { user: userObjectId, isArchived: false } },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          totalStorage: { $sum: '$fileSize' },
        },
      },
    ]),
    Document.find({
      user: userObjectId,
      isArchived: false,
      expiryDate: { $gte: now, $lte: expiringThreshold },
      // A bill-type document's expiryDate is often auto-filled from its
      // AI-extracted due date purely to surface it here — once paid via
      // the "I Have Paid This Bill" flow, it's no longer "expiring" in
      // any meaningful sense. paymentStatus is only ever 'paid' for
      // bill-type documents, so this never affects non-bill expiry
      // tracking (ID cards, warranties, etc).
      paymentStatus: { $ne: 'paid' },
    })
      .sort({ expiryDate: 1 })
      .limit(5),
    Asset.countDocuments({ user: userObjectId }),
    Expense.countDocuments({ user: userObjectId }),
    Reminder.countDocuments({ user: userObjectId, isCompleted: false }),
  ]);

  const countsByCategory = DOCUMENT_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {});

  categoryCounts.forEach(({ _id, count }) => {
    countsByCategory[_id] = count;
  });

  const summary = totals[0] || { totalDocuments: 0, totalStorage: 0 };

  return {
    totalDocuments: summary.totalDocuments,
    totalStorage: summary.totalStorage,
    countsByCategory,
    expiringSoon,
    expiringSoonDays: EXPIRING_SOON_DAYS,
    totalAssets,
    totalExpenses,
    totalReminders,
  };
};

export const getVaultTimeline = async (userId) => {
  const [documents, assets, expenses, reminders] = await Promise.all([
    Document.find({ user: userId, isArchived: false }).lean(),
    Asset.find({ user: userId }).lean(),
    Expense.find({ user: userId }).lean(),
    Reminder.find({ user: userId }).lean(),
  ]);

  const timelineEvents = [];

  // Add documents
  documents.forEach((doc) => {
    timelineEvents.push({
      id: `doc-${doc._id}`,
      title: `Uploaded Document: ${doc.title}`,
      subtitle: doc.description || `Category: ${doc.category}`,
      date: doc.createdAt,
      type: 'document',
      category: doc.category,
      amount: doc.aiData?.amount || null,
    });

    if (doc.expiryDate) {
      timelineEvents.push({
        id: `doc-expiry-${doc._id}`,
        title: `Document Expiration: ${doc.title}`,
        subtitle: `Expiry Date Alert`,
        date: doc.expiryDate,
        type: 'expiry',
        category: doc.category,
      });
    }
  });

  // Add assets
  assets.forEach((asset) => {
    if (asset.purchaseDate) {
      timelineEvents.push({
        id: `asset-purchase-${asset._id}`,
        title: `Purchased Asset: ${asset.name}`,
        subtitle: `${asset.brand || ''} ${asset.model || ''} - ${asset.notes || ''}`.trim(),
        date: asset.purchaseDate,
        type: 'asset',
        category: asset.category,
        amount: asset.purchasePrice,
      });
    }

    if (asset.warrantyExpiry) {
      timelineEvents.push({
        id: `asset-warranty-${asset._id}`,
        title: `Warranty Expiry: ${asset.name}`,
        subtitle: `Warranty Coverage End`,
        date: asset.warrantyExpiry,
        type: 'warranty',
        category: asset.category,
      });
    }
  });

  // Add expenses
  expenses.forEach((exp) => {
    timelineEvents.push({
      id: `exp-${exp._id}`,
      title: `Expense: ${exp.description}`,
      subtitle: `Paid via ${exp.paymentMethod}`,
      date: exp.date,
      type: 'expense',
      category: exp.category,
      amount: exp.amount,
    });
  });

  // Add reminders
  reminders.forEach((rem) => {
    let status = rem.isCompleted ? 'Completed' : 'Pending';
    timelineEvents.push({
      id: `rem-${rem._id}`,
      title: `Reminder: ${rem.title}`,
      subtitle: `${status} - ${rem.description || ''}`.trim(),
      date: rem.dueDate,
      type: 'reminder',
      category: rem.priority,
    });
  });

  // Sort chronologically descending (newest events first)
  timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

  return timelineEvents;
};
