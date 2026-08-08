import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getTenantModel } from './src/utils/tenant.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  await import('./src/models/User.js');
  await import('./src/models/Order.js');
  
  const UserLassi = getTenantModel('lassi-lounge', 'User');
  const OrderLassi = getTenantModel('lassi-lounge', 'Order');
  
  const customerId = '6a609bfee86f1057c72a8701';
  const restaurantId = '6a606320a0c4ad20ccee7e0c'; // lassi lounge DB restaurantId
  
  console.log("Checking user...");
  const user = await UserLassi.findById(customerId).lean();
  console.log("User found:", !!user);
  
  const orderQuery = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };
  const orConditions = [];
  
  if (user && user._id) orConditions.push({ userId: user._id });
  if (user && user.email) orConditions.push({ customerEmail: { $regex: new RegExp(`^${user.email}$`, 'i') } });
  if (user && user.phone) orConditions.push({ customerPhone: user.phone });
  
  orderQuery.$or = orConditions;
  
  console.log("Order Query:", JSON.stringify(orderQuery));
  
  const orders = await OrderLassi.find(orderQuery).sort({ createdAt: -1 }).lean();
  console.log("Orders found:", orders.length);
  
  process.exit(0);
}
run();
