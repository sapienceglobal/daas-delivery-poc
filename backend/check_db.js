import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.useDb('daas_poc');
  const User = db.collection('users');
  const userZero = await User.findOne({ 'savedAddresses.lat': 0 });
  if (userZero) {
     console.log('User with 0 lat found:', JSON.stringify(userZero.savedAddresses, null, 2));
  } else {
     console.log('No user with 0 lat found');
  }
check();
