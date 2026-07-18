import mongoose from 'mongoose';

/**
 * Size variation for a menu item (e.g. Small $9.99, Medium $12.99, Large $14.99).
 */
const SizeVariationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },     // "Small", "Medium", "Large"
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

/**
 * Add-on / modifier for a menu item (e.g. Extra Cheese +$2.00).
 */
const AddOnSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0, default: 0 },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    default: null
  },
  images: [{
    type: String
  }],

  // ── Relations ─────────────────────────────────────────────────────────
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required']
  },

  // ── Variations & Add-ons ──────────────────────────────────────────────
  sizeVariations: [SizeVariationSchema],
  addOns: [AddOnSchema],

  // ── Nutrition & Prep ──────────────────────────────────────────────────
  calories: { type: Number, default: null, min: 0 },
  preparationTime: { type: Number, default: null, min: 0 },  // minutes
  cookingMethod: { type: String, default: null },
  ingredients: { type: String, default: null },

  // ── Tags & Flags ──────────────────────────────────────────────────────
  tags: [{ type: String, trim: true, lowercase: true }],  // "vegetarian", "spicy", "gluten-free"
  isVeg: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
  isSpicy: { type: Boolean, default: false },
  isGlutenFree: { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },

  // ── Availability ──────────────────────────────────────────────────────
  isAvailable: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },

  // ── Discount ──────────────────────────────────────────────────────────
  discount: {
    type: { type: String, enum: ['flat', 'percentage'], default: null },
    value: { type: Number, default: 0, min: 0 }
  }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
MenuItemSchema.index({ restaurantId: 1, categoryId: 1, sortOrder: 1 });
MenuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
MenuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

/**
 * Virtual: effective price after discount.
 */
MenuItemSchema.virtual('effectivePrice').get(function () {
  if (!this.discount?.type || !this.discount?.value) return this.price;
  if (this.discount.type === 'flat') return Math.max(0, this.price - this.discount.value);
  if (this.discount.type === 'percentage') return Math.max(0, this.price * (1 - this.discount.value / 100));
  return this.price;
});

MenuItemSchema.set('toJSON', { virtuals: true });
MenuItemSchema.set('toObject', { virtuals: true });

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
export default MenuItem;
