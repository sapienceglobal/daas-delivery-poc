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
  // Legacy simple fields (kept for backward compat during migration)
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

  // ── Financial ─────────────────────────────────────────────────────────
  taxRate: { type: Number, default: 0.0875, min: 0, max: 1 },           // 8.75%
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
  acceptsOnlineOrders: { type: Boolean, default: true },
  acceptsDineIn: { type: Boolean, default: false },
  acceptsPickup: { type: Boolean, default: true },
  autoAcceptOrders: { type: Boolean, default: false },
  preparationTime: { type: Number, default: 20 },  // default prep minutes

  // ── Stripe ────────────────────────────────────────────────────────────
  stripeAccountId: { type: String, default: null }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
RestaurantSchema.index({ location: '2dsphere' });
RestaurantSchema.index({ slug: 1 });
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
  // Auto-populate cuisineTags from the comma-separated cuisine string
  if (this.isModified('cuisine') && this.cuisine) {
    this.cuisineTags = this.cuisine.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  }
  next();
});

const Restaurant = mongoose.model('Restaurant', RestaurantSchema);
export default Restaurant;
