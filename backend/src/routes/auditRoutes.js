import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as resFormatter from '../utils/responseFormatter.js';

const router = express.Router();

/**
 * @desc    Get system audit logs with multi-dimensional filtering
 * @route   GET /api/audit
 * @access  Private (Admin, Merchant)
 */
router.get('/', protect, authorize('admin', 'merchant'), asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;

  const filter = {};
  const andConditions = [];

  // Merchant tenant isolation - allows viewing store events and customer activities
  const merchantRestId = req.user.restaurantId || req.query.restaurantId;
  if (merchantRestId) {
    if (req.query.actorType === 'customer') {
      andConditions.push({
        $or: [
          { restaurantId: merchantRestId },
          { restaurantId: null, actorType: 'customer' }
        ]
      });
    } else if (req.query.actorType === 'merchant') {
      filter.restaurantId = merchantRestId;
      filter.actorType = { $in: ['merchant', 'staff', 'admin'] };
    } else {
      andConditions.push({
        $or: [
          { restaurantId: merchantRestId },
          { restaurantId: null }
        ]
      });
    }
  }

  // Filter by Actor Type: merchant (staff/admin) vs customer vs system
  if (req.query.actorType && req.query.actorType !== 'all') {
    if (req.query.actorType === 'merchant') {
      filter.actorType = { $in: ['merchant', 'staff', 'admin'] };
    } else {
      filter.actorType = req.query.actorType;
    }
  }

  if (req.query.severity && req.query.severity !== 'all') {
    filter.severity = req.query.severity;
  }

  if (req.query.event && req.query.event !== 'all') {
    filter.event = req.query.event;
  }

  // Date range filtering
  if (req.query.startDate || req.query.endDate) {
    filter.timestamp = {};
    if (req.query.startDate) {
      filter.timestamp.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.timestamp.$lte = end;
    }
  }

  // Full-text / forensic search query
  if (req.query.search && req.query.search.trim()) {
    const s = req.query.search.trim();
    const regex = new RegExp(s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    andConditions.push({
      $or: [
        { message: regex },
        { orderNumber: regex },
        { event: regex },
        { 'actor.name': regex },
        { 'actor.email': regex },
        { 'actor.phone': regex },
        { 'device.ip': regex },
        { 'device.os': regex },
        { 'device.browser': regex },
        { 'device.locationDisplay': regex }
      ]
    });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
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

/**
 * @desc    Get summary statistics for Security & Activity Hub
 * @route   GET /api/audit/stats
 * @access  Private (Admin, Merchant)
 */
router.get('/stats', protect, authorize('admin', 'merchant'), asyncHandler(async (req, res) => {
  const merchantRestId = req.user.restaurantId || req.query.restaurantId;
  const storeFilter = merchantRestId ? {
    $or: [
      { restaurantId: merchantRestId },
      { restaurantId: null }
    ]
  } : {};

  const [total, merchantCount, customerCount, criticalCount, remakeCount] = await Promise.all([
    AuditLog.countDocuments(storeFilter),
    AuditLog.countDocuments({
      ...storeFilter,
      actorType: { $in: ['merchant', 'staff', 'admin'] }
    }),
    AuditLog.countDocuments({
      ...storeFilter,
      actorType: 'customer'
    }),
    AuditLog.countDocuments({ 
      ...storeFilter, 
      severity: { $in: ['critical', 'warning'] } 
    }),
    AuditLog.countDocuments({ 
      ...storeFilter, 
      event: { $in: ['ORDER_REMAKE', 'REMAKE_ORDER'] } 
    })
  ]);

  resFormatter.success(res, {
    data: {
      total,
      merchantCount,
      customerCount,
      criticalCount,
      remakeCount
    }
  });
}));

export default router;
