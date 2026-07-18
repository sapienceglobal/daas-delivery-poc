import mongoose from 'mongoose';
import { TABLE_STATUS_VALUES } from '../config/constants.js';

const TableSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },
  tableNumber: {
    type: String,
    required: [true, 'Table number is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1,
    max: 50
  },
  status: {
    type: String,
    enum: TABLE_STATUS_VALUES,
    default: 'available'
  },

  // ── Floor Plan Positioning ────────────────────────────────────────────
  floor: { type: String, default: 'Main', trim: true },
  positionX: { type: Number, default: 0 },
  positionY: { type: Number, default: 0 },
  shape: {
    type: String,
    enum: ['square', 'round', 'rectangle'],
    default: 'square'
  },

  // ── Current State ─────────────────────────────────────────────────────
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  occupiedAt: { type: Date, default: null },
  reservedFor: {
    customerName: { type: String, default: null },
    customerPhone: { type: String, default: null },
    reservationTime: { type: Date, default: null },
    partySize: { type: Number, default: null }
  },

  // ── Merge ─────────────────────────────────────────────────────────────
  mergedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  }],

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
TableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });
TableSchema.index({ restaurantId: 1, status: 1 });

const Table = mongoose.model('Table', TableSchema);
export default Table;
