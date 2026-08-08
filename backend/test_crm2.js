import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order.js';
import Restaurant from './src/models/Restaurant.js';
import User from './src/models/User.js';
import Customer from './src/models/Customer.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const restaurantId = '6a6494f911cb0b7ab2e01f6e'; // Replace with whatever roomId is
  
  try {
    const orderStats = await Order.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
      {
        $group: {
          _id: {
            email: { $toLower: { $ifNull: ["$customerEmail", ""] } },
            phone: { $ifNull: ["$customerPhone", ""] }
          },
          name: { $last: "$customerName" }, // taking the most recent name
          userId: { $last: "$userId" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      { $sort: { lastOrderDate: -1 } }
    ]);
    
    console.log("orderStats:", orderStats.length);

    const manualCustomers = await Customer.find({ restaurantId }).lean();
    console.log("manualCustomers:", manualCustomers.length);

    const users = await User.find({ role: 'customer' }).lean();
    const usersByEmail = {};
    users.forEach(u => {
      if (u.email) usersByEmail[u.email.toLowerCase()] = u;
    });

    const uniqueCustomersMap = new Map();
    const addCustomerToMap = (identifier, data) => {
      if (!identifier) return;
      if (uniqueCustomersMap.has(identifier)) {
        const existing = uniqueCustomersMap.get(identifier);
        uniqueCustomersMap.set(identifier, { ...existing, ...data });
      } else {
        uniqueCustomersMap.set(identifier, data);
      }
    };

    manualCustomers.forEach(c => {
      const identifier = (c.email || c.phone || c._id.toString()).toLowerCase();
      addCustomerToMap(identifier, { ...c, _id: c._id.toString(), source: 'manual' });
    });

    orderStats.forEach(stat => {
      const email = stat._id.email;
      const phone = stat._id.phone;
      const identifier = email || phone;
      
      if (!identifier) return;

      let user = null;
      if (email && usersByEmail[email]) {
        user = usersByEmail[email];
      } else if (stat.userId) {
        user = users.find(u => u._id.toString() === stat.userId.toString());
      }

      const existing = uniqueCustomersMap.get(identifier) || {};

      addCustomerToMap(identifier, {
        _id: existing._id || (user ? user._id.toString() : identifier), 
        customerId: existing.customerId || (user ? `#CUST-${user._id.toString().slice(-6).toUpperCase()}` : `#CUST-${identifier.slice(-6).toUpperCase()}`),
        name: existing.name || stat.name || (user ? user.name : 'Guest'),
        email: existing.email || email || (user ? user.email : ''),
        phone: existing.phone || phone || (user ? user.phone : ''),
        group: existing.group || (user ? 'App User' : 'Guest'),
        loyaltyTier: existing.loyaltyTier || 'Bronze',
        totalOrders: Math.max(existing.totalOrders || 0, stat.totalOrders || 0),
        totalSpent: Math.max(existing.totalSpent || 0, stat.totalSpent || 0),
        lastOrderDate: stat.lastOrderDate || existing.lastOrderDate || null,
        status: existing.status || 'Active'
      });
    });

    const uniqueCustomers = Array.from(uniqueCustomersMap.values());
    console.log("FINAL UNIQUE CUSTOMERS:", uniqueCustomers.length);
    console.log(uniqueCustomers[0]);
    
  } catch (err) {
    console.error("ERROR", err);
  }

  process.exit(0);
}
run();
