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

// Backup folder inside the project root: database_backup
const baseBackupDir = path.resolve('..', 'database_backup');

async function backupSingleDatabase(client, dbName, targetDir) {
  const db = client.useDb(dbName).db;
  console.log(`\n---------------------------------------------`);
  console.log(`Backing up Database: [${dbName}]`);
  console.log(`---------------------------------------------`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const collections = await db.listCollections().toArray();
  console.log(`Found ${collections.length} collections in [${dbName}].`);

  const summary = {
    database: dbName,
    timestamp: new Date().toISOString(),
    collections: {},
    totalDocuments: 0
  };

  for (const colInfo of collections) {
    const colName = colInfo.name;
    // Skip system collections
    if (colName.startsWith('system.')) continue;

    try {
      const docs = await db.collection(colName).find({}).toArray();
      const filePath = path.join(targetDir, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
      summary.collections[colName] = docs.length;
      summary.totalDocuments += docs.length;
      console.log(`  ✓ [${colName}] -> ${docs.length} documents exported`);
    } catch (err) {
      console.error(`  ✗ Error exporting [${colName}]:`, err.message);
    }
  }

  fs.writeFileSync(
    path.join(targetDir, '_database_summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  return summary;
}

async function runBackup() {
  console.log('=============================================');
  console.log('MongoDB Full Backup Process');
  console.log('=============================================');
  console.log('Connecting to MongoDB Atlas Cluster...');
  
  await mongoose.connect(uri);
  const activeDbName = mongoose.connection.db.databaseName;
  console.log(`Primary active database connected: ${activeDbName}`);

  if (!fs.existsSync(baseBackupDir)) {
    fs.mkdirSync(baseBackupDir, { recursive: true });
  }

  const overallManifest = {
    backupDate: new Date().toISOString(),
    clusterDatabases: [],
    primaryDatabase: activeDbName,
    backupFolder: baseBackupDir,
    totalDocumentsAcrossAllDatabases: 0,
    databaseSummaries: {}
  };

  // 1. Backup primary active database (e.g. daas_poc_lassi_lounge)
  const primaryDir = path.join(baseBackupDir, activeDbName);
  const primarySummary = await backupSingleDatabase(mongoose.connection, activeDbName, primaryDir);
  overallManifest.databaseSummaries[activeDbName] = primarySummary;
  overallManifest.totalDocumentsAcrossAllDatabases += primarySummary.totalDocuments;

  // 2. Also backup daas_poc if it's different and exists on cluster
  if (activeDbName !== 'daas_poc') {
    try {
      const secondaryDir = path.join(baseBackupDir, 'daas_poc');
      const secondarySummary = await backupSingleDatabase(mongoose.connection, 'daas_poc', secondaryDir);
      overallManifest.databaseSummaries['daas_poc'] = secondarySummary;
      overallManifest.totalDocumentsAcrossAllDatabases += secondarySummary.totalDocuments;
    } catch (e) {
      console.warn('Could not backup secondary daas_poc db:', e.message);
    }
  }

  // Save overall master manifest
  fs.writeFileSync(
    path.join(baseBackupDir, 'backup_manifest.json'),
    JSON.stringify(overallManifest, null, 2),
    'utf8'
  );

  console.log('\n=============================================');
  console.log('All Database Backups Completed Successfully!');
  console.log(`Saved To: ${baseBackupDir}`);
  console.log(`Total Documents Exported: ${overallManifest.totalDocumentsAcrossAllDatabases}`);
  console.log('=============================================\n');

  await mongoose.disconnect();
}

runBackup().catch((err) => {
  console.error('Backup process failed:', err);
  process.exit(1);
});
