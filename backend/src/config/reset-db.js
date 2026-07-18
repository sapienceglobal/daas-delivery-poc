/**
 * Drops all collections in the database, then exits.
 * Usage: node src/config/reset-db.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/daas_poc';

async function resetDB() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Dropping all collections...');

  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    await mongoose.connection.db.dropCollection(col.name);
    console.log(`  ✗ Dropped: ${col.name}`);
  }
  console.log(`\nDone — ${collections.length} collections dropped from main DB.`);

  // Drop tenant collections instead of database to avoid Atlas dropDatabase permissions error
  console.log('Dropping tenant collections (daas_poc_lassi_lounge)...');
  const tenantDb = mongoose.connection.useDb('daas_poc_lassi_lounge');
  const tenantCollections = await tenantDb.db.listCollections().toArray();
  for (const col of tenantCollections) {
    await tenantDb.db.dropCollection(col.name);
    console.log(`  ✗ Dropped tenant collection: ${col.name}`);
  }
  console.log(`  ✗ Cleared tenant collections`);

  console.log('\nReset completed. Restart the backend (npm run dev) and re-seed to apply changes.');
  await mongoose.disconnect();
  process.exit(0);
}

resetDB().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
