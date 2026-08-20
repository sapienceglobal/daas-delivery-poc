import { Router } from 'express';
import { upload, uploadToCloudinary, uploadBase64ToCloudinary } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as res from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const validateFolder = (requestedFolder) => {
  const folder = requestedFolder || 'restaurant-platform/uploads';
  if (typeof folder !== 'string' || folder.includes('..') || !folder.startsWith('restaurant-platform/')) {
    throw new AppError('Invalid upload folder path', 400);
  }
  return folder;
};

/**
 * POST /api/upload
 * Upload a single image file via multipart/form-data.
 */
router.post('/', protect, upload.single('image'), asyncHandler(async (req, response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const folder = validateFolder(req.body.folder);
  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
  const result = await uploadBase64ToCloudinary(dataURI, { folder });

  res.success(response, {
    data: { url: result.url, publicId: result.publicId },
    message: 'File uploaded successfully'
  });
}));

/**
 * POST /api/upload/multiple
 * Upload multiple images (max 5).
 */
router.post('/multiple', protect, upload.array('images', 5), asyncHandler(async (req, response) => {
  if (!req.files?.length) throw new AppError('No files uploaded', 400);

  const folder = validateFolder(req.body.folder);
  const results = await Promise.all(
    req.files.map(file => {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
      return uploadBase64ToCloudinary(dataURI, { folder });
    })
  );

  res.success(response, {
    data: results.map(r => ({ url: r.url, publicId: r.publicId })),
    message: `${results.length} files uploaded`
  });
}));

export default router;
