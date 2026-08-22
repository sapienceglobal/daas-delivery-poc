import mongoose from 'mongoose';

const CateringInquirySchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  guestCount: {
    type: Number,
    required: [true, 'Guest count is required'],
    min: 1
  },
  packagePreference: {
    type: String,
    enum: ['Basic Package', 'Premium Package', 'Deluxe Package', 'Custom / Unsure'],
    default: 'Custom / Unsure'
  },
  additionalNotes: {
    type: String,
    default: ''
  },
  budgetRange: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['new', 'in_discussion', 'quotation_sent', 'confirmed', 'closed', 'pending', 'reviewed', 'contacted'],
    default: 'new'
  }
}, { timestamps: true });

// indexes
CateringInquirySchema.index({ restaurantId: 1, createdAt: -1 });
CateringInquirySchema.index({ status: 1 });

const CateringInquiry = mongoose.model('CateringInquiry', CateringInquirySchema);
export default CateringInquiry;
