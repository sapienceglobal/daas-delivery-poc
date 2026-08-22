import express from 'express';
import {
  createReservation,
  getMyReservations,
  getRestaurantReservations,
  updateReservationStatus,
  bulkUpdateReservationStatus,
  updateReservation
} from '../controllers/reservationController.js';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createReservationSchema } from '../middleware/schemas.js';

const router = express.Router();

// customer routes
router.post('/', protect, validate(createReservationSchema), createReservation);
// wait, the controller says "Public / Private". Let's make a custom middleware if we want optional, but standard protect works if we assume logged in users only.
// let's modify: if we use 'protect', they MUST be logged in. The UI usually requires login. We'll leave it as protect.

// customer routes
router.get('/my-reservations', protect, getMyReservations);

// merchant/Admin routes
router.get('/restaurant/:restaurantId', protect, authorize('merchant', 'admin'), getRestaurantReservations);
router.put('/bulk-status', protect, authorize('merchant', 'admin'), bulkUpdateReservationStatus);
router.put('/:id', protect, authorize('merchant', 'admin'), updateReservation);
router.put('/:id/status', protect, authorize('merchant', 'admin', 'staff'), updateReservationStatus);

export default router;
