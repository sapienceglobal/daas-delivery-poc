/**
 * One-Time Merchant Credential Update Script
 * -------------------------------------------
 * Connects directly to the production MongoDB Atlas database (daas_poc_lassi_lounge)
 * and updates the merchant account credentials to an industry-level standard.
 *
 * Run from the backend/ directory:
 *   node scripts/update-merchant-password.js
 */

import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// NEW CREDENTIALS
const OLD_EMAIL = 'priya@lassilounge.com';
const NEW_EMAIL = 'admin@lassiloungeny.com';
const NEW_PASSWORD = 'LL@Admin2026#NYC';

const setPassword = (userDoc, password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  userDoc.password = hash;
  userDoc.salt = salt;
  userDoc.passwordAlgorithm = 'scrypt';
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected:', mongoose.connection.host);

  const dbName = process.env.FORCE_TENANT_DB_NAME || 'daas_poc_lassi_lounge';
  const db = mongoose.connection.useDb(dbName, { useCache: true });

  const UserSchema = new mongoose.Schema({}, { strict: false });
  const User = db.models.User || db.model('User', UserSchema);

  const user = await User.findOne({ email: OLD_EMAIL });
  if (!user) {
    console.error('Merchant account not found:', OLD_EMAIL);
    console.error('DB used:', dbName);
    process.exit(1);
  }

  console.log('Found merchant:', user.name, '|', user.email, '|', user.role);

  setPassword(user, NEW_PASSWORD);
  user.email = NEW_EMAIL;
  user.isEmailVerified = true;
  user.isVerified = true;
  user.isActive = true;
  user.failedLoginAttempts = 0;
  user.loginLockedUntil = null;
  user.updatedAt = new Date();

  await user.save();

  console.log('');
  console.log('=== CREDENTIALS UPDATED SUCCESSFULLY ===');
  console.log('Email    :', NEW_EMAIL);
  console.log('Password :', NEW_PASSWORD);
  console.log('Login URL: https://lassiloungeny.com/admin/login');
  console.log('=========================================');
  console.log('IMPORTANT: Save these in a password manager immediately!');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('Script failed:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
