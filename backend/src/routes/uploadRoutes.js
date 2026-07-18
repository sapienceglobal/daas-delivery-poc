import { Router } from 'express';
import { upload, uploadToCloudinary, uploadBase64ToCloudinary } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as res from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/upload
 * Upload a single image file via multipart/form-data.
 */
router.post('/', protect, upload.single('image'), asyncHandler(async (req, response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const folder = req.body.folder || 'restaurant-platform/uploads';
  const result = await uploadToCloudinary(req.file.buffer, { folder, resourceType: 'auto' });

  res.success(response, {
    data: { url: result.url, publicId: result.publicId },
    message: 'File uploaded successfully'
  });
}));

/**
 * POST /api/upload/base64
 * Upload a base64-encoded image (legacy support).
 */
router.post('/base64', protect, asyncHandler(async (req, response) => {
  const { image, folder } = req.body;
  if (!image) throw new AppError('No image data provided', 400);

  const result = await uploadBase64ToCloudinary(image, { folder: folder || 'restaurant-platform/uploads' });

  res.success(response, {
    data: { url: result.url, publicId: result.publicId },
    message: 'Image uploaded successfully'
  });
}));

/**
 * POST /api/upload/multiple
 * Upload multiple images (max 5).
 */
router.post('/multiple', protect, upload.array('images', 5), asyncHandler(async (req, response) => {
  if (!req.files?.length) throw new AppError('No files uploaded', 400);

  const folder = req.body.folder || 'restaurant-platform/uploads';
  const results = await Promise.all(
    req.files.map(file => uploadToCloudinary(file.buffer, { folder, resourceType: 'auto' }))
  );

  res.success(response, {
    data: results.map(r => ({ url: r.url, publicId: r.publicId })),
    message: `${results.length} files uploaded`
  });
}));

export default router;
