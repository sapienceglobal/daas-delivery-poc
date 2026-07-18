import Review from '../models/Review.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';

export const getRestaurantReviews = asyncHandler(async (req, response) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = { restaurantId: req.params.restaurantId, isVisible: true };

  const [reviews, total] = await Promise.all([
    Review.find(filter).populate('userId', 'name avatar').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(filter)
  ]);

  res.success(response, { data: reviews, pagination: res.buildPagination(page, limit, total) });
});

export const createReview = asyncHandler(async (req, response) => {
  const { orderId, foodRating, deliveryRating, overallRating, title, comment, images } = req.body;

  if (!orderId || !foodRating || !overallRating) {
    throw new AppError('orderId, foodRating, and overallRating are required', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (order.userId?.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);
  if (order.status !== 'delivered') throw new AppError('Can only review delivered orders', 400);

  const existingReview = await Review.findOne({ orderId });
  if (existingReview) throw new AppError('You have already reviewed this order', 409);

  const review = await Review.create({
    userId: req.user._id,
    restaurantId: order.restaurantId,
    orderId,
    foodRating,
    deliveryRating: deliveryRating || null,
    overallRating,
    title,
    comment,
    images: images || []
  });

  // Recalculate restaurant average rating
  const stats = await Review.aggregate([
    { $match: { restaurantId: order.restaurantId, isVisible: true } },
    { $group: { _id: null, avg: { $avg: '$overallRating' }, count: { $sum: 1 } } }
  ]);

  if (stats.length > 0) {
    await Restaurant.findByIdAndUpdate(order.restaurantId, {
      rating: Math.round(stats[0].avg * 10) / 10,
      reviewCount: stats[0].count
    });
  }

  res.created(response, { data: review });
});

export const replyToReview = asyncHandler(async (req, response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  // Verify merchant owns the restaurant
  const restaurant = await Restaurant.findById(review.restaurantId);
  if (!restaurant || restaurant.ownerId?.toString() !== req.user._id.toString()) {
    throw new AppError('Only the restaurant owner can reply', 403);
  }

  review.reply = {
    text: req.body.text,
    repliedAt: new Date(),
    repliedBy: req.user._id
  };
  await review.save();

  res.success(response, { data: review, message: 'Reply posted' });
});

export const markHelpful = asyncHandler(async (req, response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  const userId = req.user._id.toString();
  const alreadyMarked = review.helpfulBy.some(id => id.toString() === userId);

  if (alreadyMarked) {
    review.helpfulBy = review.helpfulBy.filter(id => id.toString() !== userId);
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    review.helpfulBy.push(req.user._id);
    review.helpfulCount += 1;
  }
  await review.save();

  res.success(response, { data: review });
});

export const getItemReviews = asyncHandler(async (req, response) => {
  const { itemId } = req.params;
  const ReviewModel = req.getModel ? req.getModel('Review') : Review;
  const OrderModel = req.getModel ? req.getModel('Order') : Order;

  // Find order IDs that contain this menu item
  const orders = await OrderModel.find({ 'items.menuItemId': itemId }).select('_id').lean();
  const orderIds = orders.map(o => o._id);

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = { orderId: { $in: orderIds }, isVisible: true };

  const [reviews, total] = await Promise.all([
    ReviewModel.find(filter)
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ReviewModel.countDocuments(filter)
  ]);

  res.success(response, { data: reviews, pagination: res.buildPagination(page, limit, total) });
});
