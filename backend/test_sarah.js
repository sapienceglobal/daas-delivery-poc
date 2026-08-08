import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getTenantModel } from './src/utils/tenant.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  await import('./src/models/User.js');
  
  const UserLassi = getTenantModel('lassi-lounge', 'User');
  const user = await UserLassi.findOne({ email: 'sarah@gmail.com' });
  console.log("Sarah ID:", user._id);
  process.exit(0);
}
run();
