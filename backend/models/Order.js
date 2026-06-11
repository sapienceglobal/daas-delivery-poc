const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customerName: { 
    type: String, 
    required: [true, 'Customer name is required'] 
  },
  customerPhone: { 
    type: String, 
    required: [true, 'Customer phone number is required'] 
  },
  address: { 
    type: String, 
    required: [true, 'Delivery address is required'] 
  },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 }
  }],
  restaurantName: {
    type: String,
    required: true,
    default: 'The Premium Test Store'
  },
  restaurantAddress: {
    type: String,
    required: true,
    default: '100 Main St, San Francisco, CA 94105'
  },
  restaurantPhone: {
    type: String,
    required: true,
    default: '+16505550100'
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null
  },
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  platformFee: {
    type: Number,
    required: true,
    default: 2.00
  },
  paymentMethod: {
    type: String,
    enum: ['Apple Pay', 'Credit Card', 'Cash on Delivery'],
    required: true,
    default: 'Credit Card'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    required: true,
    default: 'pending'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  productName: { 
    type: String, 
    default: 'Test Item' 
  },
  productPrice: { 
    type: Number, 
    default: 10.00 
  },
  deliveryStatus: { 
    type: String, 
    required: true,
    enum: ['pending', 'accepted', 'preparing', 'cooking', 'ready', 'processing', 'quote_created', 'driver_assigned', 'picked_up', 'delivered', 'cancelled', 'failed'],
    default: 'pending' 
  },
  deliveryId: { 
    type: String, 
    default: null 
  }, 
  externalDeliveryId: { 
    type: String, 
    unique: true 
  }, 
  trackingUrl: { 
    type: String, 
    default: null 
  }, 
  deliveryFee: { 
    type: Number, 
    default: 0 
  }, 
  pickupTime: { 
    type: Date, 
    default: null 
  },
  deliveryTime: { 
    type: Date, 
    default: null 
  },
  scheduledTime: {
    type: Date,
    default: null
  },
  courierNotes: {
    type: String,
    default: null
  },
  dasherLat: {
    type: Number,
    default: null
  },
  dasherLng: {
    type: Number,
    default: null
  },
  dasherName: {
    type: String,
    default: null
  },
  dasherPhone: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  review: {
    type: String,
    default: null
  },
  refunded: {
    type: Boolean,
    default: false
  },
  statusUpdates: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    description: { type: String }
  }]
}, { timestamps: true });

// Pre-save hook to generate a unique external delivery ID
OrderSchema.pre('save', function(next) {
  if (!this.externalDeliveryId) {
    this.externalDeliveryId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  
  // Map shopping cart items to single item properties for DoorDash compatibility
  if (this.items && this.items.length > 0) {
    this.productName = this.items.map(item => `${item.quantity}x ${item.name}`).join(', ').substring(0, 95);
    this.productPrice = this.subtotal;
  }
  
  // Initialize the first status update in the history if empty
  if (this.statusUpdates.length === 0) {
    this.statusUpdates.push({
      status: this.deliveryStatus,
      timestamp: new Date(),
      description: 'Order created in PoC database'
    });
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
