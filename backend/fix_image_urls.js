/**
 * One-time migration script:
 * Updates any MenuItem, Restaurant, or Category image URLs stored with
 * 127.0.0.1:5001 or localhost to the production API URL (https://api.lassiloungeny.com)
 * or relative URL to eliminate HTTPS mixed-content warnings.
 *
 * Usage:
 *   node backend/fix_image_urls.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const TARGET_API_URL = process.env.API_URL || 'https://api.lassiloungeny.com';

const fixUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    return url.replace(/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?/, TARGET_API_URL);
  }
  return url;
};

async function fixMenuItems(db, label) {
  const collection = db.collection('menuitems');
  const items = await collection.find({
    $or: [
      { image: { $regex: '127\\.0\\.0\\.1|localhost' } },
      { images: { $elemMatch: { $regex: '127\\.0\\.0\\.1|localhost' } } }
    ]
  }).toArray();

  let updated = 0;
  for (const item of items) {
    const updates = {};
    if (item.image && typeof item.image === 'string' && (item.image.includes('127.0.0.1') || item.image.includes('localhost'))) {
      updates.image = fixUrl(item.image);
    }
    if (Array.isArray(item.images)) {
      updates.images = item.images.map(fixUrl);
    }

    if (Object.keys(updates).length > 0) {
      await collection.updateOne({ _id: item._id }, { $set: updates });
      updated++;
      console.log(`  [${label}/menuitems] Fixed: ${item.name} -> ${updates.image || ''}`);
    }
  }
  console.log(`✅ [${label}] Updated ${updated} menu item(s).`);
}

async function fixRestaurants(db, label) {
  const collection = db.collection('restaurants');
  const rests = await collection.find({
    $or: [
      { logo: { $regex: '127\\.0\\.0\\.1|localhost' } },
      { banner: { $regex: '127\\.0\\.0\\.1|localhost' } },
      { images: { $elemMatch: { $regex: '127\\.0\\.0\\.1|localhost' } } }
    ]
  }).toArray();

  let updated = 0;
  for (const r of rests) {
    const updates = {};
    if (r.logo) updates.logo = fixUrl(r.logo);
    if (r.banner) updates.banner = fixUrl(r.banner);
    if (Array.isArray(r.images)) updates.images = r.images.map(fixUrl);

    if (Object.keys(updates).length > 0) {
      await collection.updateOne({ _id: r._id }, { $set: updates });
      updated++;
      console.log(`  [${label}/restaurants] Fixed: ${r.name}`);
    }
  }
  console.log(`✅ [${label}] Updated ${updated} restaurant(s).`);
}

async function fixCategories(db, label) {
  const collection = db.collection('categories');
  const cats = await collection.find({
    image: { $regex: '127\\.0\\.0\\.1|localhost' }
  }).toArray();

  let updated = 0;
  for (const c of cats) {
    if (c.image) {
      const fixed = fixUrl(c.image);
      await collection.updateOne({ _id: c._id }, { $set: { image: fixed } });
      updated++;
      console.log(`  [${label}/categories] Fixed: ${c.name}`);
    }
  }
  console.log(`✅ [${label}] Updated ${updated} categorie(s).`);
}

async function fixDatabase(db, label) {
  await fixMenuItems(db, label);
  await fixRestaurants(db, label);
  await fixCategories(db, label);
}

async function main() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/daas_poc';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri.replace(/\/\/.*@/, '//<creds>@'));

    await fixDatabase(mongoose.connection.db, 'default_db');

    const lassiDb = mongoose.connection.useDb('daas_poc_lassi_lounge');
    await fixDatabase(lassiDb, 'daas_poc_lassi_lounge');

    const daasPocDb = mongoose.connection.useDb('daas_poc');
    await fixDatabase(daasPocDb, 'daas_poc');
  } catch (err) {
    console.error('❌ Error updating image URLs:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Done.');
  }
}

main();
