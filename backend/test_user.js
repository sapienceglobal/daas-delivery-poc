import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'priya@lassilounge.com' });
  console.log("Merchant user:", user);
  process.exit(0);
}
run();
