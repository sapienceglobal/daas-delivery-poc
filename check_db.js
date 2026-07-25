import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.useDb('marketplace');
  const Restaurant = db.collection('restaurants');
  const r = await Restaurant.findOne({ name: 'Lassi Lounge' });
  console.log(JSON.stringify(r.location, null, 2));
  console.log('taxRate:', r.taxRate);
  process.exit(0);
}
check();
