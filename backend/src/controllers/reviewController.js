import Review from '../models/Review.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
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

export const getItemReviews = asyncHandler(async (req, response) => {
  const { itemId } = req.params;

  // Find order IDs that contain this menu item
  const orders = await Order.find({ 'items.menuItemId': itemId }).select('_id').lean();
  const orderIds = orders.map(o => o._id);

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  // Match either direct itemId OR orderId matching item
  const filter = {
    $or: [
      { itemId },
      { orderId: { $in: orderIds } }
    ],
    isVisible: true
  };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter)
  ]);

  // Calculate rating stats
  let totalRatingSum = 0;
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.overallRating || r.foodRating || 5)));
    counts[star] = (counts[star] || 0) + 1;
    totalRatingSum += (r.overallRating || r.foodRating || 5);
  });

  const avgRating = total > 0 ? (totalRatingSum / total).toFixed(1) : '4.8';

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: counts[stars] || 0,
    percent: total > 0 ? Math.round(((counts[stars] || 0) / total) * 100) : 0
  }));

  res.success(response, {
    data: reviews,
    stats: {
      averageRating: avgRating,
      totalReviews: total,
      ratingDistribution
    },
    pagination: res.buildPagination(page, limit, total)
  });
});

export const getMyItemReview = asyncHandler(async (req, response) => {
  const { itemId } = req.params;
  const userId = req.user._id;

  const review = await Review.findOne({ userId, itemId, isVisible: true }).populate('userId', 'name avatar').lean();
  res.success(response, { data: review || null });
});

export const createReview = asyncHandler(async (req, response) => {
  const { orderId, itemId, restaurantId, foodRating, deliveryRating, overallRating, rating, title, comment, images } = req.body;

  const finalRating = Number(overallRating || rating || foodRating || 5);

  if (!finalRating || finalRating < 1 || finalRating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  let finalRestaurantId = restaurantId;
  let finalItemId = itemId;

  // If itemId is provided, find item & restaurantId if missing
  if (itemId && !finalRestaurantId) {
    const menuItem = await MenuItem.findById(itemId);
    if (menuItem) {
      finalRestaurantId = menuItem.restaurantId;
    }
  }

  // If orderId provided, verify order
  if (orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.userId?.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);
    finalRestaurantId = order.restaurantId;
  }

  // Check if user already reviewed this item
  if (itemId) {
    let existingReview = await Review.findOne({ userId: req.user._id, itemId });
    if (existingReview) {
      // Update existing review instead of throwing error
      existingReview.overallRating = finalRating;
      existingReview.foodRating = finalRating;
      if (title !== undefined) existingReview.title = title;
      if (comment !== undefined) existingReview.comment = comment;
      if (images) existingReview.images = images;
      await existingReview.save();
      await existingReview.populate('userId', 'name avatar');

      return res.success(response, { data: existingReview, message: 'Review updated successfully' });
    }
  }

  const reviewData = {
    userId: req.user._id,
    foodRating: finalRating,
    overallRating: finalRating,
    title: title || '',
    comment: comment || '',
    images: images || []
  };

  if (finalRestaurantId) reviewData.restaurantId = finalRestaurantId;
  if (orderId) reviewData.orderId = orderId;
  if (finalItemId) reviewData.itemId = finalItemId;
  if (deliveryRating) reviewData.deliveryRating = deliveryRating;

  let review = await Review.create(reviewData);

  await review.populate('userId', 'name avatar');

  // Recalculate restaurant average rating if restaurantId exists
  if (finalRestaurantId) {
    const stats = await Review.aggregate([
      { $match: { restaurantId: finalRestaurantId, isVisible: true } },
      { $group: { _id: null, avg: { $avg: '$overallRating' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Restaurant.findByIdAndUpdate(finalRestaurantId, {
        rating: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count
      });
    }
  }

  res.created(response, { data: review, message: 'Review submitted successfully' });
});

export const updateReview = asyncHandler(async (req, response) => {
  const { id } = req.params;
  const { foodRating, overallRating, rating, title, comment, images } = req.body;

  const review = await Review.findById(id);
  if (!review) throw new AppError('Review not found', 404);

  if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update this review', 403);
  }

  const finalRating = Number(overallRating || rating || foodRating || review.overallRating);
  review.overallRating = finalRating;
  review.foodRating = finalRating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;
  if (images !== undefined) review.images = images;

  await review.save();
  await review.populate('userId', 'name avatar');

  res.success(response, { data: review, message: 'Review updated successfully' });
});

export const deleteReview = asyncHandler(async (req, response) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) throw new AppError('Review not found', 404);

  if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to delete this review', 403);
  }

  await Review.findByIdAndDelete(id);

  res.success(response, { message: 'Review deleted successfully' });
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
