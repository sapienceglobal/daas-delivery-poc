import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Allow passing custom URI via --uri="mongodb://..."
const args = process.argv.slice(2);
const uriArg = args.find(a => a.startsWith('--uri='))?.replace('--uri=', '').replace(/^["']|["']$/g, '');

const mongoUri = uriArg || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/daas_poc_lassi_lounge';

async function fixNaans() {
  try {
    console.log(`Connecting to MongoDB...`);
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ Connected to DB: ${conn.connection.name} on ${conn.connection.host}`);

    const naanNames = [
      'Plain Naan',
      'Garlic Naan',
      'Chilli Garlic Naan',
      'Bullet Naan'
    ];

    const MenuItem = conn.model('MenuItem', new mongoose.Schema({
      name: String,
      isVeg: Boolean
    }, { strict: false }));

    const result = await MenuItem.updateMany(
      { name: { $in: naanNames } },
      { $set: { isVeg: true } }
    );

    console.log(`\n🎉 Successfully updated ${result.modifiedCount} items to isVeg: true`);

    const updated = await MenuItem.find({ name: { $in: naanNames } }).select('name isVeg').lean();
    console.log('\nVerified items in database:');
    updated.forEach(item => {
      console.log(` • [${item.isVeg ? '🟢 VEG' : '🔴 NON-VEG'}] ${item.name}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating database:', err);
    process.exit(1);
  }
}

fixNaans();
