import express from 'express';
import { getCampaigns, broadcastCampaign } from '../controllers/marketingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Only allow admin and manager to access marketing campaigns
router.use(protect);
router.use(authorize('merchant', 'admin'));

router.route('/')
  .get(getCampaigns)
  .post(broadcastCampaign);

export default router;
