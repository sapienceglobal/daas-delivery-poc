import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getTenantModel } from './src/utils/tenant.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  await import('./src/models/Order.js');
  
  const OrderLassi = getTenantModel('lassi-lounge', 'Order');
  const lassiOrders = await OrderLassi.find({ restaurantId: new mongoose.Types.ObjectId('6a606320a0c4ad20ccee7e0c') });
  console.log("Orders for 6a606320a0c4ad20ccee7e0c in lassi-lounge DB:", lassiOrders.length);
  process.exit(0);
}
run();
