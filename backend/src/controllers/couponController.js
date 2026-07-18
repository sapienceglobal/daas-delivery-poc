import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';

export const validateCoupon = asyncHandler(async (req, response) => {
  const { code, cartValue, restaurantId } = req.body;
  if (!code) throw new AppError('Coupon code is required', 400);

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new AppError('Invalid coupon code', 404);

  if (coupon.specificRestaurant && restaurantId && coupon.specificRestaurant.toString() !== restaurantId) {
    throw new AppError('This coupon is not valid for this restaurant', 400);
  }

  const isFirstOrder = (await Order.countDocuments({ userId: req.user._id })) === 0;
  const validation = coupon.isValid(cartValue || 0, req.user._id, isFirstOrder);

  if (!validation.valid) {
    throw new AppError(validation.reason, 400);
  }

  const discount = coupon.calculateDiscount(cartValue || 0);

  res.success(response, {
    data: { code: coupon.code, type: coupon.type, value: coupon.value, discount, description: coupon.description }
  });
});

export const getCoupons = asyncHandler(async (req, response) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.user.role === 'merchant') {
    filter.specificRestaurant = req.user.restaurantId;
  }
  if (req.query.active === 'true') {
    filter.isActive = true;
    filter.endDate = { $gte: new Date() };
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Coupon.countDocuments(filter)
  ]);

  res.success(response, { data: coupons, pagination: res.buildPagination(page, limit, total) });
});

export const createCoupon = asyncHandler(async (req, response) => {
  req.body.createdBy = req.user._id;
  if (req.user.role === 'merchant') {
    req.body.specificRestaurant = req.user.restaurantId;
  }
  const coupon = await Coupon.create(req.body);
  res.created(response, { data: coupon });
});

export const updateCoupon = asyncHandler(async (req, response) => {
  const existingCoupon = await Coupon.findById(req.params.id);
  if (!existingCoupon) throw new AppError('Coupon not found', 404);

  if (req.user.role === 'merchant' && existingCoupon.specificRestaurant?.toString() !== req.user.restaurantId?.toString()) {
    throw new AppError('Not authorized to update this coupon', 403);
  }

  if (req.user.role === 'merchant') {
    req.body.specificRestaurant = req.user.restaurantId;
  }

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.success(response, { data: coupon, message: 'Coupon updated' });
});

export const deleteCoupon = asyncHandler(async (req, response) => {
  const existingCoupon = await Coupon.findById(req.params.id);
  if (!existingCoupon) throw new AppError('Coupon not found', 404);

  if (req.user.role === 'merchant' && existingCoupon.specificRestaurant?.toString() !== req.user.restaurantId?.toString()) {
    throw new AppError('Not authorized to delete this coupon', 403);
  }

  await Coupon.findByIdAndDelete(req.params.id);
  res.success(response, { message: 'Coupon deleted' });
});
