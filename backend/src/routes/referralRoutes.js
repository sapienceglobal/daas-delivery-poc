import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import * as referralController from '../controllers/referralController.js';

const router = Router();

// brute-force / enumeration guard: per account, 8 attempts per 15 minutes
const applyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyGenerator: (req) => `referral-apply:${req.user?._id?.toString() || 'anon'}`,
  validate: { keyGeneratorIpFallback: false },
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// public program text / values (dynamic, admin-managed)
router.get('/program', optionalAuth, referralController.getProgram);

// customer
router.get('/me', protect, referralController.getMyReferral);
router.post('/apply', protect, applyLimiter, referralController.applyCode);
router.post('/skip', protect, referralController.skipOnboarding);

// admin / merchant
const staff = [protect, authorize('admin', 'merchant')];
router.get('/admin/settings', ...staff, referralController.getAdminSettings);
router.put('/admin/settings', ...staff, referralController.updateAdminSettings);
router.get('/admin/stats', ...staff, referralController.getAdminStats);
router.get('/admin/list', ...staff, referralController.listReferrals);
router.patch('/admin/:id/cancel', ...staff, referralController.cancelReferral);

export default router;
