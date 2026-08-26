import { Router } from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import * as couponController from '../controllers/couponController.js';

const router = Router();

// customer
router.post('/validate', protect, couponController.validateCoupon);
router.get('/active', optionalAuth, couponController.getActiveCoupons); // Public route for apps to fetch banners

// admin / Merchant
router.get('/stats', protect, authorize('admin', 'merchant'), couponController.getCouponStats);
router.get('/', protect, authorize('admin', 'merchant'), couponController.getCoupons);
router.post('/', protect, authorize('admin', 'merchant'), couponController.createCoupon);
router.put('/:id', protect, authorize('admin', 'merchant'), couponController.updateCoupon);
router.delete('/:id', protect, authorize('admin', 'merchant'), couponController.deleteCoupon);

export default router;
