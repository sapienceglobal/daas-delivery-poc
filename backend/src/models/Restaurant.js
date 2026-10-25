import mongoose from 'mongoose';
import { RESTAURANT_STATUS_VALUES } from '../config/constants.js';

/**
 * Operating hours for a single day.
 */
const DayHoursSchema = new mongoose.Schema({
  open: { type: String, default: '09:00' },   // HH:mm
  close: { type: String, default: '22:00' },
  isClosed: { type: Boolean, default: false }
}, { _id: false });

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    maxlength: [150, 'Name cannot exceed 150 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  cuisine: {
    type: String,
    required: [true, 'Cuisine type is required'],
    trim: true
  },
  cuisineTags: [{
    type: String,
    trim: true
  }],

  // ── Ratings (calculated from Review model) ────────────────────────────
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },

  // ── Delivery Info ─────────────────────────────────────────────────────
  prepTime: { type: Number, default: 15 }, // Estimated prep time in minutes
  deliveryTime: { type: String, default: '20-30 min' },
  distance: { type: String, default: '1.0 miles' },
  deliveryFee: { type: Number, default: 0, min: 0 },
  minimumOrder: { type: Number, default: 0, min: 0 },
  deliveryRadius: { type: Number, default: 15 },  // miles

  // ── Contact & Location ────────────────────────────────────────────────
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    default: null,
    lowercase: true,
    trim: true
  },
  website: {
    type: String,
    default: null
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },

  // ── Media ─────────────────────────────────────────────────────────────
  banner: { type: String, default: null },
  logo: { type: String, default: null },
  images: [{ type: String }],

  // ── Operating Hours (per day) ─────────────────────────────────────────
  operatingHours: {
    monday: { type: DayHoursSchema, default: () => ({}) },
    tuesday: { type: DayHoursSchema, default: () => ({}) },
    wednesday: { type: DayHoursSchema, default: () => ({}) },
    thursday: { type: DayHoursSchema, default: () => ({}) },
    friday: { type: DayHoursSchema, default: () => ({}) },
    saturday: { type: DayHoursSchema, default: () => ({}) },
    sunday: { type: DayHoursSchema, default: () => ({}) }
  },
  // legacy simple fields (kept for backward compat during migration)
  openTime: { type: String, default: '09:00' },
  closeTime: { type: String, default: '22:00' },

  // ── Status & Ownership ────────────────────────────────────────────────
  status: {
    type: String,
    enum: RESTAURANT_STATUS_VALUES,
    default: 'pending'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

  // ── Merchant Notifications (WhatsApp & Web Push) ───────────────────────
  notificationSettings: {
    whatsappEnabled: { type: Boolean, default: true },
    whatsappNumber: { type: String, default: '+1 (347) 755-1370' },
    pushEnabled: { type: Boolean, default: true }
  },
  webPushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    },
    createdAt: { type: Date, default: Date.now }
  }],

  // ── Financial ─────────────────────────────────────────────────────────
  taxType: { type: String, default: 'Sales Tax' },
  taxRate: { type: Number, default: 8.875, min: 0, max: 100 },
  serviceCharge: { type: Number, default: 5, min: 0, max: 100 },
  packagingCharge: { type: Number, default: 0.50, min: 0 },
  roundOff: { type: Boolean, default: true },
  commissionRate: { type: Number, default: 0.15, min: 0, max: 1 },      // 15%
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },

  // ── Verification Documents ────────────────────────────────────────────
  documents: [{
    name: { type: String },
    type: {
      type: String,
      enum: ['business_license', 'ein_letter', 'food_permit', 'insurance', 'owner_id', 'bank_document', 'other'],
      default: 'other'
    },
    url: { type: String },
    publicId: { type: String, default: null },
    verified: { type: Boolean, default: false },
    rejectionReason: { type: String, default: null },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // ── Business Onboarding / KYC ─────────────────────────────────────────
  businessInfo: {
    legalName: { type: String, default: '' },
    dbaName: { type: String, default: '' },
    taxIdLast4: { type: String, default: '' },
    businessPhone: { type: String, default: '' },
    businessEmail: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    ownerTitle: { type: String, default: '' },
    ownerPhone: { type: String, default: '' },
    ownerEmail: { type: String, default: '' },
    entityType: {
      type: String,
      enum: ['', 'sole_proprietor', 'llc', 'corporation', 'partnership', 'non_profit'],
      default: ''
    }
  },
  onboardingStatus: {
    type: String,
    enum: ['not_started', 'draft', 'submitted', 'needs_changes', 'approved', 'rejected'],
    default: 'not_started'
  },
  onboardingSubmittedAt: { type: Date, default: null },
  onboardingReviewedAt: { type: Date, default: null },
  onboardingReviewNotes: { type: String, default: '' },
  onboardingReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // ── Settings ──────────────────────────────────────────────────────────
  currency: { type: String, default: 'USD ($) - US Dollar' },
  timezone: { type: String, default: '(UTC-05:00) Eastern Time (ET)' },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  timeFormat: { type: String, default: '12 Hour (AM/PM)' },
  language: { type: String, default: 'English' },
  enableTips: { type: Boolean, default: true },
  
  acceptsOnlineOrders: { type: Boolean, default: true },
  acceptsDineIn: { type: Boolean, default: false },
  acceptsPickup: { type: Boolean, default: true },
  autoAcceptOrders: { type: Boolean, default: false },
  autoRefundEnabled: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 20 },  // default prep minutes
  deliveryDispatchDelayMinutes: { type: Number, default: 0, min: 0, max: 180 },
  
  // ── Loyalty Program Settings ────────────────────────────────────────────
  loyaltySettings: {
    enabled: { type: Boolean, default: true },
    pointsPerDollar: { type: Number, default: 1 },
    centsPerPoint: { type: Number, default: 1 },
    minimumOrderMultiplier: { type: Number, default: 3 },
    termsAndConditions: { 
      type: String, 
      default: 'Earn 1 point for every $1 spent. 100 points = $1 off your next order.' 
    }
  },

  // ── Referral Program Settings (admin-managed, nothing hardcoded) ────────
  referralSettings: {
    enabled: { type: Boolean, default: true },
    refereeDiscountValue: { type: Number, default: 25, min: 0, max: 1000 },   // $ off for the invited friend
    refereeMinOrder: { type: Number, default: 30, min: 0, max: 10000 },       // min cart for the friend's coupon
    referrerRewardValue: { type: Number, default: 25, min: 0, max: 1000 },    // $ value paid to referrer as loyalty points
    couponValidityDays: { type: Number, default: 30, min: 1, max: 365 },      // life of the friend's coupon
    applyWindowDays: { type: Number, default: 7, min: 1, max: 90 },           // days after sign-up a code can be applied
    maxRewardsPerReferrer: { type: Number, default: 20, min: 0, max: 1000 },  // 0 = unlimited
    maxAppliesPerIpPerDay: { type: Number, default: 3, min: 1, max: 100 },    // anti-farming
    requireReferrerOrder: { type: Boolean, default: false },                  // referrer must have a delivered order
    title: { type: String, default: 'Refer a friend', maxlength: 80 },
    description: {
      type: String,
      maxlength: 300,
      default: 'Invite your friends to {restaurant}. They get ${refereeDiscount} off their first order, and you get ${referrerReward} in loyalty points once they order!'
    },
    termsAndConditions: {
      type: String,
      maxlength: 2000,
      default: 'Your friend must be a new customer and enter your code within {applyWindowDays} days of signing up. The ${refereeDiscount} coupon applies to a first order of ${refereeMinOrder} or more and is valid for {couponValidityDays} days. You receive ${referrerReward} in loyalty points after your friend\'s order is delivered. Orders that are cancelled or refunded do not qualify. Self-referrals and duplicate accounts are not eligible. The restaurant may modify or end this offer at any time.'
    }
  },


  // ── Stripe ────────────────────────────────────────────────────────────
  stripeAccountId: { type: String, default: null },

  // ── White-Label Multi-Tenant SaaS & Theme Engine ────────────────────────
  tenantId: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  customDomain: {
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  subdomain: {
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  plan: {
    type: String,
    enum: ['starter', 'growth', 'enterprise'],
    default: 'growth'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'trial', 'past_due', 'suspended'],
    default: 'active'
  },
  themeConfig: {
    templateId: { type: String, default: 'lassi_classic' }, // 'lassi_classic', 'template_bistro', 'template_cafe', 'template_dark_kitchen'
    primaryColor: { type: String, default: '#FDB714' },
    secondaryColor: { type: String, default: '#430805' },
    accentColor: { type: String, default: '#7A0B10' },
    fontFamily: { type: String, default: 'Inter' },
    heroTitle: { type: String, default: '' },
    heroSubtitle: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    bannerUrl: { type: String, default: '' }
  }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
RestaurantSchema.index({ location: '2dsphere' });

RestaurantSchema.index({ status: 1, isActive: 1 });
RestaurantSchema.index({ cuisineTags: 1 });
RestaurantSchema.index({ ownerId: 1 });

// ── Auto-generate slug from name ────────────────────────────────────────────
RestaurantSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  }
  // auto-populate cuisineTags from the comma-separated cuisine string
  if (this.isModified('cuisine') && this.cuisine) {
    this.cuisineTags = this.cuisine.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  }
  next();
});

const Restaurant = mongoose.model('Restaurant', RestaurantSchema);
export default Restaurant;
