import express from 'express';
import { submitContactMessage, getMerchantMessages, updateMessageStatus } from '../controllers/contactController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// public route to submit a message
router.post('/public/contact', submitContactMessage);

// protected routes for merchants/admins
router.get('/merchant/messages', protect, authorize('merchant', 'admin'), getMerchantMessages);
router.patch('/merchant/messages/:id', protect, authorize('merchant', 'admin'), updateMessageStatus);

export default router;
