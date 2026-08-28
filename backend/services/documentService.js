import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Document from '../models/Document.js';
import { uploadFromBuffer, deleteFromCloudinary } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const deleteFileFromDisk = (fileUrl) => {
  if (!fileUrl) return;
  const filename = path.basename(fileUrl);
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Failed to delete local file ${filePath}:`, err);
    }
  }
};

export const getDocuments = async (userId, { category, search, page = 1, limit = 12 }) => {
  const query = { user: userId, isArchived: false };

  if (category && category !== 'all') {
    query.category = category;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ title: regex }, { description: regex }, { tags: regex }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Document.countDocuments(query);
  const documents = await Document.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return {
    documents,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

export const getDocumentById = async (userId, documentId) => {
  const document = await Document.findOne({ _id: documentId, user: userId });
  if (!document) {
    const error = new Error('Document not found');
    error.statusCode = 404;
    throw error;
  }
  return document;
};

export const createDocument = async (userId, data, file) => {
  if (!file) {
    const error = new Error('File is required');
    error.statusCode = 400;
    throw error;
  }

  // Upload to Cloudinary from memory buffer
  let cloudinaryResult;
  try {
    cloudinaryResult = await uploadFromBuffer(file.buffer, file.mimetype, file.originalname);
  } catch (err) {
    const error = new Error(`Failed to upload document to Cloudinary: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }

  const document = await Document.create({
    user: userId,
    title: data.title,
    category: data.category,
    description: data.description || '',
    fileUrl: cloudinaryResult.secure_url,
    cloudinaryPublicId: cloudinaryResult.public_id,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    expiryDate: data.expiryDate || null,
    tags: data.tags || [],
    renewedFrom: data.renewedFrom || null,
  });

  return document;
};

export const updateDocument = async (userId, documentId, data) => {
  const document = await getDocumentById(userId, documentId);

  if (data.title !== undefined) document.title = data.title;
  if (data.category !== undefined) document.category = data.category;
  if (data.description !== undefined) document.description = data.description;
  if (data.expiryDate !== undefined) {
    document.expiryDate = data.expiryDate || null;
  }
  if (data.tags !== undefined) document.tags = data.tags;
  if (data.isArchived !== undefined) document.isArchived = data.isArchived;

  await document.save();
  return document;
};

export const deleteDocument = async (userId, documentId) => {
  const document = await getDocumentById(userId, documentId);

  // If it's a Cloudinary-backed document, delete from Cloudinary
  if (document.cloudinaryPublicId) {
    try {
      await deleteFromCloudinary(document.cloudinaryPublicId, document.mimeType);
    } catch (err) {
      console.error(`Failed to delete Cloudinary asset ${document.cloudinaryPublicId}:`, err);
      // Re-throw to inform frontend as requested: "handle the error safely and do not silently claim that everything was deleted."
      const error = new Error(`Failed to delete document from Cloudinary storage: ${err.message}`);
      error.statusCode = 502;
      throw error;
    }
  } else {
    // Legacy support for seeded documents on disk
    deleteFileFromDisk(document.fileUrl);
  }

  await document.deleteOne();
  return document;
};
