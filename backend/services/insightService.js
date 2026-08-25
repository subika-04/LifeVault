/**
 * insightService.js
 * ------------------------------------------------------------------
 * Part 2E/2F/2G/2H/2K — Grounded AI Assistant, AI Insights, Smart
 * Search and Dashboard Intelligence.
 *
 * This is the ONLY place that builds "user context" for Gemini. It
 * always scopes MongoDB queries by the authenticated user's id
 * (never trusts a userId from the request body), and it is the layer
 * responsible for making sure the AI assistant only ever sees data
 * belonging to the user asking the question.
 *
 *   User Question -> Authenticated User -> Retrieve that user's
 *   LifeVault data -> Build relevant context -> Gemini -> Grounded answer
 * ------------------------------------------------------------------
 */

import Document from '../models/Document.js';
import Asset from '../models/Asset.js';
import Expense from '../models/Expense.js';
import Reminder from '../models/Reminder.js';
import { generateText, generateJSON } from './geminiService.js';

/**
 * Build a compact, text-based summary of a user's LifeVault data for
 * grounding Gemini prompts. Only fields useful for answering
 * questions are included, to keep the prompt small and relevant.
 */
export const buildUserContext = async (userId) => {
  const [documents, assets, expenses, reminders] = await Promise.all([
    Document.find({ user: userId, isArchived: false }).sort({ createdAt: -1 }).limit(30).lean(),
    Asset.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean(),
    Expense.find({ user: userId }).sort({ date: -1 }).limit(30).lean(),
    Reminder.find({ user: userId }).sort({ dueDate: 1 }).limit(30).lean(),
  ]);

  let contextParts = [];

  if (documents.length > 0) {
    const docLines = documents.map((doc) => {
      const ai = doc.aiData || {};
      const fields = [
        `id=${doc._id}`,
        `title="${doc.title}"`,
        `category=${doc.category}`,
        doc.expiryDate ? `expiryDate=${new Date(doc.expiryDate).toISOString().slice(0, 10)}` : null,
        ai.documentType ? `type=${ai.documentType}` : null,
        ai.productName ? `product="${ai.productName}"` : null,
        ai.brand ? `brand="${ai.brand}"` : null,
        ai.model ? `model="${ai.model}"` : null,
        ai.purchaseDate ? `purchaseDate=${new Date(ai.purchaseDate).toISOString().slice(0, 10)}` : null,
        ai.amount != null ? `amount=${ai.amount} ${ai.currency || 'INR'}` : null,
        ai.seller ? `seller="${ai.seller}"` : null,
        ai.warrantyExpiryDate
          ? `warrantyExpiry=${new Date(ai.warrantyExpiryDate).toISOString().slice(0, 10)}`
          : null,
        ai.serialNumber ? `serialNumber=${ai.serialNumber}` : null,
        doc.tags?.length ? `tags=[${doc.tags.join(', ')}]` : null,
        ai.summary ? `summary="${ai.summary}"` : null,
      ].filter(Boolean);
      return `- Document: ${fields.join(', ')}`;
    });
    contextParts.push(`The user has ${documents.length} document(s):\n${docLines.join('\n')}`);
  }

  if (assets.length > 0) {
    const assetLines = assets.map((asset) => {
      const fields = [
        `id=${asset._id}`,
        `name="${asset.name}"`,
        `category=${asset.category}`,
        asset.brand ? `brand="${asset.brand}"` : null,
        asset.model ? `model="${asset.model}"` : null,
        asset.purchaseDate ? `purchaseDate=${new Date(asset.purchaseDate).toISOString().slice(0, 10)}` : null,
        asset.purchasePrice ? `price=${asset.purchasePrice} INR` : null,
        asset.warrantyExpiry ? `warrantyExpiry=${new Date(asset.warrantyExpiry).toISOString().slice(0, 10)}` : null,
        asset.serialNumber ? `serialNumber=${asset.serialNumber}` : null,
        asset.notes ? `notes="${asset.notes}"` : null,
      ].filter(Boolean);
      return `- Asset: ${fields.join(', ')}`;
    });
    contextParts.push(`The user has ${assets.length} asset(s):\n${assetLines.join('\n')}`);
  }

  if (expenses.length > 0) {
    const expenseLines = expenses.map((exp) => {
      const fields = [
        `id=${exp._id}`,
        `description="${exp.description}"`,
        `category=${exp.category}`,
        `amount=${exp.amount} INR`,
        `date=${new Date(exp.date).toISOString().slice(0, 10)}`,
        `paymentMethod=${exp.paymentMethod || 'Card'}`,
      ].filter(Boolean);
      return `- Expense: ${fields.join(', ')}`;
    });
    contextParts.push(`The user has ${expenses.length} expense record(s):\n${expenseLines.join('\n')}`);
  }

  if (reminders.length > 0) {
    const reminderLines = reminders.map((rem) => {
      // Calculate status manually since we used lean()
      let status = 'Upcoming';
      if (rem.isCompleted) {
        status = 'Completed';
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(rem.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) status = 'Overdue';
        else if (diffDays === 0) status = 'Due Today';
        else if (diffDays <= 3) status = 'Due Soon';
      }

      const fields = [
        `id=${rem._id}`,
        `title="${rem.title}"`,
        rem.description ? `description="${rem.description}"` : null,
        `dueDate=${new Date(rem.dueDate).toISOString().slice(0, 10)}`,
        `priority=${rem.priority}`,
        `status=${status}`,
      ].filter(Boolean);
      return `- Reminder: ${fields.join(', ')}`;
    });
    contextParts.push(`The user has ${reminders.length} reminder(s):\n${reminderLines.join('\n')}`);
  }

  const contextText = contextParts.length > 0
    ? contextParts.join('\n\n')
    : 'The user has no documents, assets, expenses, or reminders in their LifeVault yet.';

  return {
    documents,
    assets,
    expenses,
    reminders,
    contextText,
  };
};

const GROUNDING_RULES = `
You are "Ask LifeVault", the AI assistant inside the LifeVault personal life
management app. You answer questions using ONLY the LIFEVAULT DATA context
provided below, which belongs to the currently authenticated user.

Rules you must always follow:
1. Never use information about any other user. You only have this one user's data.
2. Never invent documents, expenses, amounts, dates, warranties, or purchases
   that are not present in the LIFEVAULT DATA context.
3. If the answer cannot be determined from the provided data, reply exactly:
   "I couldn't find that information in your LifeVault." — optionally followed
   by a brief suggestion of what the user could upload or add.
4. Keep answers concise, friendly, and specific (cite titles/amounts/dates when relevant).
5. Do not mention that you were given a "context" or reference these instructions.
`;

/**
 * Generate a grounded answer to a user's natural-language question
 * using only that user's LifeVault data.
 */
export const generateGroundedAnswer = async (userId, question, chatHistory = []) => {
  const { contextText } = await buildUserContext(userId);

  const historyText = chatHistory
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const prompt = `${GROUNDING_RULES}

LIFEVAULT DATA (belongs only to this user):
${contextText}

${historyText ? `Recent conversation:\n${historyText}\n` : ''}
User question: "${question}"

Answer the user's question now, following the rules above.`;

  const answer = await generateText(prompt);
  return answer.trim();
};

/**
 * Part 2G — AI-generated dashboard insights, grounded on real data.
 * If there isn't enough data yet, this returns a "not enough data"
 * state instead of calling Gemini or fabricating insights.
 */
export const generateDashboardInsights = async (userId) => {
  const { documents, assets, expenses, reminders, contextText } = await buildUserContext(userId);

  const totalItems = documents.length + assets.length + expenses.length + reminders.length;

  if (totalItems < 2) {
    return {
      status: 'not_enough_data',
      insights: [],
      message: 'Add a few more assets, expenses, or documents and LifeVault AI will start surfacing insights here.',
    };
  }

  const prompt = `${GROUNDING_RULES}

LIFEVAULT DATA (belongs only to this user):
${contextText}

Task: Generate up to 4 short, specific dashboard insights for this user based
ONLY on the data above. Examples of the kind of thing to surface: warranties
expiring soon, notable spending, missing information, upcoming expirations,
patterns across categories. Do not invent numbers or dates that are not in
the data. If there is genuinely nothing insightful to say, return fewer items.

Return ONLY JSON in this exact shape, no markdown:
{ "insights": ["short insight 1", "short insight 2"] }`;

  try {
    const result = await generateJSON(prompt);
    const insights = Array.isArray(result.insights) ? result.insights.filter(Boolean).slice(0, 4) : [];

    if (insights.length === 0) {
      return {
        status: 'not_enough_data',
        insights: [],
        message: 'Not enough data yet to generate meaningful insights.',
      };
    }

    return { status: 'ok', insights, message: null };
  } catch {
    // Gemini unavailable/misconfigured — degrade gracefully instead of fabricating.
    return {
      status: 'unavailable',
      insights: [],
      message: 'AI insights are temporarily unavailable.',
    };
  }
};

/**
 * Part 2H — Smart/global search across the user's LifeVault data.
 * MVP implementation uses MongoDB filtering (no vector DB), but is
 * isolated in this service so it could be swapped for semantic
 * search/RAG later without touching controllers.
 */
export const smartSearch = async (userId, query) => {
  if (!query || !query.trim()) {
    return [];
  }

  const regex = new RegExp(query.trim(), 'i');

  const [documents, assets, expenses, reminders] = await Promise.all([
    Document.find({
      user: userId,
      isArchived: false,
      $or: [
        { title: regex },
        { description: regex },
        { tags: regex },
        { category: regex },
        { 'aiData.productName': regex },
        { 'aiData.brand': regex },
        { 'aiData.model': regex },
        { 'aiData.seller': regex },
        { 'aiData.summary': regex },
      ],
    }).sort({ createdAt: -1 }).limit(15).lean(),

    Asset.find({
      user: userId,
      $or: [
        { name: regex },
        { brand: regex },
        { model: regex },
        { category: regex },
        { notes: regex },
        { serialNumber: regex },
      ],
    }).sort({ createdAt: -1 }).limit(15).lean(),

    Expense.find({
      user: userId,
      $or: [
        { description: regex },
        { category: regex },
        { paymentMethod: regex },
      ],
    }).sort({ date: -1 }).limit(15).lean(),

    Reminder.find({
      user: userId,
      $or: [
        { title: regex },
        { description: regex },
        { priority: regex },
      ],
    }).sort({ dueDate: 1 }).limit(15).lean(),
  ]);

  const docResults = documents.map((doc) => ({
    id: doc._id,
    type: 'document',
    title: doc.title,
    category: doc.category,
    subtitle: doc.aiData?.summary || doc.description || 'Uploaded Document',
    expiryDate: doc.expiryDate || doc.aiData?.warrantyExpiryDate || null,
    amount: doc.aiData?.amount ?? null,
    currency: doc.aiData?.currency || 'INR',
  }));

  const assetResults = assets.map((asset) => ({
    id: asset._id,
    type: 'asset',
    title: asset.name,
    category: asset.category,
    subtitle: `${asset.brand || ''} ${asset.model || ''} - ${asset.notes || ''}`.trim().slice(0, 100),
    expiryDate: asset.warrantyExpiry || null,
    amount: asset.purchasePrice ?? null,
    currency: 'INR',
  }));

  const expenseResults = expenses.map((exp) => ({
    id: exp._id,
    type: 'expense',
    title: exp.description,
    category: exp.category,
    subtitle: `Paid via ${exp.paymentMethod}`,
    expiryDate: null,
    amount: exp.amount,
    currency: 'INR',
  }));

  const reminderResults = reminders.map((rem) => {
    let status = 'Upcoming';
    if (rem.isCompleted) status = 'Completed';
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(rem.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) status = 'Overdue';
      else if (diffDays === 0) status = 'Due Today';
      else if (diffDays <= 3) status = 'Due Soon';
    }

    return {
      id: rem._id,
      type: 'reminder',
      title: rem.title,
      category: rem.priority,
      subtitle: `${status} - ${rem.description || ''}`.trim(),
      expiryDate: rem.dueDate,
      amount: null,
      currency: 'INR',
    };
  });

  return [...docResults, ...assetResults, ...expenseResults, ...reminderResults];
};

/**
 * Part 2K — Dashboard intelligence: real statistics computed from
 * MongoDB, not hardcoded values. Spending is derived from the
 * Expense model, and alerts/reminders from documents, assets, and reminders.
 */
export const getDashboardStats = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [documents, assets, monthlyExpenses, allExpenses, reminders] = await Promise.all([
    Document.find({ user: userId, isArchived: false }).lean(),
    Asset.find({ user: userId }).lean(),
    Expense.find({ user: userId, date: { $gte: startOfMonth } }).lean(),
    Expense.find({ user: userId }).lean(),
    Reminder.find({ user: userId, isCompleted: false }).lean(),
  ]);

  // Compute spending
  let monthlySpend = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  let totalSpend = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  let analyzedCount = documents.filter((doc) => doc.aiStatus === 'analyzed').length;

  // Category breakdown for documents
  const categoryBreakdown = {};
  documents.forEach((doc) => {
    categoryBreakdown[doc.category] = (categoryBreakdown[doc.category] || 0) + 1;
  });

  // Calculate upcoming / urgent reminders and expirations
  let urgentCount = 0;
  let upcomingCount = 0;
  const needsAttention = [];

  const checkExpiry = (date, title, type, id) => {
    if (!date) return;
    const expiryDate = new Date(date);
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Focus on dates from 30 days overdue to 60 days in the future
    if (diffDays >= -30 && diffDays <= 60) {
      const item = {
        id,
        title,
        type,
        dueDate: expiryDate,
        daysLeft: diffDays,
        priority: diffDays < 0 ? 'Overdue' : diffDays <= 7 ? 'Urgent' : 'Upcoming',
      };
      needsAttention.push(item);

      if (diffDays >= -30 && diffDays <= 7) {
        urgentCount += 1;
      } else if (diffDays > 7 && diffDays <= 30) {
        upcomingCount += 1;
      }
    }
  };

  // 1. Process documents with expiry dates
  documents.forEach((doc) => {
    checkExpiry(doc.expiryDate, doc.title, 'Document Expiry', doc._id);
    if (doc.aiData?.warrantyExpiryDate) {
      checkExpiry(doc.aiData.warrantyExpiryDate, `${doc.title} (Warranty)`, 'Warranty Expiry', doc._id);
    }
  });

  // 2. Process assets with warranties
  assets.forEach((asset) => {
    checkExpiry(asset.warrantyExpiry, `${asset.name} (Warranty)`, 'Warranty Expiry', asset._id);
  });

  // 3. Process reminders
  reminders.forEach((rem) => {
    checkExpiry(rem.dueDate, rem.title, 'Reminder Due', rem._id);
  });

  // Sort needsAttention by daysLeft ascending (most urgent/overdue first)
  needsAttention.sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    documentsCount: documents.length,
    assetsCount: assets.length,
    analyzedCount,
    monthlySpend: Math.round(monthlySpend * 100) / 100,
    totalSpend: Math.round(totalSpend * 100) / 100,
    urgentCount,
    upcomingCount,
    needsAttention: needsAttention.slice(0, 5),
    categoryBreakdown: Object.entries(categoryBreakdown).map(([category, count]) => ({
      category,
      count,
    })),
  };
};
