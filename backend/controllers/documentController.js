import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../services/documentService.js';
import { analyzeDocument } from '../services/documentAIService.js';
import { DOCUMENT_CATEGORIES } from '../models/Document.js';

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
    const { title, category, description, expiryDate, tags } = req.body;

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

    const document = await createDocument(
      req.user._id,
      {
        title,
        category,
        description,
        expiryDate: expiryDate || null,
        tags: parseTags(tags),
      },
      req.file
    );

    res.status(201).json({
      success: true,
      data: { document },
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
