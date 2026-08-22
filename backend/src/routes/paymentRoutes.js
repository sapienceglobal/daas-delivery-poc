import express from 'express';
import { createIntent, createSetupIntent, stripeWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import expressRaw from 'express';

const router = express.Router();

// webhook MUST use express.raw to preserve raw body for signature verification
// we will configure this specifically in app.js or here.
// but since app.js usually has express.json() globally, we must mount the webhook BEFORE express.json() in app.js
// OR we can export the webhook separately.
// for simplicity, we'll keep the route here and handle the raw body in app.js.
router.post('/webhook', stripeWebhook);

// protected routes
router.post('/create-intent', protect, createIntent);
router.post('/create-setup-intent', protect, createSetupIntent);

export default router;
