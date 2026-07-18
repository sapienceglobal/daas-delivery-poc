import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },

  // ── Item Details ──────────────────────────────────────────────────────
  name: {
    type: String,
    required: [true, 'Ingredient name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  sku: {
    type: String,
    default: null,
    trim: true
  },
  category: {
    type: String,
    default: 'General',
    trim: true
  },

  // ── Quantity ───────────────────────────────────────────────────────────
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'lb', 'oz', 'liter', 'ml', 'pieces', 'dozen', 'pack'],
    default: 'kg'
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: 0
  },

  // ── Cost ──────────────────────────────────────────────────────────────
  costPerUnit: {
    type: Number,
    default: 0,
    min: 0
  },
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },

  // ── Supplier ──────────────────────────────────────────────────────────
  supplier: {
    name: { type: String, default: null },
    phone: { type: String, default: null },
    email: { type: String, default: null }
  },

  // ── Tracking ──────────────────────────────────────────────────────────
  lastRestockedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },

  // ── Wastage ───────────────────────────────────────────────────────────
  wastageLog: [{
    quantity: { type: Number, required: true },
    reason: { type: String, default: '' },
    loggedAt: { type: Date, default: Date.now },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // ── Purchase History ──────────────────────────────────────────────────
  purchases: [{
    quantity: { type: Number, required: true },
    costPerUnit: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    supplier: { type: String, default: null },
    purchasedAt: { type: Date, default: Date.now },
    purchasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
InventorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });
InventorySchema.index({ restaurantId: 1, quantity: 1 });  // for low-stock queries

// ── Virtual: isLowStock ─────────────────────────────────────────────────────
InventorySchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.lowStockThreshold;
});

InventorySchema.set('toJSON', { virtuals: true });
InventorySchema.set('toObject', { virtuals: true });

// ── Pre-save: calculate totalValue ──────────────────────────────────────────
InventorySchema.pre('save', function (next) {
  this.totalValue = this.quantity * this.costPerUnit;
  next();
});

const Inventory = mongoose.model('Inventory', InventorySchema);
export default Inventory;
