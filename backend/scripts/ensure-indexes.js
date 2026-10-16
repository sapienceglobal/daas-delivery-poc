/**
 * Ensure all Mongoose schema indexes exist on every tenant database.
 *
 * Why: in production `autoIndex` is disabled (db.js), and tenant DBs are
 * opened via `useDb()` — so indexes declared in models are never built
 * automatically. Without them every list/analytics query is a COLLSCAN.
 *
 * Safe for live traffic:
 *  - Uses createIndexes() (only ADDS missing indexes, never drops anything).
 *  - MongoDB 4.2+ / Atlas builds indexes without blocking reads/writes.
 *
 * Usage (from backend/):  node scripts/ensure-indexes.js
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.join(__dirname, '../src/models');

const DEFAULT_TENANT_IDS = ['marketplace', 'lassi-lounge'];

const tenantIds = () => {
  const configured = (process.env.TENANT_IDS || process.env.ALLOWED_TENANT_IDS || '')
    .split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const forced = (process.env.FORCE_TENANT_ID || process.env.DEPLOYMENT_TENANT_ID || '').trim().toLowerCase();
  return [...new Set(['marketplace', ...(configured.length ? configured : DEFAULT_TENANT_IDS), ...(forced ? [forced] : [])])];
};

const dbFor = (tenantId) => {
  if (tenantId === 'marketplace') return mongoose.connection;
  return mongoose.connection.useDb(`daas_poc_${tenantId.replace(/[^a-zA-Z0-9_]/g, '_')}`, { useCache: true });
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri, { autoIndex: false });
  console.log('Connected:', mongoose.connection.host);

  for (const file of fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js'))) {
    await import(pathToFileURL(path.join(modelsDir, file)).href);
  }
  const modelNames = mongoose.modelNames();

  for (const tenantId of tenantIds()) {
    const conn = dbFor(tenantId);
    console.log(`\n=== ${tenantId} (${conn.name}) ===`);
    for (const name of modelNames) {
      const schema = mongoose.model(name).schema;
      const Model = conn.models[name] || conn.model(name, schema);
      try {
        await Model.createIndexes();
        console.log(`  ✓ ${name}`);
      } catch (err) {
        // e.g. a unique index blocked by existing duplicate data — report, don't abort.
        console.warn(`  ✗ ${name}: ${err.message}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('\nDone.');
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
