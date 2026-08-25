/**
 * documentAIService.js
 * ------------------------------------------------------------------
 * Part 2B/2C/2D — AI Document Analysis & Structured Extraction.
 *
 * Flow:
 *   Upload document -> Backend receives file -> Validate file
 *   -> Send document to Gemini -> Gemini analyzes document
 *   -> Gemini returns structured JSON -> Validate AI response
 *   -> Save extracted information -> Update MongoDB document
 *   -> Return result to frontend
 *
 * This file owns document-specific prompting/validation logic and
 * delegates the actual model call to geminiService. Controllers
 * should never call geminiService directly for document analysis.
 * ------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { getSignedDownloadUrl } from '../config/cloudinary.js';
import { generateJSON } from './geminiService.js';
import Document from '../models/Document.js';
import { createReminderFromDocument } from './reminderService.js';

const downloadFileBuffer = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch file from Cloudinary: Status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', (err) => reject(err));
    }).on('error', (err) => reject(err));
  });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Only these mime types can be sent to Gemini's multimodal input.
const ANALYZABLE_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const EXTRACTION_SCHEMA_HINT = `{
  "documentType": "string, e.g. invoice, receipt, bill, warranty, insurance, vehicle_document, product_document, other",
  "title": "string, a short human-readable title for this document",
  "productName": "string or null",
  "brand": "string or null",
  "model": "string or null",
  "purchaseDate": "string in YYYY-MM-DD format or null",
  "amount": "number or null (numeric value only, no currency symbol)",
  "currency": "string, ISO currency code, default INR if not stated",
  "seller": "string or null",
  "warrantyPeriodMonths": "number or null",
  "warrantyExpiryDate": "string in YYYY-MM-DD format or null",
  "dueDate": "string in YYYY-MM-DD format or null - see rule 6 below",
  "serialNumber": "string or null",
  "category": "string or null, one of: identity, financial, medical, legal, insurance, education, other",
  "summary": "string, 1-2 sentence plain-language summary of the document"
}`;

const buildPrompt = () => `
You are LifeVault's document analysis engine. You will be shown a single uploaded
document (invoice, receipt, bill, warranty, insurance document, vehicle document,
or similar personal document).

Extract information STRICTLY from what is visible in the document. Follow these
rules exactly:
1. Return ONLY a single JSON object matching the schema below. No markdown, no commentary.
2. If a field is not present in the document, its value MUST be null. Do NOT guess or invent values.
3. Never fabricate amounts, dates, names, or serial numbers that are not visibly present.
4. "amount" must be a plain number (e.g. 1499.00), not a formatted currency string.
5. Dates must be formatted as YYYY-MM-DD, or null if unknown/unclear.
6. "dueDate" is the single ACTIONABLE date the user must act on in the future -
   e.g. a bill/payment due date, a subscription or policy renewal date, an
   insurance expiry date, or a membership/registration expiry date. It is
   NEVER the purchase date, invoice date, issue date, or any other date that
   only records something that already happened. If the document has no such
   actionable date, "dueDate" MUST be null.

JSON schema to follow:
${EXTRACTION_SCHEMA_HINT}
`;

const isValidDateString = (value) => {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

/**
 * Validate and coerce the raw JSON returned by Gemini into a safe,
 * typed shape before it is ever persisted to MongoDB. Anything that
 * doesn't look right becomes null rather than being trusted blindly.
 */
const validateExtraction = (raw) => {
  if (!raw || typeof raw !== 'object') {
    const error = new Error('AI response was not a valid object.');
    error.statusCode = 502;
    throw error;
  }

  const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const date = (v) => (isValidDateString(v) ? new Date(v) : null);

  return {
    documentType: str(raw.documentType) || 'other',
    title: str(raw.title),
    productName: str(raw.productName),
    brand: str(raw.brand),
    model: str(raw.model),
    purchaseDate: date(raw.purchaseDate),
    amount: num(raw.amount),
    currency: str(raw.currency) || 'INR',
    seller: str(raw.seller),
    warrantyPeriodMonths: num(raw.warrantyPeriodMonths),
    warrantyExpiryDate: date(raw.warrantyExpiryDate),
    dueDate: date(raw.dueDate),
    serialNumber: str(raw.serialNumber),
    aiCategory: str(raw.category),
    summary: str(raw.summary) || '',
  };
};

/**
 * Analyze a single Document by id (scoped to its owning user), call
 * Gemini, validate the response, and persist the extracted fields.
 *
 * @param {string} userId
 * @param {string} documentId
 * @returns {Promise<import('../models/Document.js').default>}
 */
export const analyzeDocument = async (userId, documentId) => {
  const document = await Document.findOne({ _id: documentId, user: userId });

  if (!document) {
    const error = new Error('Document not found');
    error.statusCode = 404;
    throw error;
  }

  if (!ANALYZABLE_MIME_TYPES.includes(document.mimeType)) {
    const error = new Error(
      'AI analysis currently supports PDF and image files only (this document is a different file type).'
    );
    error.statusCode = 400;
    throw error;
  }

  document.aiStatus = 'analyzing';
  document.aiError = null;
  await document.save();

  try {
    let buffer;
    if (document.cloudinaryPublicId) {
      try {
        const isImage = document.mimeType.startsWith('image/');
        let downloadUrl = document.fileUrl;
        
        if (!isImage) {
          const format = document.fileName ? document.fileName.split('.').pop() : 'pdf';
          // Use authenticated private_download_url for raw files (PDF/DOC/DOCX)
          // to bypass "Restricted raw files" rules in Cloudinary settings.
          downloadUrl = getSignedDownloadUrl(document.cloudinaryPublicId, format);
        }
        
        buffer = await downloadFileBuffer(downloadUrl);
      } catch (err) {
        const error = new Error(`Failed to retrieve file from Cloudinary for analysis: ${err.message}`);
        error.statusCode = 502;
        throw error;
      }
    } else {
      const filename = path.basename(document.fileUrl);
      const filePath = path.join(uploadsDir, filename);

      if (!fs.existsSync(filePath)) {
        const error = new Error('Original file could not be found on the server.');
        error.statusCode = 404;
        throw error;
      }
      buffer = fs.readFileSync(filePath);
    }

    const raw = await generateJSON(buildPrompt(), {
      buffer,
      mimeType: document.mimeType,
    });
    const extracted = validateExtraction(raw);

    document.aiData = extracted;
    document.aiStatus = 'analyzed';
    document.aiAnalyzedAt = new Date();
    document.aiError = null;

    // Only fill in title/expiryDate/category if the user hasn't already
    // set something meaningful — AI enriches, it doesn't overwrite.
    if (extracted.title && (!document.title || document.title === 'Untitled')) {
      document.title = extracted.title;
    }
    // The generic actionable "dueDate" (bill/renewal/insurance) takes
    // precedence over "warrantyExpiryDate" when both are somehow present,
    // since it's the nearer-term, more urgent actionable date.
    if (!document.expiryDate) {
      document.expiryDate = extracted.dueDate || extracted.warrantyExpiryDate || null;
    }

    await document.save();

    // Part 7 — Automatic Reminder Generation. This must never take down
    // document analysis itself: a reminder-creation failure is logged and
    // swallowed so the user still gets their successfully analyzed document.
    try {
      await createReminderFromDocument(userId, document);
    } catch (reminderErr) {
      console.error(
        `[documentAIService] Failed to auto-generate reminder for document ${document._id}:`,
        reminderErr.message
      );
    }

    return document;
  } catch (err) {
    document.aiStatus = 'failed';
    document.aiError = err.message;
    await document.save();
    throw err;
  }
};
