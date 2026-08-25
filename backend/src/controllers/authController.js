import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import { sendPasswordResetEmail, sendWelcomeEmail, sendOtpEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';
import { OAuth2Client } from 'google-auth-library';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';

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

// role is embedded in JWT so Next.js Edge middleware can verify it without DB access.
// the backend ALWAYS re-fetches the user from DB (auth.js protect middleware) —
// the JWT role is only used for routing decisions, never trusted for data access.
const generateToken = (id, role, tenantId = 'marketplace', tokenVersion = 0) => jwt.sign({ id, role, tenantId, tokenVersion }, JWT_SECRET, { expiresIn: '7d' });

const sendTokenCookie = (user, statusCode, response, tenantId = 'marketplace', rememberMe = true) => {
  const token = generateToken(user._id, user.role, tenantId, user.tokenVersion);
  const secureCookie = process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');
  const body = {
    success: true,
    user: user.toSafeJSON()
  };

  // the mobile app requires the token in the JSON body because it doesn't automatically parse httpOnly cookies.
  // we check for x-app-secret to identify mobile app requests and return the token even in production.
  if (
    process.env.RETURN_AUTH_TOKEN === 'true' ||
    process.env.NODE_ENV !== 'production' ||
    (response.req && response.req.headers['x-app-secret'] && response.req.headers['x-app-secret'] === process.env.APP_SECRET)
  ) {
    body.token = token;
  }

  const cookieOptions = {
    httpOnly: true,
    secure: secureCookie,
    sameSite: secureCookie ? 'none' : 'lax',
    path: '/'
  };

  // industry Standard: If rememberMe is checked, persist the cookie (e.g. 30 days).
  // if not checked, omit 'expires' so it becomes a Session Cookie that deletes on browser close.
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

// ── Controllers ─────────────────────────────────────────────────────────────
// DROP-IN REPLACEMENT for the existing `register` export. Everything up to
// the OTP generation is unchanged — only the ending is different (no more
// sendTokenCookie call). Keep the rest of the file (imports, other exports,
// sendTokenCookie/AppError/asyncHandler/sendOtpEmail/logger/PASSWORD_REGEX)
// exactly as-is.

export const register = asyncHandler(async (req, response) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Please provide name, email, and password.', 400);
  }

  // M3 FIX: ALLOW_PUBLIC_MERCHANT_SIGNUP defaults to false for security.
  // in production, merchants should be onboarded by an admin, not self-registered.
  const publicMerchantSignup = process.env.ALLOW_PUBLIC_MERCHANT_SIGNUP === 'true';
  if (publicMerchantSignup && process.env.NODE_ENV === 'production') {
    logger.warn('[SECURITY] ALLOW_PUBLIC_MERCHANT_SIGNUP is enabled in production. Anyone can self-register as a merchant.');
  }
  const allowedRoles = publicMerchantSignup ? ['customer', 'merchant'] : ['customer'];
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

  // generate random 6-character referral code
  user.referralCode = crypto.randomBytes(3).toString('hex').toUpperCase();

  // generate 6-digit OTP for email verification.
  // using crypto.randomInt instead of Math.random() — this code gates
  // account access, so it should come from a cryptographically secure
  // source, not Math.random() (which is predictable).
  const otp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  user.emailOtp = hashedOtp;
  user.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // (Combined into a single save — the old code saved twice: once
  // right after setting referralCode, then again after setting the
  // OTP fields. One write is enough.)
  await user.save();

  // send OTP email (fire-and-forget — don't block registration)
  sendOtpEmail(email, name, otp).catch(e =>
    logger.warn('OTP email failed', { error: e.message, otp: process.env.NODE_ENV !== 'production' ? otp : '[hidden]' })
  );

  // in dev mode, always log OTP to console for easy testing without email
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV] Email OTP for ${email}: ${otp}`);
  }

  // ─────────────────────────────────────────────────────────────────────
  // THE FIX: registration used to call sendTokenCookie(user, 201, ...)
  // right here, which authenticated the browser/app immediately — before
  // the user ever verified their email. That's the actual root cause of
  // "wrong/skipped OTP still results in a logged-in account" on BOTH the
  // website and the mobile app: the session already existed the instant
  // /api/auth/register succeeded, regardless of what happened on the OTP
  // screen afterwards.
  //
  // the account is created as unverified (isEmailVerified: false,
  // isVerified: false, per the schema defaults) and NO session is issued
  // here. A session is only created inside verifyOtp() below, once the
  // code is confirmed correct and unexpired. Do not add sendTokenCookie
  // back here.
  // ─────────────────────────────────────────────────────────────────────
  return response.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email for a verification code.',
    email: user.email,
  });
});

// DROP-IN REPLACEMENT for the existing `login` export. Only one block was
// added (marked below) — everything else, including the H1 lockout logic,
// is unchanged.

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

  // H1 FIX: Account lockout after 5 failed attempts (15-minute cooldown)
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
    const minsLeft = Math.ceil((user.loginLockedUntil - Date.now()) / 60000);
    throw new AppError(`Account temporarily locked. Try again in ${minsLeft} minute(s).`, 429);
  }

  if (!user.validatePassword(password)) {
    // increment failed attempts atomically
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user._id },
      { $inc: { failedLoginAttempts: 1 } },
      { new: true }
    );

    // lock if threshold reached
    if (updatedUser && updatedUser.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      await UserModel.updateOne(
        { _id: user._id },
        { 
          $set: { 
            loginLockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
            failedLoginAttempts: 0 
          } 
        }
      );
      logger.warn('Account locked due to too many failed login attempts', { email });
    }
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 403);
  }

  // ─────────────────────────────────────────────────────────────────────
  // THE FIX: without this check, the entire register → OTP flow was
  // cosmetic. Nothing here ever looked at isEmailVerified, so anyone who
  // knew the password (including the person who just registered and
  // never finished OTP verification) could log in directly and skip
  // verification entirely — same underlying problem as the register
  // endpoint issuing a session too early, just reachable through a
  // different door.
  //
  // placed AFTER password validation on purpose: a wrong password still
  // returns the same generic "Invalid email or password" either way, so
  // this never leaks whether a given email is registered-but-unverified
  // to someone who doesn't actually know the password.
  // ─────────────────────────────────────────────────────────────────────
  if (!user.isEmailVerified) {
    throw new AppError(
      'Please verify your email before logging in. We can resend the verification code if you need it.',
      403
    );
  }

  // successful login — reset failed attempts
  user.failedLoginAttempts = 0;
  user.loginLockedUntil = null;

  // transparently upgrade old password hashes
  if (user.needsPasswordRehash()) {
    user.setPassword(password);
  }

  const platform = req.headers['x-platform'];
  if (platform === 'merchant_app' && user.role === 'customer') {
    throw new AppError('Access Denied: Customers please use the customer app or website to login.', 403);
  }

  if (platform && ['web', 'app', 'merchant_app'].includes(platform) && !user.loginPlatforms.includes(platform)) {
    user.loginPlatforms.push(platform);
  }

  user.lastLogin = new Date();
  await user.save();

  if (user.isTwoFactorEnabled) {
    const tempToken = jwt.sign({ id: user._id, requires2fa: true, tenantId }, JWT_SECRET, { expiresIn: '5m' });
    return response.status(200).json({
      status: 'success',
      requires2fa: true,
      tempToken,
      message: '2FA verification required'
    });
  }

  sendTokenCookie(user, 200, response, tenantId, rememberMe);
});

export const socialLogin = asyncHandler(async (req, response) => {
  // we expect 'provider' (e.g. 'google', 'apple'), 'token', and optionally 'role'
  const { provider, token, credential, role } = req.body;
  
  // fallback for older frontend still sending 'credential' instead of 'token'
  const jwtToken = token || credential;
  
  if (!jwtToken) throw new AppError(`${provider || 'Social'} token is missing.`, 400);

  if (provider === 'google' && !process.env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google login is not configured on the server yet.', 500);
  }

  const tenantId = req.tenantId || 'marketplace';
  const UserModel = req.getModel('User');

  let email, name, socialId, picture;

  if (provider === 'google' || !provider) {
    // google Token Verification
    const ticket = await googleClient.verifyIdToken({
      idToken: jwtToken,
      audience: [
        process.env.GOOGLE_CLIENT_ID,
        '960808501824-4lm2mhn15aq3lnis7bfs97gdmv193cgm.apps.googleusercontent.com'
      ],
    });

    const payload = ticket.getPayload();
    email = payload.email;
    name = payload.name;
    socialId = payload.sub;
    picture = payload.picture;
  } else if (provider === 'apple') {
    // CRITICAL SECURITY FIX: Disabling Apple login because it was accepting 
    // forged tokens (jwt.decode does not verify signatures). 
    // to re-enable, install `apple-signin-auth` and verify the JWT signature 
    // against Apple's public JWKS, ensuring the audience matches your Apple Client ID.
    throw new AppError('Apple login is not currently supported or configured.', 501);
  } else {
    throw new AppError(`Unsupported provider: ${provider}`, 400);
  }

  let user = await UserModel.findOne({ email });

  if (!user) {
    const allowedRoles = process.env.ALLOW_PUBLIC_MERCHANT_SIGNUP === 'true'
      ? ['customer', 'merchant']
      : ['customer'];
    const finalRole = allowedRoles.includes(role) ? role : 'customer';

    user = new UserModel({
      name,
      email,
      role: finalRole,
      avatar: picture,
      socialLogin: provider === 'apple' ? { appleId: socialId } : { googleId: socialId },
      isVerified: true,
      isEmailVerified: true
    });
    // create random robust password for DB constraint if needed
    user.setPassword(crypto.randomBytes(20).toString('hex'));
    await user.save();

    sendWelcomeEmail(email, name).catch(e => logger.warn('Welcome email failed', { error: e.message }));
  } else {
    // industry Level: Account Linking!
    // if user exists (manual register or other social), link this new social ID
    if (provider === 'apple' && !user.socialLogin.appleId) {
      user.socialLogin.appleId = socialId;
      await user.save();
    } else if ((provider === 'google' || !provider) && !user.socialLogin.googleId) {
      user.socialLogin.googleId = socialId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }
    
    // if the user registered manually but never verified OTP, social login auto-verifies them!
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.isVerified = true;
      await user.save();
    }
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 403);
  }

  user.lastLogin = new Date();
  const platform = req.headers['x-platform'];
  if (platform === 'merchant_app' && user.role === 'customer') {
    throw new AppError('Access Denied: Customers please use the customer app or website to login.', 403);
  }

  if (platform && ['web', 'app', 'merchant_app'].includes(platform) && !user.loginPlatforms.includes(platform)) {
    user.loginPlatforms.push(platform);
  }
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

  // ensure referral code exists for old users
  if (!user.referralCode) {
    user.referralCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    await user.save();
  }

  // fetch group tag from Customer table for this user's email
  const CustomerModel = req.getModel('Customer');
  const customerRecord = await CustomerModel.findOne({ email: user.email, isDeleted: { $ne: true } }).sort({ createdAt: -1 });

  const userData = user.toSafeJSON();
  if (customerRecord && customerRecord.group && customerRecord.group !== 'Others') {
    userData.merchantGroup = customerRecord.group;
  }

  res.success(response, { data: userData });
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

  res.success(response, {
    data: user.toSafeJSON(), message: 'Profile updated successfully'
  });
});

export const saveFcmToken = asyncHandler(async (req, response) => {
  const { fcmToken } = req.body;
  if (!fcmToken) {
    throw new AppError('fcmToken is required', 400);
  }

  const UserModel = req.getModel('User');
  const user = await UserModel.findById(req.user._id);

  if (!user.fcmTokens) {
    user.fcmTokens = [];
  }

  if (!user.fcmTokens.includes(fcmToken)) {
    user.fcmTokens.push(fcmToken);
    if (user.fcmTokens.length > 10) {
      user.fcmTokens = user.fcmTokens.slice(-10);
    }
    await user.save();
  }

  res.success(response, { message: 'FCM token saved successfully' });
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
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  res.success(response, { message: 'Password changed successfully' });
});

export const forgotPassword = asyncHandler(async (req, response) => {
  const { email } = req.body;
  if (!email) throw new AppError('Please provide your email address.', 400);

  const user = await req.getModel('User').findOne({ email });
  // always respond 200 to avoid email enumeration
  if (!user) {
    return res.success(response, { message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://195.35.20.207:3001'}/reset-password/${resetToken}`;

  await sendPasswordResetEmail(email, resetUrl, user.name);

  res.success(response, { message: 'If that email exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, response) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await req.getModel('User').findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) throw new AppError('Invalid or expired reset token.', 400);

  const { password } = req.body;
  if (!password || !PASSWORD_REGEX.test(password)) {
    throw new AppError('Password does not meet complexity requirements.', 400);
  }

  user.setPassword(password);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
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

  // if we removed the default address, make the first one default (if any)
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
  const { cardId, title, brand, last4, expMonth, expYear, isDefault } = req.body;
  if (!cardId || !brand || !last4) throw new AppError('Card details missing.', 400);

  const user = await req.getModel('User').findById(req.user._id);

  if (isDefault || user.savedCards.length === 0) {
    user.savedCards.forEach(c => { c.isDefault = false; });
  }

  user.savedCards.push({
    cardId, title: title || 'Personal Card', brand, last4, expMonth, expYear,
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

  // reset default if needed
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
    message: index > -1 ? 'Removed from favorites' : 'Added from favorites'
  });
});

// ── OTP Verification ─────────────────────────────────────────────────────────

export const verifyOtp = asyncHandler(async (req, response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError('Email and OTP are required.', 400);
  }

  const UserModel = req.getModel('User');
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.isEmailVerified) {
    return res.success(response, { message: 'Email already verified.' });
  }

  if (!user.emailOtp || !user.emailOtpExpiry) {
    throw new AppError('No OTP found. Please request a new one.', 400);
  }

  if (new Date() > user.emailOtpExpiry) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  if ((user.otpAttempts || 0) >= 5) {
    user.emailOtp = null;
    user.emailOtpExpiry = null;
    user.otpAttempts = 0;
    await user.save();
    throw new AppError('Too many incorrect attempts. Please request a new code.', 429);
  }

  const hashedInputOtp = crypto.createHash('sha256').update(otp.toString()).digest('hex');
  if (user.emailOtp !== hashedInputOtp) {
    await UserModel.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } });
    throw new AppError('Invalid OTP. Please check and try again.', 400);
  }

  // mark email as verified and clear OTP
  user.isEmailVerified = true;
  user.isVerified = true;
  user.emailOtp = null;
  user.emailOtpExpiry = null;
  user.otpAttempts = 0;
  
  const platform = req.headers['x-platform'];
  if (platform && ['web', 'app', 'merchant_app'].includes(platform) && !user.loginPlatforms.includes(platform)) {
    user.loginPlatforms.push(platform);
  }
  
  await user.save();

  // send welcome email now that they're verified
  sendWelcomeEmail(user.email, user.name).catch(e =>
    logger.warn('Welcome email failed', { error: e.message })
  );

  const tenantId = req.tenantId || 'marketplace';
  sendTokenCookie(user, 200, response, tenantId);
});

export const resendOtp = asyncHandler(async (req, response) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required.', 400);
  }

  const UserModel = req.getModel('User');
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified.', 400);
  }

  // rate limit: allow resend only if previous OTP was sent > 60 seconds ago.
  // emailOtpExpiry is set to (sendTime + 10 minutes). So the remaining time until
  // expiry = emailOtpExpiry - Date.now(). If remaining > 9 min (540s), it means
  // fewer than 60 seconds have elapsed since the OTP was first generated.
  if (user.emailOtpExpiry) {
    const secondsRemaining = (user.emailOtpExpiry - Date.now()) / 1000;
    if (secondsRemaining > (10 * 60 - 60)) { // less than 60s has passed since OTP was generated
      throw new AppError('Please wait 60 seconds before requesting a new code.', 429);
    }
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  user.emailOtp = hashedOtp;
  user.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  sendOtpEmail(user.email, user.name, otp).catch(e =>
    logger.warn('OTP email failed', { error: e.message })
  );

  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV] Resent Email OTP for ${email}: ${otp}`);
  }

  res.success(response, { message: 'OTP sent successfully.' });
});


// ── Two-Factor Authentication ────────────────────────────────────────────────

export const generate2FA = asyncHandler(async (req, response) => {
  const UserModel = req.getModel('User');
  const user = await UserModel.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  const secret = generateSecret();
  const otpauthUrl = generateURI({
    secret,
    issuer: 'DaaS Delivery Admin',
    label: user.email,
  });
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  res.success(response, {
    data: {
      secret,
      qrCodeUrl
    }
  });
});

export const enable2FA = asyncHandler(async (req, response) => {
  const { secret, token } = req.body;
  if (!secret || !token) throw new AppError('Secret and token are required', 400);

  const { valid } = await verify({ token, secret });
  if (!valid) {
    throw new AppError('Invalid 2FA code', 400);
  }

  const UserModel = req.getModel('User');
  const user = await UserModel.findById(req.user._id);
  user.twoFactorSecret = secret;
  user.isTwoFactorEnabled = true;
  await user.save();

  res.success(response, { message: '2FA enabled successfully' });
});

export const disable2FA = asyncHandler(async (req, response) => {
  const { token } = req.body;
  if (!token) throw new AppError('Token is required', 400);

  const UserModel = req.getModel('User');
  const user = await UserModel.findById(req.user._id);

  const { valid } = await verify({ token, secret: user.twoFactorSecret });
  if (!valid) {
    throw new AppError('Invalid 2FA code', 400);
  }

  user.twoFactorSecret = null;
  user.isTwoFactorEnabled = false;
  await user.save();

  res.success(response, { message: '2FA disabled successfully' });
});

export const verify2FA = asyncHandler(async (req, response) => {
  const { tempToken, token, rememberMe = true } = req.body;
  if (!tempToken || !token) throw new AppError('Temporary token and 2FA code are required', 400);

  let decoded;
  try {
    decoded = jwt.verify(tempToken, JWT_SECRET);
  } catch (err) {
    throw new AppError('Session expired or invalid token', 401);
  }

  if (!decoded.requires2fa) {
    throw new AppError('Invalid token usage', 400);
  }

  // get the default DB model, since login happens on the primary tenant usually
  // or we can rely on decoded.tenantId
  const UserModel = req.getModel('User');
  const user = await UserModel.findById(decoded.id);

  if (!user || !user.isTwoFactorEnabled) {
    throw new AppError('2FA is not enabled or user not found', 400);
  }

  const { valid } = await verify({ token, secret: user.twoFactorSecret });
  if (!valid) {
    throw new AppError('Invalid 2FA code', 400);
  }

  sendTokenCookie(user, 200, response, decoded.tenantId || 'marketplace', rememberMe);
});
