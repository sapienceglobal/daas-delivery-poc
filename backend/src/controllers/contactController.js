import ContactMessage from '../models/ContactMessage.js';
import Restaurant from '../models/Restaurant.js';
import { AppError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

// @desc    Submit a new contact message
// @route   POST /api/public/contact
// @access  Public
export const submitContactMessage = asyncHandler(async (req, res, next) => {
  // If in single-restaurant mode or restaurant ID is passed
  // We'll try to use the first active restaurant if ID not provided
  let restaurantId = req.body.restaurantId;

  if (!restaurantId) {
    const defaultRestaurant = await Restaurant.findOne({ status: 'active' });
    if (!defaultRestaurant) {
      return next(new AppError('No active restaurant found', 404));
    }
    restaurantId = defaultRestaurant._id;
  }

  const { name, email, subject, message } = req.body;

  const contactMessage = await ContactMessage.create({
    restaurant: restaurantId,
    name,
    email,
    subject,
    message
  });

  logger.info(`New contact message received from ${email} for restaurant ${restaurantId}`);

  res.status(201).json({
    success: true,
    data: contactMessage
  });
});

// @desc    Get all contact messages for the logged-in merchant
// @route   GET /api/merchant/messages
// @access  Private (Merchant/Admin)
export const getMerchantMessages = asyncHandler(async (req, res, next) => {
  const restaurantId = req.user.restaurantId || req.query.restaurantId;
  
  if (!restaurantId && req.user.role !== 'admin') {
     return next(new AppError('Not authorized to access messages without a restaurant', 403));
  }

  const query = restaurantId ? { restaurant: restaurantId } : {};

  // Optional filtering by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  const messages = await ContactMessage.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Update a contact message status
// @route   PATCH /api/merchant/messages/:id
// @access  Private (Merchant/Admin)
export const updateMessageStatus = asyncHandler(async (req, res, next) => {
  let message = await ContactMessage.findById(req.params.id);

  if (!message) {
    return next(new AppError(`No message found with ID ${req.params.id}`, 404));
  }

  // Ensure user owns this restaurant's messages (unless admin)
  if (req.user.role !== 'admin' && message.restaurant.toString() !== req.user.restaurantId.toString()) {
    return next(new AppError('Not authorized to update this message', 403));
  }

  message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: message
  });
});
