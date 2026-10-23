import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as seoController from '../controllers/seoController.js';

const router = Router();

// Public route to fetch SEO for a page & global tracking
router.get('/page', seoController.getPageSeo);
router.get('/global', seoController.getGlobalSeo);

// Merchant / Admin management routes
router.get('/pages', protect, authorize('admin', 'merchant'), seoController.getAllPagesSeo);
router.put('/page', protect, authorize('admin', 'merchant'), seoController.updatePageSeo);
router.put('/global', protect, authorize('admin', 'merchant'), seoController.updateGlobalSeo);

export default router;
