import express from 'express';
import {
  createReservation,
  getMyReservations,
  getRestaurantReservations,
  updateReservationStatus,
  bulkUpdateReservationStatus,
  updateReservation
} from '../controllers/reservationController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createReservationSchema } from '../middleware/schemas.js';

const router = express.Router();

// customer routes (supports logged-in users and guests)
router.post('/', optionalAuth, validate(createReservationSchema), createReservation);

// customer routes
router.get('/my-reservations', protect, getMyReservations);

// merchant/Admin routes
router.get('/restaurant/:restaurantId', protect, authorize('merchant', 'admin'), getRestaurantReservations);
router.put('/bulk-status', protect, authorize('merchant', 'admin'), bulkUpdateReservationStatus);
router.put('/:id', protect, authorize('merchant', 'admin'), updateReservation);
router.put('/:id/status', protect, authorize('merchant', 'admin', 'staff'), updateReservationStatus);

export default router;
