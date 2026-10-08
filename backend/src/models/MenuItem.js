import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

// size variation for a menu item (e.g. Small $9.99, Medium $12.99, Large $14.99).
const SizeVariationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },     // "Small", "Medium", "Large"
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

// add-on / modifier for a menu item (e.g. Extra Cheese +$2.00).
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
  // Clean, human-readable URL key — unique per restaurant (e.g. "samosa", "mango-lassi").
  slug: {
    type: String,
    trim: true,
    lowercase: true
  },
  // Old slugs kept after a rename so previously shared / indexed links 301 to the new URL.
  previousSlugs: [{ type: String, trim: true, lowercase: true }],
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

  // ── Ratings & Reviews ──────────────────────────────────────────────────
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },

  // ── Availability ──────────────────────────────────────────────────────
  isAvailable: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },

  // ── Discount ──────────────────────────────────────────────────────────
  discount: {
    type: { type: String, enum: ['flat', 'percentage'], default: null },
    value: { type: Number, default: 0, min: 0 }
  },

  // ── SEO & Social Sharing ──────────────────────────────────────────────
  seoTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'SEO Title cannot exceed 60 characters'],
    default: ''
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: [155, 'SEO Description cannot exceed 155 characters'],
    default: ''
  },
  seoKeywords: [{
    type: String,
    trim: true
  }],
  seoImage: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
MenuItemSchema.index({ restaurantId: 1, categoryId: 1, sortOrder: 1 });
MenuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
MenuItemSchema.index({ restaurantId: 1, slug: 1 });
MenuItemSchema.index({ restaurantId: 1, previousSlugs: 1 });
MenuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

// ── Pre-save Slug Generation (unique per restaurant) ────────────────────────
// "Samosa" -> "samosa"; a second "Samosa" in the same restaurant -> "samosa-2".
MenuItemSchema.pre('save', async function () {
  if (!this.isModified('name') && this.slug) return;

  const base = slugify(this.name) || 'item';
  if (this.slug === base) return;

  const Model = this.constructor;
  let candidate = base;
  let counter = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({
    restaurantId: this.restaurantId,
    _id: { $ne: this._id },
    $or: [{ slug: candidate }, { previousSlugs: candidate }]
  })) {
    candidate = `${base}-${counter++}`;
  }

  // remember old slug so existing links keep working after a rename
  if (this.slug && this.slug !== candidate) {
    const history = new Set([...(this.previousSlugs || []), this.slug]);
    history.delete(candidate);
    this.previousSlugs = [...history];
  }
  this.slug = candidate;
});

// virtual: effective price after discount.
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
