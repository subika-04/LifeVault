import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../services/documentService.js';
import { analyzeDocument } from '../services/documentAIService.js';
import { DOCUMENT_CATEGORIES } from '../models/Document.js';
import { markDocumentBillAsPaid, BillPaymentError } from '../services/billPaymentService.js';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../models/Expense.js';

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  return String(tags)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
};

export const listDocuments = async (req, res, next) => {
  try {
    const { category, search, page, limit } = req.query;
    const result = await getDocuments(req.user._id, { category, search, page, limit });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocument = async (req, res, next) => {
  try {
    const document = await getDocumentById(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      data: { document },
    });
  } catch (error) {
    next(error);
  }
};

export const createDocumentHandler = async (req, res, next) => {
  try {
    const { title, category, description, expiryDate, tags, renewsDocumentId } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and category',
      });
    }

    if (!DOCUMENT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    // Renewal: verify the old document belongs to this user before
    // linking anything — never trust a client-supplied id blindly.
    let renewedDocument = null;
    if (renewsDocumentId) {
      try {
        renewedDocument = await getDocumentById(req.user._id, renewsDocumentId);
      } catch {
        return res.status(404).json({
          success: false,
          message: 'The document you are renewing could not be found.',
        });
      }
    }

    const document = await createDocument(
      req.user._id,
      {
        title,
        category,
        description,
        expiryDate: expiryDate || null,
        tags: parseTags(tags),
        renewedFrom: renewedDocument ? renewedDocument._id : null,
      },
      req.file
    );

    if (renewedDocument) {
      renewedDocument.isArchived = true;
      renewedDocument.supersededBy = document._id;
      await renewedDocument.save();
    }

    res.status(201).json({
      success: true,
      data: { document, renewedDocument: renewedDocument || null },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDocumentHandler = async (req, res, next) => {
  try {
    const { title, category, description, expiryDate, tags, isArchived } = req.body;

    if (category && !DOCUMENT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    const document = await updateDocument(req.user._id, req.params.id, {
      title,
      category,
      description,
      expiryDate,
      tags: tags !== undefined ? parseTags(tags) : undefined,
      isArchived,
    });

    res.status(200).json({
      success: true,
      data: { document },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocumentHandler = async (req, res, next) => {
  try {
    await deleteDocument(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Part 9.3 — POST /api/documents/:id/mark-paid
// Same "I Have Paid This Bill" workflow as the Reminder-based one, but
// entered from the Document side — used by the Dashboard's "Needs Your
// Attention" card, whose document-expiry-based bill alerts reference the
// Document directly and may not have (or may no longer have) an active
// Reminder alongside them.
export const markDocumentPaidHandler = async (req, res, next) => {
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

    const result = await markDocumentBillAsPaid(req.user._id, req.params.id, {
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

// Part 2B — POST /api/documents/:id/analyze
// Sends the document to Gemini, extracts structured info, persists it.
export const analyzeDocumentHandler = async (req, res, next) => {
  try {
    const document = await analyzeDocument(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      data: { document },
    });
  } catch (error) {
    next(error);
  }
};
