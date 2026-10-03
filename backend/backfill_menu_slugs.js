/**
 * One-time backfill: give every existing menu item a clean, unique slug.
 *
 *   node backfill_menu_slugs.js
 *
 * - Oldest item keeps the clean slug ("samosa"); later duplicates in the same
 *   restaurant get "samosa-2", "samosa-3" ...
 * - Safe to re-run: items that already have a slug are skipped.
 * - Runs on the main DB and the `daas_poc` tenant DB.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import MenuItem from './src/models/MenuItem.js';

async function backfill(Model, label) {
  const items = await Model.find({ $or: [{ slug: null }, { slug: { $exists: false } }, { slug: '' }] })
    .sort({ createdAt: 1 });

  let updated = 0;
  for (const item of items) {
    item.slug = undefined; // forces the pre-save hook to generate a unique slug
    await item.save({ validateModifiedOnly: true });
    updated++;
    console.log(`  [${label}] ${item.name}  ->  /item/${item.slug}`);
  }
  console.log(`✅ [${label}] ${updated} item(s) backfilled.`);
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    await backfill(MenuItem, 'main');

    const tenantDb = mongoose.connection.useDb('daas_poc');
    const TenantMenuItem = tenantDb.model('MenuItem', MenuItem.schema);
    await backfill(TenantMenuItem, 'daas_poc');
  } catch (err) {
    console.error('❌ Backfill failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
