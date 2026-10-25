import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './src/models/User.js';

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || 'superadmin@platform.com').toLowerCase().trim();
  const password = args[1] || 'SuperAdmin@2026!';
  const name = args[2] || 'Platform Super Admin';

  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI is not defined in backend/.env');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully.\n');

    let user = await User.findOne({ email });

    if (user) {
      console.log(`ℹ️  User "${email}" already exists. Updating to Super Admin...`);
      user.name = name;
      user.role = 'admin';
      user.restaurantId = null; // Platform Super Admin has global access across all tenants
      user.isEmailVerified = true;
      user.isVerified = true;
      user.isActive = true;
      user.failedLoginAttempts = 0;
      user.loginLockedUntil = null;
      user.setPassword(password);
      await user.save();
    } else {
      console.log(`ℹ️  Creating fresh Super Admin account for "${email}"...`);
      user = new User({
        name,
        email,
        role: 'admin',
        restaurantId: null,
        isEmailVerified: true,
        isVerified: true,
        isActive: true,
        failedLoginAttempts: 0,
        loginLockedUntil: null,
        phone: '+18005550199',
        notificationPreferences: { email: true, push: true, sms: false, marketing: false }
      });
      user.setPassword(password);
      await user.save();
    }

    console.log('====================================================');
    console.log('🎉 PLATFORM SUPER ADMIN ACCOUNT READY');
    console.log('====================================================');
    console.log(`👤 Name:      ${user.name}`);
    console.log(`📧 Email:     ${user.email}`);
    console.log(`🔑 Password:  ${password}`);
    console.log(`🛡️ Role:      ${user.role} (Super Admin Control Plane)`);
    console.log(`🌐 Login URL: http://195.35.20.207:8088/admin/login`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Failed to create/update Super Admin:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

main();
