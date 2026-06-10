const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Role authorization helper middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges.' });
    }
    next();
  };
};

// Distance calculation helper (Haversine formula in miles)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * @route   GET /api/restaurants
 * @desc    Get approved restaurants (sorted by proximity if lat/lng are provided)
 * @access  Public
 */
router.get('/', async (req, res) => {
  const { lat, lng } = req.query;

  try {
    let restaurants;

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ success: false, message: 'Invalid latitude or longitude.' });
      }

      // Query MongoDB using $near index sorting
      restaurants = await Restaurant.find({
        status: 'approved',
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude] // [lng, lat] for GeoJSON
            }
          }
        }
      }).select('-menu');

      // Map restaurants to compute exact distance in miles and update deliveryTime
      restaurants = restaurants.map(rest => {
        const restJson = rest.toJSON();
        if (rest.location && rest.location.coordinates) {
          const [restLng, restLat] = rest.location.coordinates;
          const distMiles = calculateDistance(latitude, longitude, restLat, restLng);
          
          restJson.distance = `${distMiles.toFixed(1)} miles`;
          
          // Estimate prep & travel times (15 mins base prep + 5 mins per mile)
          const basePrep = 15;
          const travel = Math.round(distMiles * 5);
          restJson.deliveryTime = `${basePrep + travel}-${basePrep + travel + 10} min`;
        }
        return restJson;
      }).filter(rest => {
        // Only return restaurants within a realistic 10-mile delivery service radius
        if (rest.distance) {
          const distMiles = parseFloat(rest.distance);
          return distMiles <= 10.0;
        }
        return true;
      });

    } else {
      // Return standard approved list if coordinates are not provided
      restaurants = await Restaurant.find({ status: 'approved' }).select('-menu');
    }

    res.json({ success: true, count: restaurants.length, restaurants });
  } catch (error) {
    console.error('[Restaurant Route] GET List Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error loading restaurants list.', error: error.message });
  }
});

/**
 * @route   GET /api/restaurants/admin/all
 * @desc    Get all restaurants regardless of approval status
 * @access  Private (Admin Only)
 */
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const restaurants = await Restaurant.find().select('-menu');
    res.json({ success: true, count: restaurants.length, restaurants });
  } catch (error) {
    console.error('[Restaurant Route] Admin Get All Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error loading all restaurants.' });
  }
});

/**
 * @route   GET /api/restaurants/merchant/my
 * @desc    Get logged-in merchant's restaurant profile
 * @access  Private (Merchant Only)
 */
router.get('/merchant/my', protect, authorize('merchant'), async (req, res) => {
  try {
    if (!req.user.restaurantId) {
      return res.status(404).json({ success: false, message: 'No restaurant associated with this merchant account.' });
    }
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Associated restaurant not found.' });
    }
    res.json({ success: true, restaurant });
  } catch (error) {
    console.error('[Restaurant Route] Merchant Get My Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error loading merchant profile.' });
  }
});

/**
 * @route   POST /api/restaurants
 * @desc    Register a new restaurant (status pending)
 * @access  Private (Merchant/Admin)
 */
router.post('/', protect, authorize('merchant', 'admin'), async (req, res) => {
  const { name, cuisine, address, phone, banner, menu, coordinates } = req.body;

  if (!name || !cuisine || !address || !phone || !banner) {
    return res.status(400).json({ success: false, message: 'Please provide name, cuisine, address, phone, and banner URL.' });
  }

  try {
    // Determine coordinates (default to center of SF if not provided or geocoding is handled client-side)
    let lngVal = -122.4194;
    let latVal = 37.7749;

    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      lngVal = parseFloat(coordinates[0]);
      latVal = parseFloat(coordinates[1]);
    }

    const restaurant = new Restaurant({
      name,
      cuisine,
      address,
      phone,
      banner,
      location: {
        type: 'Point',
        coordinates: [lngVal, latVal]
      },
      status: req.user.role === 'admin' ? 'approved' : 'pending', // Auto-approved if created by admin
      ownerId: req.user._id,
      menu: menu || [
        { name: 'Classic Combo Meal', description: 'Includes main course dish, standard side, and fountain drink.', price: 10.99, category: 'Mains' },
        { name: 'French Fries', description: 'Freshly cut salted potato strips fried to golden crisp.', price: 3.99, category: 'Sides' },
        { name: 'Soft Drink', description: 'Ice cold carbonated soda.', price: 1.99, category: 'Drinks' }
      ]
    });

    await restaurant.save();

    // Link this restaurant to the merchant user
    req.user.restaurantId = restaurant._id;
    await User.findByIdAndUpdate(req.user._id, { restaurantId: restaurant._id });

    res.status(201).json({
      success: true,
      message: req.user.role === 'admin' ? 'Restaurant registered and approved.' : 'Restaurant registered successfully. Pending Admin approval.',
      restaurant
    });

  } catch (error) {
    console.error('[Restaurant Route] POST Create Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error registering restaurant.', error: error.message });
  }
});

/**
 * @route   PUT /api/restaurants/:id/status
 * @desc    Approve or reject a restaurant
 * @access  Private (Admin Only)
 */
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  const { status } = req.body;

  if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid status (approved, rejected, pending).' });
  }

  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    restaurant.status = status;
    await restaurant.save();

    // If approved, verify the owner user exists and set their role to merchant automatically
    if (status === 'approved' && restaurant.ownerId) {
      await User.findByIdAndUpdate(restaurant.ownerId, { 
        role: 'merchant',
        restaurantId: restaurant._id
      });
    }

    res.json({ success: true, message: `Restaurant status updated to: ${status}`, restaurant });
  } catch (error) {
    console.error('[Restaurant Route] PUT Status Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating restaurant status.' });
  }
});

/**
 * @route   GET /api/restaurants/:id
 * @desc    Get restaurant details including full menu
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }
    res.json({ success: true, restaurant });
  } catch (error) {
    console.error('[Restaurant Route] GET Single Error:', error.message);
    res.status(500).json({ success: false, message: 'Invalid restaurant ID or server error.' });
  }
});

/**
 * @route   POST /api/restaurants/:id/menu
 * @desc    Add a menu item to a restaurant
 * @access  Private (Merchant owner or Admin)
 */
router.post('/:id/menu', protect, authorize('merchant', 'admin'), async (req, res) => {
  const { name, description, price, category } = req.body;

  if (!name || !description || price === undefined || !category) {
    return res.status(400).json({ success: false, message: 'Please provide name, description, price, and category.' });
  }

  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && (!restaurant.ownerId || restaurant.ownerId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this restaurant.' });
    }

    restaurant.menu.push({ name, description, price: parseFloat(price), category });
    await restaurant.save();

    res.status(201).json({ success: true, message: 'Menu item added successfully.', restaurant });
  } catch (error) {
    console.error('[Restaurant Route] POST Menu Item Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error adding menu item.' });
  }
});

/**
 * @route   PUT /api/restaurants/:id/menu/:itemId
 * @desc    Update a menu item
 * @access  Private (Merchant owner or Admin)
 */
router.put('/:id/menu/:itemId', protect, authorize('merchant', 'admin'), async (req, res) => {
  const { name, description, price, category, isAvailable } = req.body;

  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && (!restaurant.ownerId || restaurant.ownerId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this restaurant.' });
    }

    const menuItem = restaurant.menu.id(req.params.itemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    if (name !== undefined) menuItem.name = name;
    if (description !== undefined) menuItem.description = description;
    if (price !== undefined) menuItem.price = parseFloat(price);
    if (category !== undefined) menuItem.category = category;
    if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

    await restaurant.save();
    res.json({ success: true, message: 'Menu item updated successfully.', restaurant });
  } catch (error) {
    console.error('[Restaurant Route] PUT Menu Item Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating menu item.' });
  }
});

/**
 * @route   DELETE /api/restaurants/:id/menu/:itemId
 * @desc    Delete a menu item
 * @access  Private (Merchant owner or Admin)
 */
router.delete('/:id/menu/:itemId', protect, authorize('merchant', 'admin'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && (!restaurant.ownerId || restaurant.ownerId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this restaurant.' });
    }

    const menuItem = restaurant.menu.id(req.params.itemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    restaurant.menu.pull(req.params.itemId);
    await restaurant.save();

    res.json({ success: true, message: 'Menu item deleted successfully.', restaurant });
  } catch (error) {
    console.error('[Restaurant Route] DELETE Menu Item Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting menu item.' });
  }
});

/**
 * @route   PUT /api/restaurants/:id
 * @desc    Update restaurant details (including hours)
 * @access  Private (Merchant owner or Admin)
 */
router.put('/:id', protect, authorize('merchant', 'admin'), async (req, res) => {
  const { name, cuisine, address, phone, banner, openTime, closeTime } = req.body;

  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && (!restaurant.ownerId || restaurant.ownerId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this restaurant.' });
    }

    if (name !== undefined) restaurant.name = name;
    if (cuisine !== undefined) restaurant.cuisine = cuisine;
    if (address !== undefined) restaurant.address = address;
    if (phone !== undefined) restaurant.phone = phone;
    if (banner !== undefined) restaurant.banner = banner;
    if (openTime !== undefined) restaurant.openTime = openTime;
    if (closeTime !== undefined) restaurant.closeTime = closeTime;

    await restaurant.save();
    res.json({ success: true, message: 'Restaurant details updated successfully.', restaurant });
  } catch (error) {
    console.error('[Restaurant Route] PUT Update Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating restaurant details.' });
  }
});

module.exports = router;
