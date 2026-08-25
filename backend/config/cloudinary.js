import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import path from 'path';

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

/**
 * Uploads a file buffer from memory storage to Cloudinary.
 * Correctly handles resource_type for images vs raw files (PDF/DOC/DOCX).
 *
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {string} mimeType - File mime type
 * @param {string} originalName - Original name of the uploaded file
 * @returns {Promise<object>} Upload response metadata from Cloudinary
 */
export const uploadFromBuffer = (buffer, mimeType, originalName) => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const isImage = mimeType.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';
    
    const ext = path.extname(originalName);
    const baseName = path.parse(originalName).name.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Raw files in Cloudinary need the extension inside the public_id to preserve format
    const publicId = resourceType === 'raw' 
      ? `${baseName}_${Date.now()}${ext}` 
      : `${baseName}_${Date.now()}`;

    const options = {
      folder: 'lifevault_documents',
      resource_type: resourceType,
      public_id: publicId,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload stream error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Deletes a file from Cloudinary based on its public ID and mime type.
 *
 * @param {string} publicId - Cloudinary public ID
 * @param {string} mimeType - File mime type
 * @returns {Promise<object>} Cloudinary deletion result
 */
export const deleteFromCloudinary = (publicId, mimeType) => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const isImage = mimeType.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    cloudinary.uploader.destroy(
      publicId,
      { resource_type: resourceType },
      (error, result) => {
        if (error) {
          console.error('Cloudinary destroy error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );
  });
};

/**
 * Generates an authenticated signed download URL for private or restricted raw assets.
 *
 * @param {string} publicId - Cloudinary public ID
 * @param {string} format - File format/extension
 * @returns {string} Signed download URL
 */
export const getSignedDownloadUrl = (publicId, format) => {
  configureCloudinary();
  return cloudinary.utils.private_download_url(
    publicId,
    format,
    {
      resource_type: 'raw',
      type: 'upload',
    }
  );
};
