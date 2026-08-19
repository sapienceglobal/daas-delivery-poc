import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as resFormatter from '../utils/responseFormatter.js';

const router = express.Router();

/**
 * @desc    Get system audit logs
 * @route   GET /api/audit-logs
 * @access  Private (Admin, Merchant)
 */
router.get('/', protect, authorize('admin', 'merchant'), asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  const filter = {};
  
  // If merchant, only show logs relevant to their restaurant or general platform ones?
  // Usually system logs might be isolated to their restaurantId
  if (req.user.role === 'merchant') {
    filter.restaurantId = req.user.restaurantId;
  } else if (req.query.restaurantId) {
    filter.restaurantId = req.query.restaurantId;
  }

  if (req.query.severity) {
    filter.severity = req.query.severity;
  }
  
  if (req.query.event) {
    filter.event = req.query.event;
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter)
  ]);

  resFormatter.success(res, {
    data: logs,
    pagination: resFormatter.buildPagination(page, limit, total)
  });
}));

export default router;
