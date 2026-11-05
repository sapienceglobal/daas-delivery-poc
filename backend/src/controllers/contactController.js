import ContactMessage from '../models/ContactMessage.js';
import Restaurant from '../models/Restaurant.js';
import { AppError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import { sendEmail } from '../services/emailService.js';

// @desc    submit a new contact message
// @route   POST /api/contact or POST /api/public/contact
// @access  Public
export const submitContactMessage = asyncHandler(async (req, res, next) => {
  // if in single-restaurant mode or restaurant ID is passed
  // we'll try to use the first active restaurant if ID not provided
  let restaurantId = req.body.restaurantId;

  if (!restaurantId) {
    let defaultRestaurant = await Restaurant.findOne({ status: 'active' });
    if (!defaultRestaurant) {
      defaultRestaurant = await Restaurant.findOne();
    }
    if (!defaultRestaurant) {
      return next(new AppError('No active restaurant found', 404));
    }
    restaurantId = defaultRestaurant._id;
  }

  const { name, email, phone, inquiryType, subject, message } = req.body;

  if (!name || !email || !message) {
    return next(new AppError('Name, email, and message are required', 400));
  }

  const contactMessage = await ContactMessage.create({
    restaurant: restaurantId,
    name,
    email,
    phone: phone || null,
    inquiryType: inquiryType || 'general',
    subject: subject || 'General Inquiry',
    message
  });

  logger.info(`New contact message received from ${email} for restaurant ${restaurantId}`);

  // Optional asynchronous notification to restaurant email if available
  try {
    const restaurant = await Restaurant.findById(restaurantId).select('email name');
    const notifyEmail = restaurant?.email || process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
    if (notifyEmail) {
      sendEmail({
        to: notifyEmail,
        subject: `[Contact Form] ${subject || 'New Message'} from ${name}`,
        text: `New contact inquiry received:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nType: ${inquiryType || 'general'}\nSubject: ${subject}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #7a0b10; margin-top: 0;">New Contact Form Message</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Inquiry Type:</strong> ${inquiryType || 'general'}</p>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            <div style="margin-top: 15px; padding: 12px; background: #faf9f8; border-left: 4px solid #7a0b10; border-radius: 4px;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        `
      }).catch(err => logger.warn(`Failed to send contact notification email: ${err.message}`));
    }
  } catch (err) {
    logger.warn(`Error dispatching contact email: ${err.message}`);
  }

  res.status(201).json({
    success: true,
    message: 'Your message has been received successfully',
    data: contactMessage
  });
});

// @desc    get all contact messages for the logged-in merchant
// @route   GET /api/contact/merchant/messages
// @access  Private (Merchant/Admin)
export const getMerchantMessages = asyncHandler(async (req, res, next) => {
  const restaurantId = req.user.restaurantId || req.query.restaurantId;

  if (!restaurantId && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to access messages without a restaurant', 403));
  }

  const query = restaurantId ? { restaurant: restaurantId } : {};

  // optional filtering by status
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

// @desc    update a contact message status
// @route   PATCH /api/contact/merchant/messages/:id
// @access  Private (Merchant/Admin)
export const updateMessageStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['new', 'read', 'replied'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const message = await ContactMessage.findById(id);

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  // check permission if merchant
  if (req.user.role === 'merchant' && message.restaurant.toString() !== req.user.restaurantId.toString()) {
    return next(new AppError('Not authorized to update this message', 403));
  }

  message.status = status;
  await message.save();

  res.status(200).json({
    success: true,
    data: message
  });
});
