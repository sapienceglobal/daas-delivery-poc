import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as seoController from '../controllers/seoController.js';

const router = Router();

// Public route to fetch SEO for a page
router.get('/page', seoController.getPageSeo);

// Merchant / Admin management routes
router.get('/pages', protect, authorize('admin', 'merchant'), seoController.getAllPagesSeo);
router.put('/page', protect, authorize('admin', 'merchant'), seoController.updatePageSeo);

export default router;
