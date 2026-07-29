import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';
import * as employeeController from '../controllers/employeeController.js';

const router = express.Router();

// C2 FIX: PIN endpoints are public (POS tablets don't have user sessions) but
// they are brute-force protected with a strict rate limiter.
// 4-digit PIN = 10,000 combinations; at 10 req/15min it would take 10,000 * 1.5min = 250 days.
const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many PIN attempts. Please wait 15 minutes before trying again.' },
  skipSuccessfulRequests: false, // Count successful attempts too (prevent enumeration)
});

// Public / POS routes — rate-limited to prevent PIN brute-force
router.post('/pin/clock-in', pinLimiter, employeeController.clockInWithPin);
router.post('/pin/clock-out', pinLimiter, employeeController.clockOutWithPin);
router.post('/pin/verify', pinLimiter, employeeController.verifyPin);

// Protected routes (Admin / Merchant)
router.use(protect);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.MERCHANT));

router.get('/restaurant/:restaurantId', employeeController.getEmployees);
router.post('/restaurant/:restaurantId', employeeController.createEmployee);
router.get('/restaurant/:restaurantId/payroll', employeeController.getPayrollReport);

router.put('/:employeeId', employeeController.updateEmployee);
router.put('/:employeeId/schedule', employeeController.updateSchedule);
router.delete('/:employeeId', employeeController.removeEmployee);

export default router;
