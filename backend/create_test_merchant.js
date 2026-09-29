import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import User from './src/models/User.js';
import Restaurant from './src/models/Restaurant.js';

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // Find the restaurant
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      console.log('No restaurant found! Looking across all collections...');
    } else {
      console.log(`Found Restaurant: ${restaurant.name} (ID: ${restaurant._id})`);
    }

    const testEmail = 'test@lassilounge.com';
    const testPassword = 'Test@1234';

    let user = await User.findOne({ email: testEmail });
    if (!user) {
      console.log(`Creating new test user: ${testEmail}...`);
      user = new User({
        name: 'Google Reviewer',
        email: testEmail,
        role: 'admin',
        restaurantId: restaurant ? restaurant._id : null,
        isEmailVerified: true,
        isVerified: true,
        isActive: true,
        phone: '+1 347-233-3733',
        loginPlatforms: ['merchant_app', 'web', 'app']
      });
    } else {
      console.log(`Updating existing test user: ${testEmail}...`);
      user.name = 'Google Reviewer';
      user.role = 'admin';
      user.isEmailVerified = true;
      user.isVerified = true;
      user.isActive = true;
      user.failedLoginAttempts = 0;
      user.loginLockedUntil = null;
      if (restaurant) {
        user.restaurantId = restaurant._id;
      }
    }

    user.setPassword(testPassword);
    await user.save();

    console.log('Test user saved successfully!');
    console.log('Verifying password...');
    const isValid = user.validatePassword(testPassword);
    console.log(`Password validation check: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`);

    console.log('\n--- Review Credentials Summary ---');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log(`Role: ${user.role}`);
    console.log(`Restaurant ID: ${user.restaurantId}`);
    console.log(`Is Active: ${user.isActive}`);
    console.log(`Is Email Verified: ${user.isEmailVerified}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('Error in create_test_merchant:', err);
    process.exit(1);
  }
}

main();
