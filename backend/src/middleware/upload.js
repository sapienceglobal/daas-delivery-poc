import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

// ── Configure Cloudinary ────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── Multer: store in memory buffer (we upload to Cloudinary, not disk) ──────
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: JPEG, PNG, WebP, GIF, PDF'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10 MB max
  }
});

/**
 * Upload a buffer to Cloudinary.
 *
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options
 * @param {String} options.folder - Cloudinary folder (e.g. 'restaurants/banners')
 * @param {String} [options.publicId] - Custom public ID
 * @param {String} [options.resourceType] - 'image' | 'raw' | 'auto'
 * @returns {Promise<{ url: String, publicId: String, width: Number, height: Number }>}
 */
export const uploadToCloudinary = (buffer, { folder = 'restaurant-platform', publicId, resourceType = 'image' } = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId || undefined,
        resource_type: resourceType,
        transformation: resourceType === 'image'
          ? [{ quality: 'auto', fetch_format: 'auto' }]
          : undefined
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed', { error: error.message });
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        });
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary by public ID.
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.debug('Cloudinary delete result', { publicId, result: result.result });
    return result;
  } catch (error) {
    logger.error('Cloudinary delete failed', { publicId, error: error.message });
    throw error;
  }
};

/**
 * Upload a base64 data URI directly to Cloudinary (for legacy /api/upload endpoint).
 */
export const uploadBase64ToCloudinary = async (base64DataUri, { folder = 'restaurant-platform' } = {}) => {
  try {
    const result = await cloudinary.uploader.upload(base64DataUri, {
      folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }]
    });
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    logger.error('Cloudinary base64 upload failed', { error: error.message });
    throw error;
  }
};
