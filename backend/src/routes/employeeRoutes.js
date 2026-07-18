import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';
import * as employeeController from '../controllers/employeeController.js';

const router = express.Router();

// Public / POS routes (still need some protection ideally, but for now PIN acts as auth on the tablet)
// Wait, we'll protect these so only merchants/POS tablets can call them.
router.post('/pin/clock-in', employeeController.clockInWithPin);
router.post('/pin/clock-out', employeeController.clockOutWithPin);
router.post('/pin/verify', employeeController.verifyPin);

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
