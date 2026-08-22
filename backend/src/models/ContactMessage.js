import mongoose from 'mongoose';

const ContactMessageSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied'],
    default: 'new'
  }
}, { timestamps: true });

// index for fetching messages by restaurant efficiently, sorted by newest first
ContactMessageSchema.index({ restaurant: 1, createdAt: -1 });

export default mongoose.model('ContactMessage', ContactMessageSchema);
