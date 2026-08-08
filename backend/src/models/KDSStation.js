import mongoose from 'mongoose';

const kdsStationSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  stationName: {
    type: String,
    required: true
  },
  stationCode: {
    type: String,
    required: true // e.g. KDS-HOT-01
  },
  location: {
    type: String // e.g. Main Kitchen, Tandoor Area, Dessert Counter
  },
  stationType: {
    type: String,
    enum: ['Preparation', 'Assembly', 'Expediter', 'Bar', 'Other'],
    default: 'Preparation'
  },
  status: {
    type: String,
    enum: ['Online', 'Offline'],
    default: 'Online'
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

kdsStationSchema.index({ restaurantId: 1, stationCode: 1 }, { unique: true });

const KDSStation = mongoose.model('KDSStation', kdsStationSchema);

export default KDSStation;
