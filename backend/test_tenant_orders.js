import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getTenantModel } from './src/utils/tenant.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const OrderDefault = mongoose.model('Order', (await import('./src/models/Order.js')).default.schema);
  const defOrders = await OrderDefault.find({ restaurantId: new mongoose.Types.ObjectId('6a6494f911cb0b7ab2e01f6e') });
  console.log("Orders for 6a6494f911cb0b7ab2e01f6e in default DB:", defOrders.length);
  
  const OrderLassi = getTenantModel('lassi-lounge', 'Order');
  const lassiOrders = await OrderLassi.find({ restaurantId: new mongoose.Types.ObjectId('6a6494f911cb0b7ab2e01f6e') });
  console.log("Orders for 6a6494f911cb0b7ab2e01f6e in lassi-lounge DB:", lassiOrders.length);
  
  process.exit(0);
}
run();
