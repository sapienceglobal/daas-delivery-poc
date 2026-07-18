import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  // ── Relations ─────────────────────────────────────────────────────────
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },

  // ── Ratings (1-5 stars, separate dimensions) ──────────────────────────
  foodRating: {
    type: Number,
    required: [true, 'Food rating is required'],
    min: 1,
    max: 5
  },
  deliveryRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  overallRating: {
    type: Number,
    required: [true, 'Overall rating is required'],
    min: 1,
    max: 5
  },

  // ── Review Text ───────────────────────────────────────────────────────
  title: {
    type: String,
    default: '',
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  comment: {
    type: String,
    default: '',
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  images: [{ type: String }],

  // ── Restaurant Reply ──────────────────────────────────────────────────
  reply: {
    text: { type: String, default: null },
    repliedAt: { type: Date, default: null },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },

  // ── Engagement ────────────────────────────────────────────────────────
  helpfulCount: { type: Number, default: 0, min: 0 },
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // ── Moderation ────────────────────────────────────────────────────────
  isVisible: { type: Boolean, default: true },
  reportCount: { type: Number, default: 0 }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
ReviewSchema.index({ restaurantId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ orderId: 1 }, { unique: true });  // one review per order

const Review = mongoose.model('Review', ReviewSchema);
export default Review;
