import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// All admin routes require admin role
router.use(protect, authorize('admin'));

// Dashboard Stats
router.get('/dashboard', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/toggle', adminController.toggleUserActive);

// Restaurant Management
router.get('/restaurants', adminController.getAllRestaurants);

// Platform Analytics
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/orders', adminController.getOrderAnalytics);

// Finance & Settlements
router.get('/finance/summary', adminController.getFinanceSummary);
router.get('/settlements', adminController.listSettlements);
router.post('/settlements', adminController.generateSettlement);
router.put('/settlements/:id/paid', adminController.markSettlementPaid);

export default router;
