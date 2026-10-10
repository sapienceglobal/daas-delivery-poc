import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Error: MONGODB_URI not found in backend/.env');
  process.exit(1);
}

const backupDir = path.resolve('..', 'lassi_lounge_backup');

async function runBackup() {
  console.log('=============================================');
  console.log('Starting MongoDB Backup for Lassi Lounge');
  console.log('=============================================');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  console.log(`Connected to database: ${dbName}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const collections = await db.listCollections().toArray();
  console.log(`Found ${collections.length} collections to backup.\n`);

  const summary = {
    database: dbName,
    timestamp: new Date().toISOString(),
    collections: {},
    totalDocuments: 0
  };

  for (const colInfo of collections) {
    const colName = colInfo.name;
    try {
      const docs = await db.collection(colName).find({}).toArray();
      const filePath = path.join(backupDir, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
      summary.collections[colName] = docs.length;
      summary.totalDocuments += docs.length;
      console.log(`  ✓ [${colName}] -> ${docs.length} documents exported`);
    } catch (err) {
      console.error(`  ✗ Error exporting [${colName}]:`, err.message);
    }
  }

  fs.writeFileSync(
    path.join(backupDir, '_backup_summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  console.log('\n=============================================');
  console.log(`Backup completed successfully!`);
  console.log(`Total Collections: ${collections.length}`);
  console.log(`Total Documents: ${summary.totalDocuments}`);
  console.log(`Folder: ${backupDir}`);
  console.log('=============================================\n');

  await mongoose.disconnect();
}

runBackup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
