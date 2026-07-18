import mongoose from 'mongoose';
import { NOTIFICATION_CHANNEL_VALUES } from '../config/constants.js';

const NotificationSchema = new mongoose.Schema({
  // ── Target ────────────────────────────────────────────────────────────
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },

  // ── Content ───────────────────────────────────────────────────────────
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  body: {
    type: String,
    required: [true, 'Body is required'],
    maxlength: [1000, 'Body cannot exceed 1000 characters']
  },
  image: { type: String, default: null },

  // ── Channel ───────────────────────────────────────────────────────────
  channel: {
    type: String,
    enum: NOTIFICATION_CHANNEL_VALUES,
    default: 'in_app'
  },

  // ── Type ──────────────────────────────────────────────────────────────
  type: {
    type: String,
    enum: [
      'order_update', 'promotion', 'review', 'system',
      'delivery_update', 'payment', 'loyalty', 'marketing'
    ],
    default: 'system'
  },

  // ── Action Link ───────────────────────────────────────────────────────
  actionUrl: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  // ── Status ────────────────────────────────────────────────────────────
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });

// Auto-expire old notifications after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
