import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: { type: String, required: true },
  contactName: { type: String, default: null },
  phone: { type: String, default: null },
  email: { type: String, default: null },
  address: { type: String, default: null },
  itemsProvided: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

SupplierSchema.index({ restaurantId: 1 });

const Supplier = mongoose.model('Supplier', SupplierSchema);
export default Supplier;
