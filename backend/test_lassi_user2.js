import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getTenantModel } from './src/utils/tenant.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  await import('./src/models/User.js');
  
  const UserLassi = getTenantModel('lassi-lounge', 'User');
  const user = await UserLassi.findOne({ email: 'priya@lassilounge.com' });
  console.log("RestaurantId for priya in lassi-lounge DB:", user ? user.restaurantId : 'Not found');
  process.exit(0);
}
run();
