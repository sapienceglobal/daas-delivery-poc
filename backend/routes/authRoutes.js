const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');

// JWT Token generation helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'DEV_MARKETPLACE_JWT_SECRET', {
    expiresIn: '7d'
  });
};

// Auth rate limiter to protect authentication endpoints from brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// Helper to set JWT token cookie with HttpOnly protection
const sendTokenCookie = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const secureCookie = process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');
  
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: secureCookie,
    sameSite: secureCookie ? 'none' : 'lax'
  };

  res.status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token, // return for backward compatibility
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        savedAddresses: user.savedAddresses,
        role: user.role,
        restaurantId: user.restaurantId
      }
    });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new marketplace user
 * @access  Public
 */
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, phone, address, role } = req.body;
  const allowedPublicRoles = ['customer', 'merchant'];

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
  }

  if (role && !allowedPublicRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid registration role.' });
  }

  // Strong Password validation (minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).' 
    });
  }

  try {
    // Check if email already registered
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email address already registered.' });
    }

    const savedAddresses = address ? [address] : [];

    // Create user instance (without setting password directly)
    const user = new User({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      savedAddresses,
      role: role || 'customer',
      password: 'placeholder_temp' // Schema needs it, setPassword will override it
    });

    // Hash password
    user.setPassword(password);

    await user.save();

    // Return user details and HttpOnly cookie
    sendTokenCookie(user, 201, res);

  } catch (error) {
    console.error('[Auth Route] Registration Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during user registration.' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and retrieve token
 * @access  Public
 */
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Verify hashed password
    const isMatch = user.validatePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.needsPasswordRehash()) {
      user.setPassword(password);
      await user.save();
    }

    // Return user details and HttpOnly cookie
    sendTokenCookie(user, 200, res);

  } catch (error) {
    console.error('[Auth Route] Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile details and their past order history
 * @access  Private
 */
router.get('/profile', protect, async (req, res) => {
  try {
    // req.user contains the user record verified by auth middleware
    const user = await User.findById(req.user._id).select('-password -salt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    // Fetch past orders sorted by newest first
    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      user,
      orders
    });
  } catch (error) {
    console.error('[Auth Route] Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error loading profile.' });
  }
});

/**
 * @route   POST /api/auth/addresses
 * @desc    Add a new saved address
 * @access  Private
 */
router.post('/addresses', protect, async (req, res) => {
  const { address } = req.body;
  if (!address || address.trim() === '') {
    return res.status(400).json({ success: false, message: 'Address is required.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Prevent exact duplicates
    if (!user.savedAddresses.includes(address.trim())) {
      user.savedAddresses.push(address.trim());
      await user.save();
    }

    res.json({ success: true, savedAddresses: user.savedAddresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding address.', error: error.message });
  }
});

/**
 * @route   PUT /api/auth/addresses/:index
 * @desc    Update a saved address at a specific index
 * @access  Private
 */
router.put('/addresses/:index', protect, async (req, res) => {
  const { address } = req.body;
  const index = parseInt(req.params.index, 10);

  if (!address || address.trim() === '') {
    return res.status(400).json({ success: false, message: 'Address is required.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (isNaN(index) || index < 0 || index >= user.savedAddresses.length) {
      return res.status(400).json({ success: false, message: 'Invalid address index.' });
    }

    user.savedAddresses[index] = address.trim();
    // Mark the array modified so Mongoose saves the change
    user.markModified('savedAddresses');
    await user.save();

    res.json({ success: true, savedAddresses: user.savedAddresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating address.', error: error.message });
  }
});

/**
 * @route   DELETE /api/auth/addresses/:index
 * @desc    Delete a saved address at a specific index
 * @access  Private
 */
router.delete('/addresses/:index', protect, async (req, res) => {
  const index = parseInt(req.params.index, 10);

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (isNaN(index) || index < 0 || index >= user.savedAddresses.length) {
      return res.status(400).json({ success: false, message: 'Invalid address index.' });
    }

    user.savedAddresses.splice(index, 1);
    await user.save();

    res.json({ success: true, savedAddresses: user.savedAddresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting address.', error: error.message });
  }
});

/**
 * @route   GET /api/auth/admin/users
 * @desc    Get all users in the database
 * @access  Private (Admin Only)
 */
router.get('/admin/users', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
  }
  try {
    const users = await User.find().select('-password -salt').sort({ role: 1, name: 1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('[Auth Admin Route] GET Users Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error loading users.' });
  }
});

/**
 * @route   PUT /api/auth/admin/users/:userId/role
 * @desc    Update a user's role and/or link their restaurantId
 * @access  Private (Admin Only)
 */
router.put('/admin/users/:userId/role', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
  }
  const { role, restaurantId } = req.body;

  if (role && !['customer', 'merchant', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role value.' });
  }

  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (role) targetUser.role = role;
    
    if (restaurantId !== undefined) {
      targetUser.restaurantId = restaurantId === '' || restaurantId === null ? null : restaurantId;
    }

    await targetUser.save();

    res.json({ 
      success: true, 
      message: 'User details updated successfully.', 
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role,
        restaurantId: targetUser.restaurantId
      } 
    });
  } catch (error) {
    console.error('[Auth Admin Route] PUT User Role Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating user role.' });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Log user out / clear cookie
 * @access  Public
 */
router.post('/logout', (req, res) => {
  const secureCookie = process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: secureCookie,
    sameSite: secureCookie ? 'none' : 'lax'
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset token
 * @access  Public
 */
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide an email address' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    await user.save();

    // Return the reset token and mock URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    console.log(`[Forgot Password] Reset URL for ${user.email}: ${resetUrl}`);

    res.status(200).json({
      success: true,
      message: 'Password reset link generated. Check console or use the token below.',
      resetToken, // Returned for sandbox testing ease
      resetUrl
    });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    res.status(500).json({ success: false, message: 'Server error during forgot password' });
  }
});

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password/:token', authLimiter, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Please provide a new password' });
  }

  // Strong Password validation (minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).' 
    });
  }

  try {
    // Hash token to compare with the DB stored hashed version
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    // Set new password
    user.setPassword(password);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('[Reset Password Error]', error);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
});

module.exports = router;
