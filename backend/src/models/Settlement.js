import mongoose from 'mongoose';

const SettlementSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },

  // ── Period ────────────────────────────────────────────────────────────
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },

  // ── Amounts ───────────────────────────────────────────────────────────
  totalOrders: { type: Number, default: 0, min: 0 },
  grossSales: { type: Number, default: 0, min: 0 },
  commission: { type: Number, default: 0, min: 0 },
  platformFees: { type: Number, default: 0, min: 0 },
  taxes: { type: Number, default: 0, min: 0 },
  refunds: { type: Number, default: 0, min: 0 },
  netPayable: { type: Number, default: 0 },

  // ── Payment ───────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending'
  },
  paidAt: { type: Date, default: null },
  transactionReference: { type: String, default: null },
  stripeTransferId: { type: String, default: null },

  // ── Orders included ───────────────────────────────────────────────────
  orderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],

  notes: { type: String, default: '' }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
SettlementSchema.index({ restaurantId: 1, periodStart: -1 });
SettlementSchema.index({ status: 1 });

const Settlement = mongoose.model('Settlement', SettlementSchema);
export default Settlement;
