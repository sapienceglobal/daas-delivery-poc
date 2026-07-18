import express from 'express';
import { createIntent, stripeWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import expressRaw from 'express';

const router = express.Router();

// Webhook MUST use express.raw to preserve raw body for signature verification
// We will configure this specifically in app.js or here.
// But since app.js usually has express.json() globally, we must mount the webhook BEFORE express.json() in app.js
// OR we can export the webhook separately.
// For simplicity, we'll keep the route here and handle the raw body in app.js.
router.post('/webhook', stripeWebhook);

// Protected routes
router.post('/create-intent', protect, createIntent);

export default router;
