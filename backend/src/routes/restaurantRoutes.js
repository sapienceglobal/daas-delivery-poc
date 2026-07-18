import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as restaurantController from '../controllers/restaurantController.js';

const router = Router();

// ── Public Routes ───────────────────────────────────────────────────────────
router.get('/', restaurantController.getRestaurants);
router.get('/nearby', restaurantController.getNearbyRestaurants);
router.get('/search', restaurantController.searchRestaurants);
router.get('/cuisines', restaurantController.getCuisines);
router.get('/merchant/my', protect, authorize('merchant'), restaurantController.getMerchantRestaurant);
router.get('/:id', restaurantController.getRestaurantById);

// ── Merchant Routes ─────────────────────────────────────────────────────────
router.post('/', protect, authorize('merchant', 'admin'), restaurantController.createRestaurant);
router.put('/:id', protect, authorize('merchant', 'admin'), restaurantController.updateRestaurant);
router.put('/:id/banner', protect, authorize('merchant', 'admin'), restaurantController.updateBanner);
router.put('/:id/hours', protect, authorize('merchant', 'admin'), restaurantController.updateOperatingHours);
router.put('/:id/toggle', protect, authorize('merchant', 'admin'), restaurantController.toggleActive);
router.get('/:id/finance', protect, authorize('merchant', 'admin'), restaurantController.getRestaurantFinance);
router.put('/:id/onboarding', protect, authorize('merchant', 'admin'), restaurantController.submitOnboarding);

// ── Admin Routes ────────────────────────────────────────────────────────────
router.put('/:id/status', protect, authorize('admin'), restaurantController.updateStatus);
router.put('/:id/commission', protect, authorize('admin'), restaurantController.updateCommission);
router.put('/:id/onboarding/review', protect, authorize('admin'), restaurantController.reviewOnboarding);
router.put('/:id/documents/:documentId/review', protect, authorize('admin'), restaurantController.reviewDocument);

export default router;
