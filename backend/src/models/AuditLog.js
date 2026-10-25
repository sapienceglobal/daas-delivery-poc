import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  actorType: {
    type: String,
    enum: ['merchant', 'staff', 'customer', 'admin', 'system'],
    default: 'system',
    index: true
  },
  actor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    role: { type: String, default: null }
  },
  event: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    default: null,
    index: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
    index: true
  },
  message: {
    type: String,
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
    index: true
  },
  orderNumber: {
    type: String,
    default: null,
    index: true
  },
  device: {
    ip: { type: String, default: null },
    platform: { type: String, default: null },
    deviceType: { type: String, default: null },
    os: { type: String, default: null },
    browser: { type: String, default: null },
    city: { type: String, default: null },
    region: { type: String, default: null },
    country: { type: String, default: null },
    location: { type: String, default: null },
    locationDisplay: { type: String, default: null },
    networkCarrier: { type: String, default: null },
    networkType: { type: String, default: null },
    userAgent: { type: String, default: null }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: false });

AuditLogSchema.index({ restaurantId: 1, actorType: 1, timestamp: -1 });
AuditLogSchema.index({ restaurantId: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export default AuditLog;
