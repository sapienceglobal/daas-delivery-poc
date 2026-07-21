import express from 'express';
import {
  createInquiry,
  getRestaurantInquiries,
  updateInquiryStatus
} from '../controllers/cateringController.js';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createCateringSchema } from '../middleware/schemas.js';

const router = express.Router();

// Public route for submitting inquiries
router.post('/', validate(createCateringSchema), createInquiry);

// Merchant/Admin routes for managing inquiries
router.get('/restaurant/:restaurantId', protect, authorize('merchant', 'admin'), getRestaurantInquiries);
router.put('/:id/status', protect, authorize('merchant', 'admin'), updateInquiryStatus);

export default router;
