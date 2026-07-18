import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as menuController from '../controllers/menuController.js';

const router = Router();

// ── Public Routes ───────────────────────────────────────────────────────────
router.get('/restaurant/:restaurantId', menuController.getMenuByRestaurant);
router.get('/items/:id', menuController.getMenuItem);
router.get('/categories/:restaurantId', menuController.getCategoriesByRestaurant);

// ── Merchant Routes ─────────────────────────────────────────────────────────
// Categories
router.post('/categories', protect, authorize('merchant', 'admin'), menuController.createCategory);
router.put('/categories/:id', protect, authorize('merchant', 'admin'), menuController.updateCategory);
router.delete('/categories/:id', protect, authorize('merchant', 'admin'), menuController.deleteCategory);

// Items
router.post('/items', protect, authorize('merchant', 'admin'), menuController.createMenuItem);
router.put('/items/:id', protect, authorize('merchant', 'admin'), menuController.updateMenuItem);
router.delete('/items/:id', protect, authorize('merchant', 'admin'), menuController.deleteMenuItem);
router.patch('/items/:id/toggle', protect, authorize('merchant', 'admin'), menuController.toggleItemAvailability);

// Bulk Operations
router.post('/bulk-import', protect, authorize('merchant', 'admin'), menuController.bulkImportItems);

export default router;
