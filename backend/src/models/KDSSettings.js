import mongoose from 'mongoose';

const kdsSettingsSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    unique: true
  },
  // Display Settings
  orderGrouping: {
    type: String,
    enum: ['Order Time', 'Order Type', 'Status'],
    default: 'Order Time'
  },
  maxItemsPerOrder: {
    type: Number,
    default: 10
  },
  showCustomerName: {
    type: Boolean,
    default: true
  },
  itemPreparationTime: {
    type: Boolean,
    default: true
  },
  orderItemsView: {
    type: String,
    enum: ['Detailed View', 'Summary View'],
    default: 'Detailed View'
  },
  showModifiers: {
    type: Boolean,
    default: true
  },
  showOrderTimer: {
    type: Boolean,
    default: true
  },
  highPriorityOrders: {
    type: String,
    enum: ['Highlight', 'Move to Top'],
    default: 'Highlight'
  },
  // Alerts & Notifications
  newOrderAlert: {
    type: String,
    enum: ['Sound + Popup', 'Sound Only', 'Popup Only', 'None'],
    default: 'Sound + Popup'
  },
  orderReminder: {
    type: String,
    enum: ['Every 5 mins', 'Every 10 mins', 'Every 15 mins', 'Off'],
    default: 'Every 10 mins'
  },
  orderReadyAlert: {
    type: String,
    enum: ['Sound', 'Popup', 'Sound + Popup', 'None'],
    default: 'Sound'
  },
  missedOrderAlert: {
    type: String,
    enum: ['Sound + Popup', 'Sound Only', 'Popup Only', 'None'],
    default: 'Sound + Popup'
  },
  // KDS Integration
  posIntegration: {
    type: String,
    enum: ['Connected', 'Disconnected'],
    default: 'Connected'
  },
  onlineOrdering: {
    type: String,
    enum: ['Connected', 'Disconnected'],
    default: 'Connected'
  },
  printerIntegration: {
    type: String,
    enum: ['Connected', 'Disconnected'],
    default: 'Connected'
  },
  soundSystem: {
    type: String,
    enum: ['Connected', 'Disconnected'],
    default: 'Connected'
  }
}, { timestamps: true });

const KDSSettings = mongoose.model('KDSSettings', kdsSettingsSchema);

export default KDSSettings;
