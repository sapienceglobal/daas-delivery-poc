import express from 'express';
import {
  createReservation,
  getMyReservations,
  getRestaurantReservations,
  updateReservationStatus
} from '../controllers/reservationController.js';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createReservationSchema } from '../middleware/schemas.js';

const router = express.Router();

// Customer routes
router.post('/', protect, validate(createReservationSchema), createReservation);
// Wait, the controller says "Public / Private". Let's make a custom middleware if we want optional, but standard protect works if we assume logged in users only.
// Let's modify: if we use 'protect', they MUST be logged in. The UI usually requires login. We'll leave it as protect.

// Customer routes
router.get('/my-reservations', protect, getMyReservations);

// Merchant/Admin routes
router.get('/restaurant/:restaurantId', protect, authorize('merchant', 'admin'), getRestaurantReservations);
router.put('/:id/status', protect, authorize('merchant', 'admin'), updateReservationStatus);

export default router;
