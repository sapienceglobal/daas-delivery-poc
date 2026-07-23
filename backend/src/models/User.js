import mongoose from 'mongoose';
import crypto from 'crypto';
import { USER_ROLE_VALUES } from '../config/constants.js';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String
  },
  salt: {
    type: String
  },
  passwordAlgorithm: {
    type: String,
    enum: ['scrypt'],
    default: undefined
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: USER_ROLE_VALUES,
    default: 'customer'
  },

  // ── Linked Resources ──────────────────────────────────────────────────
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null
  },

  // ── Addresses ─────────────────────────────────────────────────────────
  savedAddresses: [{
    label: { type: String, default: 'Home' },
    address: { type: String, required: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    isDefault: { type: Boolean, default: false }
  }],

  // ── Favorites ─────────────────────────────────────────────────────────
  favoriteRestaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  favoriteItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],

  // ── Saved Cart ────────────────────────────────────────────────────────
  savedCart: {
    tenantId: { type: String, default: 'marketplace' },
    restaurant: {
      _id: { type: String, default: null },
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
      deliveryFee: { type: Number, default: 0 },
      taxRate: { type: Number, default: null }
    },
    items: [{
      menuItemId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      image: { type: String, default: null },
      quantity: { type: Number, default: 1, min: 1, max: 99 },
      qty: { type: Number, default: 1, min: 1, max: 99 },
      selectedSize: { type: mongoose.Schema.Types.Mixed, default: null },
      addOns: [{ type: mongoose.Schema.Types.Mixed }],
      specialInstructions: { type: String, default: '' },
      lineTotal: { type: Number, default: 0 }
    }],
    updatedAt: { type: Date, default: null }
  },

  // ── Loyalty ───────────────────────────────────────────────────────────
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },

  // ── Social Login ──────────────────────────────────────────────────────
  socialLogin: {
    googleId: { type: String, default: null },
    appleId: { type: String, default: null },
    facebookId: { type: String, default: null }
  },

  // ── Notification Preferences ──────────────────────────────────────────
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    marketing: { type: Boolean, default: true }
  },

  // ── Verification & Security ───────────────────────────────────────────
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },

  // ── Login Lockout ─────────────────────────────────────────────────────
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  loginLockedUntil: {
    type: Date,
    default: null
  },

  // ── Stripe Customer & Payments ─────────────────────────────────────────
  stripeCustomerId: {
    type: String,
    default: null
  },
  savedCards: [{
    cardId: { type: String, required: true },
    brand: { type: String, required: true }, // visa, mastercard, etc.
    last4: { type: String, required: true },
    expMonth: { type: Number, required: true },
    expYear: { type: Number, required: true },
    isDefault: { type: Boolean, default: false }
  }],

  // ── Referrals ─────────────────────────────────────────────────────────
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // ── Authentication & Security ───────────────────────────────────────────
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
UserSchema.index({ role: 1 });
UserSchema.index({ 'socialLogin.googleId': 1 }, { sparse: true });
UserSchema.index({ referralCode: 1 }, { sparse: true });

// ── Password hashing (scrypt) ───────────────────────────────────────────────
UserSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password = crypto.scryptSync(password, this.salt, 64).toString('hex');
  this.passwordAlgorithm = 'scrypt';
};

UserSchema.methods.validatePassword = function (password) {
  const storedHash = Buffer.from(this.password, 'hex');
  const candidateHash = this.passwordAlgorithm === 'scrypt'
    ? crypto.scryptSync(password, this.salt, 64)
    : crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512');

  return storedHash.length === candidateHash.length &&
    crypto.timingSafeEqual(storedHash, candidateHash);
};

UserSchema.methods.needsPasswordRehash = function () {
  return this.passwordAlgorithm !== 'scrypt';
};

// ── Password Reset Token ────────────────────────────────────────────────────
UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 60 minutes
  return resetToken;
};

// ── JSON sanitization (remove sensitive fields) ─────────────────────────────
UserSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.salt;
  delete obj.passwordAlgorithm;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.failedLoginAttempts;
  delete obj.loginLockedUntil;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', UserSchema);
export default User;
