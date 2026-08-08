import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getTenantConnection, getTenantModel } from './src/utils/tenant.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const OrderDefault = mongoose.model('Order', (await import('./src/models/Order.js')).default.schema);
  const defOrders = await OrderDefault.find();
  console.log("Orders in default DB:", defOrders.length);
  
  const OrderLassi = getTenantModel('lassi-lounge', 'Order');
  const lassiOrders = await OrderLassi.find();
  console.log("Orders in lassi-lounge DB:", lassiOrders.length);
  
  process.exit(0);
}
run();
