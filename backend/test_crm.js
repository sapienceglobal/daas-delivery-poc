import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order.js';
import Restaurant from './src/models/Restaurant.js';
import User from './src/models/User.js';
import Customer from './src/models/Customer.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB:', process.env.MONGODB_URI);

  const rest = await Restaurant.findOne({ name: 'Lassi Lounge' });
  console.log('Restaurant:', rest ? rest._id : 'Not found');

  if (rest) {
    const orders = await Order.find({ restaurantId: rest._id }).limit(5);
    console.log('Orders found:', orders.length);
    if (orders.length > 0) {
      console.log('Sample Order:', orders[0].customerName, orders[0].customerEmail, orders[0].customerPhone);
    }
    
    const count = await Order.countDocuments({ restaurantId: rest._id });
    console.log('Total orders:', count);

    const agg = await Order.aggregate([
      { $match: { restaurantId: rest._id } },
      {
        $group: {
          _id: {
            email: { $toLower: { $ifNull: ["$customerEmail", ""] } },
            phone: { $ifNull: ["$customerPhone", ""] }
          },
          name: { $last: "$customerName" }, 
          userId: { $last: "$userId" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ]);
    console.log('Aggregation results count:', agg.length);
    if (agg.length > 0) {
      console.log('Sample agg:', agg[0]);
    }
  }

  const manual = await Customer.find({ restaurantId: rest?._id });
  console.log('Manual customers:', manual.length);

  process.exit(0);
}

run();
