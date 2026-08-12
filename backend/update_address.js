import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('No MONGODB_URI found in .env');
  process.exit(1);
}

const updateAddress = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const db = mongoose.connection.useDb('daas_poc');
    
    // The restaurant is saved in the daas_poc (default/marketplace) database under 'restaurants' collection
    const result = await db.collection('restaurants').updateOne(
      { name: 'Lassi Lounge' },
      { $set: { address: '9408 118th St, South Richmond Hill, NY 11419' } }
    );
    
    console.log(`Matched ${result.matchedCount} document(s) and modified ${result.modifiedCount} document(s).`);

    // Let's also check if there is a tenant database for lassi-lounge that needs updating, though restaurants are usually in the master db.
    // Tenant databases usually store menus, orders, etc.
    
    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (error) {
    console.error('Error updating address:', error);
    process.exit(1);
  }
};

updateAddress();
