import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (_) {}
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2).reduce((acc, arg) => {
  const clean = arg.replace(/^--/, '');
  const eqIdx = clean.indexOf('=');
  if (eqIdx === -1) {
    acc[clean] = true;
  } else {
    acc[clean.slice(0, eqIdx)] = clean.slice(eqIdx + 1).replace(/^["']|["']$/g, '');
  }
  return acc;
}, {});

const sourceUri = args.source || process.env.MONGODB_URI;
let targetUri = args.target;

if (!targetUri) {
  console.log(`
❌ Target MongoDB URI missing!

Usage:
  node scripts/migrate_database.mjs --target="mongodb+srv://user:pass@lassi-lounge-prod.5dptktb.mongodb.net/daas_poc_lassi_lounge?retryWrites=true&w=majority"
  `);
  process.exit(1);
}

// Clean target URI
targetUri = targetUri.trim();

async function migrate() {
  console.log('====================================================');
  console.log('🔄 MONGODB DATABASE CLONE & MIGRATION TOOL');
  console.log('====================================================');

  console.log('\n[1/4] Connecting to Source (Personal) Database...');
  const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
  const sourceDb = sourceConn.db;
  console.log(`✅ Connected to Source DB: ${sourceDb.databaseName}`);

  console.log('\n[2/4] Connecting to Target (Company) Database...');
  const targetConn = await mongoose.createConnection(targetUri).asPromise();
  const targetDb = targetConn.db;
  console.log(`✅ Connected to Target DB: ${targetDb.databaseName}`);

  console.log('\n[3/4] Fetching all collections from source database...');
  const collections = await sourceDb.listCollections().toArray();
  console.log(`Found ${collections.length} collections to clone:`);
  console.log(collections.map(c => ` • ${c.name}`).join('\n'));

  console.log('\n[4/4] Migrating data & indexes collection by collection...');
  let totalDocsCloned = 0;

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    const sourceCol = sourceDb.collection(colName);
    const targetCol = targetDb.collection(colName);

    const docCount = await sourceCol.countDocuments({});
    if (docCount === 0) {
      console.log(`⏩ [${colName}] Empty collection (0 docs), skipping data.`);
      continue;
    }

    const docs = await sourceCol.find({}).toArray();

    // Check if target already has docs
    const targetCount = await targetCol.countDocuments({});
    if (targetCount > 0) {
      console.log(`⚠️  [${colName}] Target already has ${targetCount} docs. Clearing target collection before clone...`);
      await targetCol.deleteMany({});
    }

    // Insert all documents with exact _id and properties
    await targetCol.insertMany(docs, { ordered: false });
    totalDocsCloned += docs.length;

    // Clone indexes
    try {
      const indexes = await sourceCol.indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue; // Skip default primary key
        const { key, name, unique, sparse, background, expireAfterSeconds } = idx;
        await targetCol.createIndex(key, {
          name,
          unique: !!unique,
          sparse: !!sparse,
          background: !!background,
          ...(expireAfterSeconds !== undefined && { expireAfterSeconds })
        });
      }
      console.log(`✅ [${colName}] Cloned ${docs.length} document(s) & indexes.`);
    } catch (idxErr) {
      console.log(`✅ [${colName}] Cloned ${docs.length} document(s) (Note on indexes: ${idxErr.message}).`);
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 MIGRATION COMPLETE!`);
  console.log(`Total Collections Cloned : ${collections.length}`);
  console.log(`Total Documents Cloned   : ${totalDocsCloned}`);
  console.log('====================================================');

  await sourceConn.close();
  await targetConn.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
