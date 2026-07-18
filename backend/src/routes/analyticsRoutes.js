import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';
import * as analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

router.use(protect);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.MERCHANT));

router.get('/restaurant/:restaurantId', analyticsController.getSalesAnalytics);

export default router;
