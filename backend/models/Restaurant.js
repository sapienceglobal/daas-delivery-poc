const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  isAvailable: { type: Boolean, required: true, default: true }
});

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cuisine: { type: String, required: true },
  rating: { type: Number, required: true, default: 4.5 },
  reviews: { type: Number, required: true, default: 0 },
  deliveryTime: { type: String, required: true, default: '20-30 min' },
  distance: { type: String, required: true, default: '1.0 miles' },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  banner: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'approved' // Default to approved for legacy / default seeded data
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  openTime: { type: String, required: true, default: '09:00' },
  closeTime: { type: String, required: true, default: '22:00' },
  menu: [MenuItemSchema]
}, { timestamps: true });

RestaurantSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
