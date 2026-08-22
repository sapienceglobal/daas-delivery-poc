import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  customerId: {
    type: String, // E.g. #CUST1001
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  phone: {
    type: String
  },
  group: {
    type: String,
    enum: ['Family', 'Friends', 'Corporate', 'Others'],
    default: 'Others'
  },
  loyaltyTier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastOrderDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// ensure unique customer ID within a restaurant
customerSchema.index({ restaurantId: 1, customerId: 1 }, { unique: true });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
