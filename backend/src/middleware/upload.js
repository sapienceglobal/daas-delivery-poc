import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import logger from '../utils/logger.js';
import { AppError } from './errorHandler.js';

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
    fileSize: 50 * 1024 * 1024  // 50 MB max
  }
});

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * Upload a buffer to Local File System (replaces Cloudinary).
 *
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options
 * @param {String} options.folder - Subfolder (e.g. 'restaurant-platform')
 * @param {String} [options.publicId] - Custom public ID
 * @param {String} [options.resourceType] - 'image' | 'raw' | 'auto'
 * @returns {Promise<{ url: String, publicId: String, width: Number, height: Number }>}
 */
export const uploadToCloudinary = async (buffer, { folder = 'restaurant-platform', publicId, resourceType = 'image' } = {}) => {
  let finalBuffer = buffer;
  let ext = 'jpg';
  let width = 0, height = 0;

  // Compress if it's an image
  if (resourceType === 'image') {
    try {
      // Get image metadata before processing to get width/height
      const metadata = await sharp(buffer).metadata();
      width = metadata.width;
      height = metadata.height;

      // Always process the image to normalize it and strip metadata
      finalBuffer = await sharp(buffer)
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      ext = 'jpg';
      logger.info(`Compressed image from ${(buffer.length / 1024 / 1024).toFixed(2)}MB to ${(finalBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    } catch (e) {
      logger.error('Sharp compression failed', { error: e.message });
      // Proceed with original buffer if compression fails
      ext = 'png'; // fallback extension
    }
  } else if (resourceType === 'raw') {
      ext = 'pdf';
  }

  // Generate unique filename
  const filename = (publicId || crypto.randomBytes(16).toString('hex')) + '.' + ext;
  
  // Make sure the target folder exists
  const targetFolder = path.join(UPLOADS_DIR, folder);
  await fs.mkdir(targetFolder, { recursive: true });

  const targetPath = path.join(targetFolder, filename);

  // Save the file
  await fs.writeFile(targetPath, finalBuffer);

  // Return the public URL
  // Construct URL accessible via our Express static route
  const baseUrl = process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.lassiloungeny.com' : 'http://127.0.0.1:5001');
  const publicUrl = `${baseUrl}/uploads/${folder}/${filename}`;

  return {
    url: publicUrl,
    publicId: `${folder}/${filename.split('.')[0]}`,
    width: width || 800,
    height: height || 800,
    format: ext,
    bytes: finalBuffer.length
  };
};

// delete a file from Local Storage by public ID.
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    // publicId is expected to be "folder/filename_without_ext"
    // Since we don't know the exact extension, we will search for it
    const folderPath = path.dirname(path.join(UPLOADS_DIR, publicId));
    const baseName = path.basename(publicId);
    
    // Simplistic delete: try deleting .jpg, .png, .webp, .pdf
    const exts = ['.jpg', '.png', '.webp', '.pdf'];
    for (const ext of exts) {
      const fullPath = path.join(folderPath, baseName + ext);
      try {
        await fs.unlink(fullPath);
        logger.debug('Local delete result', { fullPath });
        return { result: 'ok' };
      } catch (err) {
        // Ignore if file doesn't exist
      }
    }
    
    return { result: 'not found' };
  } catch (error) {
    logger.error('Local delete failed', { publicId, error: error.message });
    throw error;
  }
};

// upload a base64 data URI directly to Local File System.
export const uploadBase64ToCloudinary = async (base64DataUri, { folder = 'restaurant-platform' } = {}) => {
  try {
    // Strip the prefix (e.g. "data:image/png;base64,")
    const matches = base64DataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid input string');
    }
    
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Use our new local upload logic
    return await uploadToCloudinary(buffer, { folder });
  } catch (error) {
    logger.error('Base64 local upload failed', { error: error.message });
    throw error;
  }
};
