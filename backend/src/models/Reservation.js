import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    default: null
  },
  date: {
    type: Date,
    required: [true, 'Reservation date is required']
  },
  time: {
    type: String,
    required: [true, 'Reservation time is required']
  },
  partySize: {
    type: Number,
    required: [true, 'Party size is required'],
    min: 1
  },
  location: {
    type: String,
    enum: ['Main Dining Area', 'Private Room', 'Outdoor Seating', 'Any'],
    default: 'Any'
  },
  occasion: {
    type: String,
    default: null
  },
  specialRequests: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending' // Industry standard: starts as pending until auto-confirmed or merchant confirmed
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    default: null // Assigned later by merchant if needed
  }
}, { timestamps: true });

// Indexes for fast lookup
ReservationSchema.index({ restaurantId: 1, date: 1 });
ReservationSchema.index({ userId: 1, date: -1 });
ReservationSchema.index({ status: 1 });

const Reservation = mongoose.model('Reservation', ReservationSchema);
export default Reservation;
