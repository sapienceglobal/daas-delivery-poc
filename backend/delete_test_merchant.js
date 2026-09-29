import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import User from './src/models/User.js';

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    const testEmails = ['test@lassilounge.com', 'test@lassiloungeny.com'];
    const result = await User.deleteMany({ email: { $in: testEmails } });

    console.log(`✅ Deleted ${result.deletedCount} test accounts from main db.`);

    const daasPocDb = mongoose.connection.useDb('daas_poc');
    const DaasPocUser = daasPocDb.model('User', User.schema);
    const result2 = await DaasPocUser.deleteMany({ email: { $in: testEmails } });
    console.log(`✅ Deleted ${result2.deletedCount} test accounts from daas_poc db.`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('Error deleting test merchant:', err);
    process.exit(1);
  }
}

main();
