import mongoose from 'mongoose';
import { DRIVER_STATUS_VALUES } from '../config/constants.js';

const DriverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },

  // ── Profile ───────────────────────────────────────────────────────────
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  avatar: { type: String, default: null },

  // ── Vehicle ───────────────────────────────────────────────────────────
  vehicleType: {
    type: String,
    enum: ['car', 'motorcycle', 'bicycle', 'scooter', 'on_foot'],
    default: 'car'
  },
  vehicleMake: { type: String, default: null },
  vehicleModel: { type: String, default: null },
  vehicleColor: { type: String, default: null },
  licensePlate: { type: String, default: null },

  // ── Documents ─────────────────────────────────────────────────────────
  documents: [{
    type: { type: String, enum: ['license', 'insurance', 'registration', 'background_check'] },
    url: { type: String, required: true },
    verified: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null }
  }],

  // ── Status & Availability ─────────────────────────────────────────────
  status: {
    type: String,
    enum: DRIVER_STATUS_VALUES,
    default: 'offline'
  },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // ── Current Location (GeoJSON) ────────────────────────────────────────
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }   // [lng, lat]
  },
  lastLocationUpdate: { type: Date, default: null },

  // ── Performance ───────────────────────────────────────────────────────
  rating: { type: Number, default: 5.0, min: 0, max: 5 },
  totalDeliveries: { type: Number, default: 0, min: 0 },
  totalEarnings: { type: Number, default: 0, min: 0 },

  // ── Current Assignment ────────────────────────────────────────────────
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },

  // ── Preferred Areas ───────────────────────────────────────────────────
  preferredZones: [{
    name: { type: String },
    coordinates: { type: [Number] }  // center point [lng, lat]
  }]
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
DriverSchema.index({ currentLocation: '2dsphere' });
DriverSchema.index({ status: 1, isApproved: 1, isActive: 1 });
DriverSchema.index({ userId: 1 });

const Driver = mongoose.model('Driver', DriverSchema);
export default Driver;
