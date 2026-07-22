import CateringInquiry from '../models/CateringInquiry.js';
import Restaurant from '../models/Restaurant.js';

// @desc    Submit a new catering inquiry
// @route   POST /api/catering
// @access  Public
export const createInquiry = async (req, res) => {
  try {
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

    // Verify restaurant exists
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

    res.status(201).json({
      success: true,
      data: inquiry,
      message: 'Catering inquiry submitted successfully. We will contact you soon.'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get restaurant's catering inquiries
// @route   GET /api/catering/restaurant/:restaurantId
// @access  Private (Merchant/Admin)
export const getRestaurantInquiries = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Resolve restaurant by slug or ObjectId
    let restaurant;
    if (restaurantId.match(/^[0-9a-fA-F]{24}$/)) {
      restaurant = await Restaurant.findById(restaurantId);
    } else {
      restaurant = await Restaurant.findOne({ slug: restaurantId });
    }

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Auth check: Merchant must own this restaurant
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

// @desc    Update inquiry status
// @route   PUT /api/catering/:id/status
// @access  Private (Merchant/Admin)
export const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let inquiry = await CateringInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    // Verify ownership
    if (req.user.role === 'merchant') {
      const restaurant = await Restaurant.findById(inquiry.restaurantId);
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
