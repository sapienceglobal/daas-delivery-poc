import Reservation from '../models/Reservation.js';
import Restaurant from '../models/Restaurant.js';

// @desc    Create a new reservation
// @route   POST /api/reservations
// @access  Public / Private (if userId provided)
export const createReservation = async (req, res) => {
  try {
    const { 
      restaurantId, 
      customerName, 
      customerPhone, 
      customerEmail, 
      date, 
      time, 
      partySize, 
      location, 
      occasion, 
      specialRequests 
    } = req.body;

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const reservationData = {
      restaurantId,
      customerName,
      customerPhone,
      customerEmail,
      date,
      time,
      partySize,
      location: location || 'Any',
      occasion,
      specialRequests,
      status: 'pending', // Starts as pending, can be auto-confirmed based on restaurant settings in the future
      userId: req.user ? req.user._id : null // If logged in, attach to user
    };

    const reservation = await Reservation.create(reservationData);

    res.status(201).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get user's reservations
// @route   GET /api/reservations/my-reservations
// @access  Private (Customer)
export const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user._id })
      .populate('restaurantId', 'name address phone')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get restaurant's reservations
// @route   GET /api/reservations/restaurant/:restaurantId
// @access  Private (Merchant/Admin)
export const getRestaurantReservations = async (req, res) => {
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
      if (restaurant.merchantId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view these reservations' });
      }
    }

    const reservations = await Reservation.find({ restaurantId: restaurant._id })
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update reservation status
// @route   PUT /api/reservations/:id/status
// @access  Private (Merchant/Admin)
export const updateReservationStatus = async (req, res) => {
  try {
    const { status, tableId } = req.body;
    let reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Verify ownership
    if (req.user.role === 'merchant') {
      const restaurant = await Restaurant.findById(reservation.restaurantId);
      if (restaurant.merchantId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this reservation' });
      }
    }

    if (status) reservation.status = status;
    if (tableId) reservation.tableId = tableId;

    await reservation.save();

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
