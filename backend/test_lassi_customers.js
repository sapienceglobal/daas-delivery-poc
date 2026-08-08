import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getTenantModel } from './src/utils/tenant.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  await import('./src/models/User.js');
  
  const UserLassi = getTenantModel('lassi-lounge', 'User');
  const customers = await UserLassi.find({ role: 'customer' });
  console.log("Customers in lassi-lounge DB:", customers.length);
  customers.forEach(c => console.log(c.email, c.phone));
  process.exit(0);
}
run();
