import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { predictSales, smartPricing, recommendFood } from '../controllers/aiController.js';

const router = express.Router();

router.post('/predict', protect, authorize('merchant', 'admin'), predictSales);
router.post('/smart-pricing', protect, authorize('merchant', 'admin'), smartPricing);
router.post('/recommend', recommendFood); // public/customer facing

export default router;
