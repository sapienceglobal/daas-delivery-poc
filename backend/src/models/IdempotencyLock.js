import mongoose from 'mongoose';

const IdempotencyLockSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now, expires: 15 } // 15 seconds TTL
});

// Atomic uniqueness constraint
IdempotencyLockSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });

const IdempotencyLock = mongoose.model('IdempotencyLock', IdempotencyLockSchema);
export default IdempotencyLock;
