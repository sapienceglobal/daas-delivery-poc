import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './src/models/User.js';
import Restaurant from './src/models/Restaurant.js';

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas...');

  const restaurant = await Restaurant.findOne();
  console.log(`Restaurant: ${restaurant.name} (${restaurant._id})`);

  const emails = ['test@lassilounge.com', 'test@lassiloungeny.com'];
  const testPassword = 'Test@1234';

  for (const email of emails) {
    let user = await User.findOne({ email });
    if (!user) {
      console.log(`Creating user: ${email}...`);
      user = new User({
        name: 'Merchant Test Reviewer',
        email,
        role: 'merchant',
        restaurantId: restaurant._id,
        isEmailVerified: true,
        isVerified: true,
        isActive: true,
        loginPlatforms: ['merchant_app', 'web', 'app'],
      });
    } else {
      console.log(`Updating user: ${email}...`);
      user.name = 'Merchant Test Reviewer';
      user.role = 'merchant';
      user.restaurantId = restaurant._id;
      user.isEmailVerified = true;
      user.isVerified = true;
      user.isActive = true;
      user.failedLoginAttempts = 0;
      user.loginLockedUntil = null;
      if (!user.loginPlatforms.includes('merchant_app')) {
        user.loginPlatforms.push('merchant_app');
      }
    }

    user.setPassword(testPassword);
    await user.save();
    console.log(`✅ ${email} is now a MERCHANT with password "${testPassword}"`);
  }

  // Also verify in daas_poc just in case marketplace fallback is used
  const daasPocDb = mongoose.connection.useDb('daas_poc');
  const DaasPocUser = daasPocDb.model('User', User.schema);
  const daasPocRest = await daasPocDb.collection('restaurants').findOne();
  
  for (const email of emails) {
    let user = await DaasPocUser.findOne({ email });
    if (!user) {
      user = new DaasPocUser({
        name: 'Merchant Test Reviewer',
        email,
        role: 'merchant',
        restaurantId: daasPocRest ? daasPocRest._id : restaurant._id,
        isEmailVerified: true,
        isVerified: true,
        isActive: true,
        loginPlatforms: ['merchant_app', 'web', 'app'],
      });
    } else {
      user.role = 'merchant';
      user.restaurantId = daasPocRest ? daasPocRest._id : restaurant._id;
      user.isEmailVerified = true;
      user.isVerified = true;
      user.isActive = true;
      user.failedLoginAttempts = 0;
      user.loginLockedUntil = null;
    }
    user.setPassword(testPassword);
    await user.save();
    console.log(`✅ [daas_poc] ${email} synchronized.`);
  }

  await mongoose.disconnect();
  console.log('Finished successfully.');
  process.exit(0);
}

fix().catch(console.error);
