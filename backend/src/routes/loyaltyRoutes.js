import express from 'express';
import { protect } from '../middleware/auth.js';
import { getMyLoyaltyHistory } from '../controllers/loyaltyController.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/history', getMyLoyaltyHistory);

export default router;
