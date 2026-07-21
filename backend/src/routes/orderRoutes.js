import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createOrderSchema, rateOrderSchema, deliveryQuoteSchema, replyToReviewSchema, refundOrderSchema } from '../middleware/schemas.js';
import * as orderController from '../controllers/orderController.js';

const router = Router();

// ── Customer Routes ─────────────────────────────────────────────────────────
router.post('/', protect, validate(createOrderSchema), orderController.createOrder);
router.get('/merchant/all', protect, authorize('merchant', 'admin'), orderController.getMerchantOrders);
router.get('/my-orders', protect, orderController.getMyOrders);
router.get('/:id', protect, orderController.getOrderById);
router.post('/:id/cancel', protect, orderController.cancelOrder);
router.post('/:id/rate', protect, validate(rateOrderSchema), orderController.rateOrder);
router.post('/delivery-quote', protect, validate(deliveryQuoteSchema), orderController.getDeliveryQuote);

// ── Merchant Routes ─────────────────────────────────────────────────────────
router.get('/restaurant/:restaurantId', protect, authorize('merchant', 'admin'), orderController.getRestaurantOrders);
router.put('/:id/status', protect, authorize('merchant', 'admin'), orderController.updateOrderStatus);
router.put('/:id/prep', protect, authorize('merchant', 'admin'), orderController.updateOrderStatus);
router.put('/:id/accept', protect, authorize('merchant', 'admin'), orderController.acceptOrder);
router.put('/:id/reject', protect, authorize('merchant', 'admin'), orderController.rejectOrder);
router.post('/:id/reply', protect, authorize('merchant', 'admin'), validate(replyToReviewSchema), orderController.replyToReview);

// ── Admin Routes ────────────────────────────────────────────────────────────
router.get('/', protect, authorize('admin'), orderController.getAllOrders);
router.post('/:id/refund', protect, authorize('admin', 'merchant'), validate(refundOrderSchema), orderController.refundOrder);

// ── Driver Routes ───────────────────────────────────────────────────────────
router.get('/driver/available', protect, authorize('driver'), orderController.getAvailableDriverOrders);
router.get('/driver/active', protect, authorize('driver'), orderController.getActiveDriverOrder);
router.put('/:id/driver-accept', protect, authorize('driver'), orderController.driverAcceptOrder);
router.put('/:id/driver-pickup', protect, authorize('driver'), orderController.driverPickupOrder);
router.put('/:id/driver-deliver', protect, authorize('driver'), orderController.driverDeliverOrder);

// ── Simulation (development only) ───────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  router.post('/:id/simulate', protect, authorize('admin'), orderController.simulateStatusAdvance);
}

export default router;
