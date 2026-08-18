const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const email = 'admin@lassiloungeny.com';
  const rawPassword = 'LL@Admin2026#NYC';
  
  const user = await db.collection('users').findOne({ email });
  if (!user) {
    console.log('User not found. Creating...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);
    await db.collection('users').insertOne({
      email,
      password: hash,
      role: 'merchant_admin',
      name: 'Lassi Lounge Admin',
      restaurantId: 'lassi-lounge',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('User created successfully');
  } else {
    console.log('User found. Updating password...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);
    await db.collection('users').updateOne(
      { email },
      { $set: { password: hash, role: 'merchant_admin', restaurantId: 'lassi-lounge' } }
    );
    console.log('Password updated successfully');
  }
  process.exit(0);
}
run().catch(console.error);
