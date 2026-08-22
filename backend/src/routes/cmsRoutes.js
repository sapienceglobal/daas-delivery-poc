import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getCmsConfig, updateCmsConfig } from '../controllers/cmsController.js';

const router = express.Router();

// public route to get CMS configuration for the customer website
router.get('/', getCmsConfig);

// protected route for merchants/admins to update CMS configuration
router.put('/', protect, authorize('admin', 'manager', 'superadmin', 'merchant'), updateCmsConfig);

export default router;
