import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Important: import all models to clear them
import './src/models/Restaurant.js';
import './src/models/Category.js';
import './src/models/MenuItem.js';
import './src/models/User.js';
import './src/models/Order.js';
import './src/models/Review.js';
import './src/models/Coupon.js';
import './src/models/LoyaltyTransaction.js';
import './src/models/Employee.js';
import './src/models/Inventory.js';
import './src/models/Table.js';
import './src/models/Payment.js';
import './src/models/Notification.js';
import './src/models/Supplier.js';
import './src/models/Settlement.js';
import './src/models/Driver.js';

async function resetAndSeed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Clearing collections...');
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    
    console.log('Database cleared successfully.');
    await mongoose.disconnect();
    
    console.log('Done.');
  } catch (error) {
    console.error('Error dropping database:', error);
    process.exit(1);
  }
}

resetAndSeed();
