import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Restaurant from '../models/Restaurant.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/vapid-public-key', (req, res) => {
  res.status(200).json({
    status: 'success',
    publicKey: process.env.VAPID_PUBLIC_KEY
  });
});

router.post('/subscribe', protect, authorize('merchant', 'admin'), async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return next(new AppError('Invalid subscription payload', 400));
    }

    const tenantId = req.user.tenantId || req.user.restaurantId;
    const restaurant = await Restaurant.findById(tenantId); 
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    const exists = restaurant.webPushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    
    if (!exists) {
      restaurant.webPushSubscriptions.push(subscription);
      await restaurant.save({ validateModifiedOnly: true });
    }

    res.status(200).json({ status: 'success', message: 'Subscribed to push notifications successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
