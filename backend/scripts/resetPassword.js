/**
 * Safe Database Password Reset Script
 * Usage:
 *   node scripts/resetPassword.js "admin@lassiloungeny.com" "NayaPasswordHere"
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const email = process.argv[2] || 'admin@lassiloungeny.com';
const newPassword = process.argv[3];

if (!newPassword) {
  console.error('\n❌ ERROR: Please provide the new password!');
  console.log('Usage: node scripts/resetPassword.js "<email>" "<newPassword>"\n');
  process.exit(1);
}

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('\n❌ ERROR: MONGODB_URI not found in backend .env\n');
  process.exit(1);
}

console.log(`\n⏳ Connecting to database...`);
await mongoose.connect(mongoUri);

try {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    console.error(`\n❌ User with email "${normalizedEmail}" not found in database!\n`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name} (${user.email}) [Role: ${user.role}]`);

  // 1. Hash with scrypt_tuned
  user.setPassword(newPassword);

  // 2. Increment tokenVersion to immediately kick out all existing login sessions
  user.tokenVersion = (user.tokenVersion || 0) + 1;

  // 3. Clear any dangling reset tokens
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  console.log(`\n🎉 Password successfully updated in database!`);
  console.log(`🔑 New Password: ${newPassword}`);
  console.log(`🛡️  Token Version incremented to: ${user.tokenVersion} (All existing sessions/devices logged out)`);
  console.log(`\nMerchant can now log in at the merchant panel with this new password.\n`);
} catch (err) {
  console.error('❌ Failed to update password:', err);
} finally {
  await mongoose.disconnect();
}
