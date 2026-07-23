import mongoose from 'mongoose';
import Restaurant from '../models/Restaurant.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Settlement from '../models/Settlement.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import { roundMoney } from '../services/orderPricing.js';

const canReadRestaurant = (restaurant, user) => {
  if (user.role === 'admin') return true;
  return restaurant.ownerId?.toString() === user._id.toString() ||
    user.restaurantId?.toString() === restaurant._id.toString();
};

// ── Public ──────────────────────────────────────────────────────────────────

export const getRestaurants = asyncHandler(async (req, response) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = { status: 'approved' };

  // Filters
  if (req.query.cuisine) {
    filter.cuisineTags = { $in: req.query.cuisine.split(',').map(c => c.trim().toLowerCase()) };
  }
  if (req.query.rating) {
    filter.rating = { $gte: parseFloat(req.query.rating) };
  }
  if (req.query.featured === 'true') {
    filter.isFeatured = true;
  }

  // Sort
  let sort = { isFeatured: -1, rating: -1 };
  if (req.query.sort === 'rating') sort = { rating: -1 };
  else if (req.query.sort === 'name') sort = { name: 1 };
  else if (req.query.sort === 'newest') sort = { createdAt: -1 };

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Restaurant.countDocuments(filter)
  ]);

  res.success(response, {
    data: restaurants,
    pagination: res.buildPagination(page, limit, total)
  });
});

export const getNearbyRestaurants = asyncHandler(async (req, response) => {
  const { lat, lng, maxDistance = 15 } = req.query;

  if (!lat || !lng) throw new AppError('lat and lng query parameters are required', 400);

  const restaurants = await Restaurant.find({
    status: 'approved',
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(maxDistance) * 1609.34 // miles to meters
      }
    }
  }).limit(50).lean();

  res.success(response, { data: restaurants });
});

export const searchRestaurants = asyncHandler(async (req, response) => {
  const { q } = req.query;
  if (!q) throw new AppError('Search query (q) is required', 400);

  const regex = new RegExp(q, 'i');

  const restaurants = await Restaurant.find({
    status: 'approved',
    $or: [
      { name: regex },
      { cuisine: regex },
      { cuisineTags: regex },
      { description: regex }
    ]
  }).limit(30).lean();

  // Also search menu items and return matching restaurant IDs
  const menuMatches = await MenuItem.find({
    isAvailable: true,
    $or: [{ name: regex }, { description: regex }, { tags: regex }]
  }).distinct('restaurantId');

  const menuRestaurants = await Restaurant.find({
    _id: { $in: menuMatches },
    status: 'approved',
    _id: { $nin: restaurants.map(r => r._id) }
  }).limit(20).lean();

  res.success(response, {
    data: [...restaurants, ...menuRestaurants]
  });
});

export const getCuisines = asyncHandler(async (_req, response) => {
  const cuisines = await Restaurant.distinct('cuisineTags', {
    status: 'approved',
    isActive: true
  });

  res.success(response, { data: cuisines.sort() });
});

export const getRestaurantById = asyncHandler(async (req, response) => {
  let restaurant;
  
  // FIX: Ab yeh sirf exactly 24-character wale real ObjectIds ko hi allow karega
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id) && String(req.params.id).length === 24;

  if (isObjectId) {
    restaurant = await Restaurant.findById(req.params.id).lean();
  } else if (req.params.id === 'lassi-lounge') {
    // Agar id 24 char ki nahi hai aur 'lassi-lounge' hai, tab yeh chalega
    restaurant = await Restaurant.findOne({ name: { $regex: /^lassi lounge$/i } }).lean();
  } else {
    // Agar future me koi aur naam pass hota hai (jaise slug)
    restaurant = await Restaurant.findOne({ slug: req.params.id }).lean(); 
  }

  if (!restaurant) throw new AppError('Restaurant not found', 404);

  // Load categories and items
  const categories = await Category.find({
    restaurantId: restaurant._id,
    isActive: true
  }).sort({ sortOrder: 1 }).lean();

  const items = await MenuItem.find({
    restaurantId: restaurant._id,
    isAvailable: true
  }).sort({ sortOrder: 1 }).lean();

  // Group items by category
  const menu = categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.categoryId.toString() === cat._id.toString())
  }));

  res.success(response, { data: { ...restaurant, menu } });
});

// ── Merchant ────────────────────────────────────────────────────────────────

export const createRestaurant = asyncHandler(async (req, response) => {
  const data = {
    ...req.body,
    ownerId: req.user._id,
    status: req.user.role === 'admin' ? 'approved' : 'pending'
  };

  const restaurant = await Restaurant.create(data);

  // Link restaurant to the merchant user
  if (req.user.role === 'merchant') {
    req.user.restaurantId = restaurant._id;
    await req.user.save();
  }

  res.created(response, { data: restaurant });
});

export const updateRestaurant = asyncHandler(async (req, response) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  // Ensure merchant can only update their own restaurant
  if (req.user.role === 'merchant' && restaurant.ownerId?.toString() !== req.user._id.toString()) {
    throw new AppError('You can only update your own restaurant', 403);
  }

  const allowed = [
    'name', 'description', 'cuisine', 'phone', 'email', 'website',
    'address', 'location', 'deliveryFee', 'minimumOrder', 'deliveryRadius',
    'acceptsOnlineOrders', 'acceptsDineIn', 'acceptsPickup', 'autoAcceptOrders',
    'preparationTime', 'prepTime'
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) restaurant[key] = req.body[key];
  }

  await restaurant.save();
  res.success(response, { data: restaurant, message: 'Restaurant updated' });
});

export const updateBanner = asyncHandler(async (req, response) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  if (req.user.role === 'merchant' && restaurant.ownerId?.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }

  const { banner, logo } = req.body;
  if (banner) restaurant.banner = banner;
  if (logo) restaurant.logo = logo;
  await restaurant.save();

  res.success(response, { data: restaurant, message: 'Images updated' });
});

export const updateOperatingHours = asyncHandler(async (req, response) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  if (req.user.role === 'merchant' && restaurant.ownerId?.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }

  if (req.body.operatingHours) restaurant.operatingHours = req.body.operatingHours;
  if (req.body.openTime) restaurant.openTime = req.body.openTime;
  if (req.body.closeTime) restaurant.closeTime = req.body.closeTime;
  await restaurant.save();

  res.success(response, { data: restaurant, message: 'Operating hours updated' });
});

export const toggleActive = asyncHandler(async (req, response) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  if (req.user.role === 'merchant' && restaurant.ownerId?.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }

  restaurant.isActive = !restaurant.isActive;
  await restaurant.save();

  res.success(response, {
    data: restaurant,
    message: `Restaurant ${restaurant.isActive ? 'activated' : 'deactivated'}`
  });
});

export const getRestaurantFinance = asyncHandler(async (req, response) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new AppError('Restaurant not found', 404);
  if (!canReadRestaurant(restaurant, req.user)) {
    throw new AppError('You can only view finance for your own restaurant', 403);
  }

  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [summaryAgg, statusBreakdown, settlements] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          createdAt: { $gte: startDate },
          paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] }
        }
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          grossSales: { $sum: '$subtotal' },
          taxes: { $sum: '$tax' },
          tips: { $sum: '$tip' },
          refunds: { $sum: '$refundAmount' },
          collected: { $sum: '$total' },
          platformFees: { $sum: '$platformFee' },
          serviceFees: { $sum: '$serviceFee' }
        }
      }
    ]),
    Order.aggregate([
      { $match: { restaurantId: restaurant._id, createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Settlement.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).limit(10).lean()
  ]);

  const summary = summaryAgg[0] || {};
  const commission = roundMoney((summary.grossSales || 0) * (restaurant.commissionRate || 0));
  const estimatedNetPayable = roundMoney(Math.max(
    0,
    (summary.grossSales || 0) + (summary.tips || 0) - commission - (summary.refunds || 0)
  ));

  res.success(response, {
    data: {
      days,
      commissionRate: restaurant.commissionRate || 0,
      orders: summary.orders || 0,
      grossSales: roundMoney(summary.grossSales || 0),
      taxes: roundMoney(summary.taxes || 0),
      tips: roundMoney(summary.tips || 0),
      refunds: roundMoney(summary.refunds || 0),
      collected: roundMoney(summary.collected || 0),
      platformFees: roundMoney(summary.platformFees || 0),
      serviceFees: roundMoney(summary.serviceFees || 0),
      commission,
      estimatedNetPayable,
      statusBreakdown,
      settlements
    }
  });
});

export const submitOnboarding = asyncHandler(async (req, response) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new AppError('Restaurant not found', 404);
  if (!canReadRestaurant(restaurant, req.user)) {
    throw new AppError('You can only update onboarding for your own restaurant', 403);
  }

  const {
    businessInfo,
    documents,
    submit = false,
    name,
    description,
    cuisine,
    phone,
    email,
    website,
    address,
    location
  } = req.body;

  const profileFields = { name, description, cuisine, phone, email, website, address, location };
  for (const [key, value] of Object.entries(profileFields)) {
    if (value !== undefined) restaurant[key] = value;
  }

  if (businessInfo) {
    restaurant.businessInfo = {
      ...(restaurant.businessInfo?.toObject?.() || restaurant.businessInfo || {}),
      ...businessInfo,
      taxIdLast4: businessInfo.taxIdLast4 ? String(businessInfo.taxIdLast4).slice(-4) : restaurant.businessInfo?.taxIdLast4
    };
  }

  if (Array.isArray(documents)) {
    restaurant.documents = documents.map((doc) => ({
      name: doc.name || 'Document',
      type: doc.type || 'other',
      url: doc.url,
      publicId: doc.publicId || null,
      verified: false,
      rejectionReason: null,
      uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date()
    })).filter((doc) => doc.url);
  }

  if (submit) {
    if (!restaurant.businessInfo?.legalName || !restaurant.businessInfo?.taxIdLast4 || !restaurant.documents?.length) {
      throw new AppError('Legal business name, tax ID last 4, and at least one document are required', 400);
    }
    restaurant.onboardingStatus = 'submitted';
    restaurant.onboardingSubmittedAt = new Date();
    restaurant.onboardingReviewNotes = '';
    restaurant.status = 'pending';
  } else if (restaurant.onboardingStatus === 'not_started') {
    restaurant.onboardingStatus = 'draft';
  }

  await restaurant.save();
  res.success(response, { data: restaurant, message: submit ? 'Onboarding submitted for review' : 'Onboarding saved' });
});

// ── Admin ───────────────────────────────────────────────────────────────────

export const reviewOnboarding = asyncHandler(async (req, response) => {
  const { decision, notes = '' } = req.body;
  if (!['approved', 'needs_changes', 'rejected'].includes(decision)) {
    throw new AppError('decision must be approved, needs_changes, or rejected', 400);
  }

  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  restaurant.onboardingStatus = decision;
  restaurant.onboardingReviewedAt = new Date();
  restaurant.onboardingReviewedBy = req.user._id;
  restaurant.onboardingReviewNotes = notes;
  restaurant.status = decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'pending';

  if (decision === 'approved') {
    restaurant.documents = restaurant.documents.map((doc) => ({
      ...doc.toObject(),
      verified: true,
      rejectionReason: null
    }));
  }

  await restaurant.save();
  res.success(response, { data: restaurant, message: `Onboarding ${decision}` });
});

export const reviewDocument = asyncHandler(async (req, response) => {
  const { verified, rejectionReason = '' } = req.body;
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  const document = restaurant.documents.id(req.params.documentId);
  if (!document) throw new AppError('Document not found', 404);

  document.verified = Boolean(verified);
  document.rejectionReason = verified ? null : rejectionReason;
  await restaurant.save();

  res.success(response, { data: restaurant, message: 'Document review updated' });
});

export const updateStatus = asyncHandler(async (req, response) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  res.success(response, { data: restaurant, message: `Status set to ${status}` });
});

export const updateCommission = asyncHandler(async (req, response) => {
  const { commissionRate } = req.body;
  if (commissionRate === undefined || commissionRate < 0 || commissionRate > 1) {
    throw new AppError('Commission rate must be between 0 and 1', 400);
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { commissionRate },
    { new: true }
  );
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  res.success(response, { data: restaurant, message: 'Commission updated' });
});

export const getMerchantRestaurant = asyncHandler(async (req, response) => {
  if (!req.user.restaurantId) {
    throw new AppError('No restaurant associated with this merchant account.', 404);
  }
  const restaurant = await Restaurant.findById(req.user.restaurantId);
  if (!restaurant) {
    throw new AppError('Associated restaurant not found.', 404);
  }
  res.success(response, { data: restaurant });
});
