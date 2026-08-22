import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  actionUrl: {
    type: String,
    default: '',
  },
  audience: {
    type: String,
    enum: ['all_customers', 'inactive_30_days', 'favorites_only'],
    default: 'all_customers',
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'partial_success'],
    default: 'pending',
  },
  sentAt: {
    type: Date,
  },
  successCount: {
    type: Number,
    default: 0,
  },
  failureCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
