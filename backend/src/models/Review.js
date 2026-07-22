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
    required: false
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: false
  },

  // ── Ratings (1-5 stars, separate dimensions) ──────────────────────────
  foodRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  deliveryRating: {
    type: Number,
    min: 1,
    max: 5
  },
  overallRating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
    default: 5
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
ReviewSchema.index({ itemId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, itemId: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ orderId: 1 }, { 
  unique: true, 
  partialFilterExpression: { orderId: { $type: 'objectId' } } 
});

const Review = mongoose.model('Review', ReviewSchema);

// Drop legacy index if it exists and sync
setTimeout(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Review.collection.dropIndex('orderId_1');
      await Review.syncIndexes();
    }
  } catch (err) {
    // Ignore if index doesn't exist
  }
}, 3000);

export default Review;
