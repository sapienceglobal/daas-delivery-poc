import CateringInquiry from '../models/CateringInquiry.js';
import Restaurant from '../models/Restaurant.js';
import { createNotification } from './notificationController.js';
import { sendPushNotification } from '../services/webPushService.js';

const getModels = (req) => ({
  CateringInquiry: req.getModel?.('CateringInquiry') || CateringInquiry,
  Restaurant: req.getModel?.('Restaurant') || Restaurant,
});

// @desc    submit a new catering inquiry
// @route   POST /api/catering
// @access  Public
export const createInquiry = async (req, res) => {
  try {
    const { CateringInquiry, Restaurant } = getModels(req);
    const {
      restaurantId,
      customerName,
      customerEmail,
      customerPhone,
      eventType,
      eventDate,
      guestCount,
      packagePreference,
      additionalNotes
    } = req.body;

    // verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const inquiry = await CateringInquiry.create({
      restaurantId,
      customerName,
      customerEmail,
      customerPhone,
      eventType,
      eventDate,
      guestCount,
      packagePreference: packagePreference || 'Custom / Unsure',
      additionalNotes
    });

    // -- Background Notifications --
    try {
      const io = req.app?.get('io');
      const User = req.getModel?.('User') || (await import('../models/User.js')).default;
      const merchantUsers = await User.find({
        role: 'merchant',
        'managedRestaurants.restaurantId': restaurant._id
      });
      
      const imageUrl = 'https://res.cloudinary.com/h2cylj8r/image/upload/v1787569372/restaurant-platform/notifications/ouwuhg99wjuxrfzksswe.png';
      
      for (const mUser of merchantUsers) {
        await createNotification(
          mUser._id,
          'New Catering Inquiry',
          `${customerName} inquired for a ${eventType} event for ${guestCount} guests.`,
          'catering_new',
          `/merchant/catering/${inquiry._id}`,
          io,
          req.getModel,
          imageUrl,
          { entityType: 'catering', entityId: inquiry._id.toString() }
        );
      }

      await sendPushNotification(restaurant, {
        title: 'New Catering Inquiry',
        body: `${customerName} inquired for a ${eventType} event for ${guestCount} guests.`,
        data: { url: `/merchant/catering/${inquiry._id}` }
      });
    } catch (notifErr) {
      console.error('Error sending background notifications for catering:', notifErr);
    }

    res.status(201).json({
      success: true,
      data: inquiry,
      message: 'Catering inquiry submitted successfully. We will contact you soon.'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    get restaurant's catering inquiries
// @route   GET /api/catering/restaurant/:restaurantId
// @access  Private (Merchant/Admin)
export const getRestaurantInquiries = async (req, res) => {
  try {
    const { CateringInquiry, Restaurant } = getModels(req);
    const { restaurantId } = req.params;

    // resolve restaurant by slug or ObjectId
    let restaurant;
    if (restaurantId.match(/^[0-9a-fA-F]{24}$/)) {
      restaurant = await Restaurant.findById(restaurantId);
    } else {
      restaurant = await Restaurant.findOne({ slug: restaurantId });
    }

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // auth check: Merchant must own this restaurant
    if (req.user.role === 'merchant') {
      if (restaurant.ownerId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view these inquiries' });
      }
    }

    const inquiries = await CateringInquiry.find({ restaurantId: restaurant._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    update inquiry status
// @route   PUT /api/catering/:id/status
// @access  Private (Merchant/Admin)
export const updateInquiryStatus = async (req, res) => {
  try {
    const { CateringInquiry, Restaurant } = getModels(req);
    const { status } = req.body;
    let inquiry = await CateringInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    // verify ownership
    if (req.user.role === 'merchant') {
      const restaurant = await Restaurant.findById(inquiry.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }
      if (restaurant.ownerId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this inquiry' });
      }
    }

    inquiry.status = status;
    await inquiry.save();

    res.status(200).json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
