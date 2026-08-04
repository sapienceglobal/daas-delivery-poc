import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
  getMyLoyaltyHistory, 
  joinProgram, 
  earnPoints, 
  redeemPoints,
  getMyCoupons
} from '../controllers/loyaltyController.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/history', getMyLoyaltyHistory);
router.get('/my-coupons', getMyCoupons);
router.post('/join', joinProgram);
router.post('/earn', earnPoints);
router.post('/redeem', redeemPoints);

export default router;
