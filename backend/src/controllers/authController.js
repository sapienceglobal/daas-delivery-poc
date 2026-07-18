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

const JWT_SECRET = process.env.JWT_SECRET || 'DEV_MARKETPLACE_JWT_SECRET';

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

const sendTokenCookie = (user, statusCode, response, tenantId = 'marketplace') => {
  const token = generateToken(user._id, tenantId);
  const secureCookie = process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');

  response
    .status(statusCode)
    .cookie('token', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: secureCookie,
      sameSite: secureCookie ? 'none' : 'lax'
    })
    .json({
      success: true,
      token,
      user: user.toSafeJSON()
    });
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

  const tenantId = req.headers['x-tenant-id'] || 'marketplace';
  const UserModel = req.getModel('User');

  const existing = await UserModel.findOne({ email });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const user = new UserModel({ name, email, phone: phone || '', role: role || 'customer', password: 'temp' });
  user.setPassword(password);

  if (phone) {
    user.savedAddresses = [];
  }

  await user.save();

  // Fire-and-forget welcome email
  sendWelcomeEmail(email, name).catch(e => logger.warn('Welcome email failed', { error: e.message }));

  sendTokenCookie(user, 201, response, tenantId);
});

export const login = asyncHandler(async (req, response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password.', 400);
  }

  const tenantId = req.headers['x-tenant-id'] || 'marketplace';
  const UserModel = req.getModel('User');

  const user = await UserModel.findOne({ email });
  if (!user || !user.validatePassword(password)) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 403);
  }

  // Transparently upgrade old password hashes
  if (user.needsPasswordRehash()) {
    user.setPassword(password);
    await user.save();
  }

  user.lastLogin = new Date();
  await user.save();

  sendTokenCookie(user, 200, response, tenantId);
});

export const googleLogin = asyncHandler(async (req, response) => {
  const { credential, role } = req.body;
  if (!credential) throw new AppError('Google token is missing.', 400);

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google login is not configured on the server yet.', 500);
  }

  const tenantId = req.headers['x-tenant-id'] || 'marketplace';
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
  response
    .cookie('token', '', { httpOnly: true, expires: new Date(0) })
    .json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req, response) => {
  const user = await req.getModel('User').findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);
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

  const tenantId = req.headers['x-tenant-id'] || 'marketplace';
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
  await user.save();

  res.success(response, { data: user.savedAddresses, message: 'Address removed' });
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
  const tenantId = req.headers['x-tenant-id'] || 'marketplace';
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
  const tenantId = req.headers['x-tenant-id'] || 'marketplace';
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
