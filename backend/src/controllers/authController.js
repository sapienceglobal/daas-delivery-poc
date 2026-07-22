import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'DEV_MARKETPLACE_JWT_SECRET'; // Falls back only in dev; auth.js already logs warning

// ── Helpers ─────────────────────────────────────────────────────────────────

export const canManageRestaurant = (user, restaurantId) => {
  if (user?.role === 'admin') return true;
  return user?.restaurantId?.toString() === restaurantId?.toString();
};

export const ensureCanManageRestaurant = (reqOrUser, restaurantId) => {
  const user = reqOrUser.user || reqOrUser;
  if (!canManageRestaurant(user, restaurantId)) {
    throw new AppError('You can only manage resources for your own restaurant', 403);
  }
};

const generateToken = (id, tenantId = 'marketplace') => jwt.sign({ id, tenantId }, JWT_SECRET, { expiresIn: '7d' });

const sendTokenCookie = (user, statusCode, response, tenantId = 'marketplace', rememberMe = true) => {
  const token = generateToken(user._id, tenantId);
  const secureCookie = process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');
  const body = {
    success: true,
    user: user.toSafeJSON()
  };

  if (process.env.RETURN_AUTH_TOKEN === 'true' || process.env.NODE_ENV !== 'production') {
    body.token = token;
  }

  const cookieOptions = {
    httpOnly: true,
    secure: secureCookie,
    sameSite: secureCookie ? 'none' : 'lax',
    path: '/'
  };

  // Industry Standard: If rememberMe is checked, persist the cookie (e.g. 30 days).
  // If not checked, omit 'expires' so it becomes a Session Cookie that deletes on browser close.
  if (rememberMe) {
    cookieOptions.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  response
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json(body);
};

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ── Controllers ─────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, response) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Please provide name, email, and password.', 400);
  }

  const allowedRoles = ['customer', 'merchant'];
  if (role && !allowedRoles.includes(role)) {
    throw new AppError('Invalid registration role.', 400);
  }

  if (!PASSWORD_REGEX.test(password)) {
    throw new AppError(
      'Password must be at least 8 characters with one uppercase, one lowercase, one number, and one special character (@$!%*?&).',
      400
    );
  }

  const tenantId = req.tenantId || 'marketplace';
  const UserModel = req.getModel('User');

  const existing = await UserModel.findOne({ email });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const user = new UserModel({ name, email, phone: phone || '', role: role || 'customer', password: 'temp' });
  user.setPassword(password);

  if (phone) {
    user.savedAddresses = [];
  }
  
  // Generate random 6-character referral code
  user.referralCode = crypto.randomBytes(3).toString('hex').toUpperCase();

  await user.save();

  // Fire-and-forget welcome email
  sendWelcomeEmail(email, name).catch(e => logger.warn('Welcome email failed', { error: e.message }));

  sendTokenCookie(user, 201, response, tenantId);
});

export const login = asyncHandler(async (req, response) => {
  const { email, password, rememberMe = true } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password.', 400);
  }

  const tenantId = req.tenantId || 'marketplace';
  const UserModel = req.getModel('User');

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  // H5: Account lockout after 5 failed attempts (15-minute cooldown)
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
    const minsLeft = Math.ceil((user.loginLockedUntil - Date.now()) / 60000);
    throw new AppError(`Account temporarily locked. Try again in ${minsLeft} minute(s).`, 429);
  }

  if (!user.validatePassword(password)) {
    // Increment failed attempts
    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    const updateData = { failedLoginAttempts: failedAttempts };
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      updateData.loginLockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      updateData.failedLoginAttempts = 0; // Reset counter after locking
      logger.warn('Account locked due to too many failed login attempts', { email });
    }
    await UserModel.updateOne({ _id: user._id }, { $set: updateData });
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 403);
  }

  // Successful login — reset failed attempts
  user.failedLoginAttempts = 0;
  user.loginLockedUntil = null;

  // Transparently upgrade old password hashes
  if (user.needsPasswordRehash()) {
    user.setPassword(password);
  }

  user.lastLogin = new Date();
  await user.save();

  sendTokenCookie(user, 200, response, tenantId, rememberMe);
});

export const googleLogin = asyncHandler(async (req, response) => {
  const { credential, role } = req.body;
  if (!credential) throw new AppError('Google token is missing.', 400);

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google login is not configured on the server yet.', 500);
  }

  const tenantId = req.tenantId || 'marketplace';
  const UserModel = req.getModel('User');

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  const { email, name, sub: googleId, picture } = payload;

  let user = await UserModel.findOne({ email });

  if (!user) {
    const allowedRoles = ['customer', 'merchant'];
    const finalRole = allowedRoles.includes(role) ? role : 'customer';

    user = new UserModel({
      name,
      email,
      role: finalRole,
      avatar: picture,
      socialLogin: { googleId },
      isVerified: true
    });
    // Create random robust password for DB constraint if needed
    user.setPassword(crypto.randomBytes(20).toString('hex'));
    await user.save();
    
    sendWelcomeEmail(email, name).catch(e => logger.warn('Welcome email failed', { error: e.message }));
  } else {
    // Link google ID if not linked
    if (!user.socialLogin.googleId) {
      user.socialLogin.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 403);
  }

  user.lastLogin = new Date();
  await user.save();

  sendTokenCookie(user, 200, response, tenantId);
});

export const logout = asyncHandler(async (req, response) => {
  const secureCookie = process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');

  response
    .cookie('token', '', { 
      httpOnly: true, 
      secure: secureCookie,
      sameSite: secureCookie ? 'none' : 'lax',
      expires: new Date(0),
      path: '/'
    })
    .json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req, response) => {
  const user = await req.getModel('User')
    .findById(req.user._id)
    .populate('favoriteRestaurants', 'name cuisine banner rating reviewCount deliveryTime deliveryFee distance')
    .populate('favoriteItems', 'name description price image type');
  
  if (!user) throw new AppError('User not found', 404);
  
  // Ensure referral code exists for old users
  if (!user.referralCode) {
    user.referralCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    await user.save();
  }
  
  res.success(response, { data: user.toSafeJSON() });
});

export const updateProfile = asyncHandler(async (req, response) => {
  const allowed = ['name', 'phone', 'avatar', 'notificationPreferences'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await req.getModel('User').findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  });

  res.success(response, { data: user.toSafeJSON(), message: 'Profile updated' });
});

export const changePassword = asyncHandler(async (req, response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current and new password.', 400);
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    throw new AppError('New password does not meet complexity requirements.', 400);
  }

  const user = await req.getModel('User').findById(req.user._id);
  if (!user.validatePassword(currentPassword)) {
    throw new AppError('Current password is incorrect.', 401);
  }

  user.setPassword(newPassword);
  await user.save();

  res.success(response, { message: 'Password changed successfully' });
});

export const forgotPassword = asyncHandler(async (req, response) => {
  const { email } = req.body;
  if (!email) throw new AppError('Please provide your email address.', 400);

  const user = await req.getModel('User').findOne({ email });
  // Always respond 200 to avoid email enumeration
  if (!user) {
    return res.success(response, { message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  await sendPasswordResetEmail(email, resetUrl, user.name);

  res.success(response, { message: 'If that email exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, response) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await req.getModel('User').findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) throw new AppError('Invalid or expired reset token.', 400);

  const { password } = req.body;
  if (!password || !PASSWORD_REGEX.test(password)) {
    throw new AppError('Password does not meet complexity requirements.', 400);
  }

  user.setPassword(password);
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save();

  const tenantId = req.tenantId || 'marketplace';
  sendTokenCookie(user, 200, response, tenantId);
});

// ── Addresses ───────────────────────────────────────────────────────────────

export const addAddress = asyncHandler(async (req, response) => {
  const { label, address, lat, lng, isDefault } = req.body;
  if (!address) throw new AppError('Address is required.', 400);

  const user = await req.getModel('User').findById(req.user._id);

  if (isDefault) {
    user.savedAddresses.forEach(a => { a.isDefault = false; });
  }

  user.savedAddresses.push({ label: label || 'Home', address, lat, lng, isDefault: !!isDefault });
  await user.save();

  res.success(response, { data: user.savedAddresses, message: 'Address added' });
});

export const removeAddress = asyncHandler(async (req, response) => {
  const user = await req.getModel('User').findById(req.user._id);
  user.savedAddresses = user.savedAddresses.filter(
    a => a._id.toString() !== req.params.addressId
  );
  
  // If we removed the default address, make the first one default (if any)
  if (user.savedAddresses.length > 0 && !user.savedAddresses.some(a => a.isDefault)) {
    user.savedAddresses[0].isDefault = true;
  }
  
  await user.save();

  res.success(response, { data: user.savedAddresses, message: 'Address removed' });
});

export const editAddress = asyncHandler(async (req, response) => {
  const { label, address, lat, lng, isDefault } = req.body;
  const user = await req.getModel('User').findById(req.user._id);
  
  const addr = user.savedAddresses.id(req.params.addressId);
  if (!addr) throw new AppError('Address not found', 404);

  if (isDefault) {
    user.savedAddresses.forEach(a => { a.isDefault = false; });
  }

  if (label !== undefined) addr.label = label;
  if (address !== undefined) addr.address = address;
  if (lat !== undefined) addr.lat = lat;
  if (lng !== undefined) addr.lng = lng;
  if (isDefault !== undefined) addr.isDefault = isDefault;

  await user.save();
  res.success(response, { data: user.savedAddresses, message: 'Address updated' });
});

export const setDefaultAddress = asyncHandler(async (req, response) => {
  const user = await req.getModel('User').findById(req.user._id);
  
  const addr = user.savedAddresses.id(req.params.addressId);
  if (!addr) throw new AppError('Address not found', 404);

  user.savedAddresses.forEach(a => { a.isDefault = false; });
  addr.isDefault = true;

  await user.save();
  res.success(response, { data: user.savedAddresses, message: 'Default address set' });
});

// ── Payments ────────────────────────────────────────────────────────────────

export const addCard = asyncHandler(async (req, response) => {
  const { cardId, brand, last4, expMonth, expYear, isDefault } = req.body;
  if (!cardId || !brand || !last4) throw new AppError('Card details missing.', 400);

  const user = await req.getModel('User').findById(req.user._id);

  if (isDefault || user.savedCards.length === 0) {
    user.savedCards.forEach(c => { c.isDefault = false; });
  }

  user.savedCards.push({ 
    cardId, brand, last4, expMonth, expYear, 
    isDefault: isDefault || user.savedCards.length === 0 
  });
  
  await user.save();
  res.success(response, { data: user.savedCards, message: 'Card saved successfully' });
});

export const removeCard = asyncHandler(async (req, response) => {
  const user = await req.getModel('User').findById(req.user._id);
  user.savedCards = user.savedCards.filter(
    c => c._id.toString() !== req.params.cardId
  );
  
  // Reset default if needed
  if (user.savedCards.length > 0 && !user.savedCards.some(c => c.isDefault)) {
    user.savedCards[0].isDefault = true;
  }
  
  await user.save();
  res.success(response, { data: user.savedCards, message: 'Card removed' });
});

export const setDefaultCard = asyncHandler(async (req, response) => {
  const user = await req.getModel('User').findById(req.user._id);
  
  const card = user.savedCards.id(req.params.cardId);
  if (!card) throw new AppError('Card not found', 404);

  user.savedCards.forEach(c => { c.isDefault = false; });
  card.isDefault = true;

  await user.save();
  res.success(response, { data: user.savedCards, message: 'Default card set' });
});

// ── Saved Cart ──────────────────────────────────────────────────────────────

const sanitizeSavedCart = ({ items = [], restaurant = null, tenantId = 'marketplace' }) => {
  const safeItems = Array.isArray(items)
    ? items.slice(0, 100).map((item) => {
        const quantity = Math.max(1, Math.min(99, parseInt(item.quantity || item.qty, 10) || 1));
        const price = Math.max(0, Number(item.price) || 0);
        const addOns = Array.isArray(item.addOns) ? item.addOns.slice(0, 25) : [];
        const addOnTotal = addOns.reduce((sum, addOn) => sum + (Number(addOn.price) || 0), 0);
        return {
          menuItemId: String(item.menuItemId || item._id || item.id || ''),
          name: String(item.name || '').slice(0, 160),
          price,
          image: item.image ? String(item.image).slice(0, 1000) : null,
          quantity,
          qty: quantity,
          selectedSize: item.selectedSize || null,
          addOns,
          specialInstructions: String(item.specialInstructions || '').slice(0, 500),
          lineTotal: Math.round((price + addOnTotal) * quantity * 100) / 100
        };
      }).filter((item) => item.menuItemId && item.name)
    : [];

  return {
    tenantId: String(tenantId || 'marketplace').slice(0, 80),
    restaurant: restaurant ? {
      _id: restaurant._id ? String(restaurant._id) : null,
      name: restaurant.name ? String(restaurant.name).slice(0, 160) : '',
      address: restaurant.address ? String(restaurant.address).slice(0, 500) : '',
      phone: restaurant.phone ? String(restaurant.phone).slice(0, 40) : '',
      deliveryFee: Number(restaurant.deliveryFee) || 0,
      taxRate: restaurant.taxRate === null || restaurant.taxRate === undefined ? null : Number(restaurant.taxRate)
    } : null,
    items: safeItems,
    updatedAt: new Date()
  };
};

export const getSavedCart = asyncHandler(async (req, response) => {
  const user = await req.getModel('User').findById(req.user._id).select('savedCart');
  if (!user) throw new AppError('User not found', 404);
  res.success(response, {
    data: user.savedCart || { items: [], restaurant: null, updatedAt: null }
  });
});

export const updateSavedCart = asyncHandler(async (req, response) => {
  const tenantId = req.tenantId || 'marketplace';
  const savedCart = sanitizeSavedCart({ ...req.body, tenantId });
  const user = await req.getModel('User').findByIdAndUpdate(
    req.user._id,
    { savedCart },
    { new: true, runValidators: true }
  ).select('savedCart');
  if (!user) throw new AppError('User not found', 404);
  res.success(response, { data: user.savedCart, message: 'Cart saved' });
});

export const clearSavedCart = asyncHandler(async (req, response) => {
  const tenantId = req.tenantId || 'marketplace';
  const user = await req.getModel('User').findByIdAndUpdate(
    req.user._id,
    { savedCart: { tenantId, restaurant: null, items: [], updatedAt: new Date() } },
    { new: true }
  ).select('savedCart');
  if (!user) throw new AppError('User not found', 404);
  res.success(response, { data: user.savedCart, message: 'Cart cleared' });
});

// ── Favorites ───────────────────────────────────────────────────────────────

export const toggleFavoriteRestaurant = asyncHandler(async (req, response) => {
  const user = await req.getModel('User').findById(req.user._id);
  const id = req.params.restaurantId;
  const index = user.favoriteRestaurants.findIndex(r => r.toString() === id);

  if (index > -1) {
    user.favoriteRestaurants.splice(index, 1);
  } else {
    user.favoriteRestaurants.push(id);
  }
  await user.save();

  res.success(response, {
    data: user.favoriteRestaurants,
    message: index > -1 ? 'Removed from favorites' : 'Added to favorites'
  });
});

export const toggleFavoriteItem = asyncHandler(async (req, response) => {
  const user = await req.getModel('User').findById(req.user._id);
  const id = req.params.itemId;
  const index = user.favoriteItems.findIndex(i => i.toString() === id);

  if (index > -1) {
    user.favoriteItems.splice(index, 1);
  } else {
    user.favoriteItems.push(id);
  }
  await user.save();

  res.success(response, {
    data: user.favoriteItems,
    message: index > -1 ? 'Removed from favorites' : 'Added to favorites'
  });
});
