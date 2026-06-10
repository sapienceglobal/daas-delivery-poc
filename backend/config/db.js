const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

mongoose.set('bufferCommands', false);

const seedData = [
  {
    name: 'Burger Palace',
    cuisine: 'Burgers, Fast Food, Fries',
    rating: 4.8,
    reviews: 140,
    deliveryTime: '15-25 min',
    distance: '1.2 miles',
    address: '100 Main St, San Francisco, CA 94105',
    phone: '+16505550100',
    banner: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    location: {
      type: 'Point',
      coordinates: [-122.39958, 37.79018] // [longitude, latitude]
    },
    status: 'approved',
    menu: [
      { name: 'Classic Cheeseburger', description: 'Angus beef patty, cheddar, lettuce, tomato, special house sauce', price: 9.99, category: 'Mains' },
      { name: 'Bacon Double Cheeseburger', description: 'Two beef patties, double bacon, double cheddar, onion ring', price: 12.99, category: 'Mains' },
      { name: 'Truffle Garlic Fries', description: 'Crispy golden fries tossed in truffle oil and freshly grated garlic', price: 4.99, category: 'Sides' },
      { name: 'Chocolate Milkshake', description: 'Creamy chocolate ice cream whipped with rich fudge syrup', price: 5.49, category: 'Drinks' }
    ]
  },
  {
    name: 'Wasabi Zen',
    cuisine: 'Sushi, Japanese, Bowls',
    rating: 4.9,
    reviews: 210,
    deliveryTime: '20-35 min',
    distance: '2.4 miles',
    address: '200 Pine St, San Francisco, CA 94104',
    phone: '+16505550122',
    banner: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80',
    location: {
      type: 'Point',
      coordinates: [-122.40058, 37.79155]
    },
    status: 'approved',
    menu: [
      { name: 'Spicy Tuna Roll', description: 'Fresh tuna, cucumber, spicy mayo, toasted sesame seeds', price: 11.99, category: 'Mains' },
      { name: 'California Roll', description: 'Kani crab, avocado, cucumber, masago', price: 8.99, category: 'Mains' },
      { name: 'Salmon Teriyaki Bowl', description: 'Grilled salmon, broccoli, rice, glazed in teriyaki reduction', price: 15.99, category: 'Mains' },
      { name: 'Miso Soup', description: 'Traditional dashi broth with tofu, seaweed, and green onion', price: 3.49, category: 'Sides' }
    ]
  },
  {
    name: 'Pizza & Co',
    cuisine: 'Pizza, Italian, Pasta',
    rating: 4.7,
    reviews: 185,
    deliveryTime: '20-30 min',
    distance: '1.8 miles',
    address: '300 Montgomery St, San Francisco, CA 94104',
    phone: '+16505550133',
    banner: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    location: {
      type: 'Point',
      coordinates: [-122.40194, 37.79241]
    },
    status: 'approved',
    menu: [
      { name: 'Pepperoni Pizza', description: 'Thick cut pepperoni, mozzarella cheese, crushed tomato marinara', price: 14.99, category: 'Mains' },
      { name: 'Margherita Pizza', description: 'Fresh mozzarella, sliced vine tomatoes, basil leaves, extra virgin olive oil', price: 12.99, category: 'Mains' },
      { name: 'Caesar Salad', description: 'Crisp romaine, shaved parmesan, garlic croutons, caesar dressing', price: 7.99, category: 'Sides' },
      { name: 'Tiramisu', description: 'Espresso-soaked ladyfingers layered with whipped mascarpone cream', price: 6.49, category: 'Desserts' }
    ]
  },
  {
    name: 'Taco Fiesta',
    cuisine: 'Mexican, Tacos, Burritos',
    rating: 4.6,
    reviews: 95,
    deliveryTime: '10-20 min',
    distance: '0.8 miles',
    address: '400 Bush St, San Francisco, CA 94108',
    phone: '+16505550144',
    banner: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
    location: {
      type: 'Point',
      coordinates: [-122.40384, 37.79075]
    },
    status: 'approved',
    menu: [
      { name: 'Street Tacos (3pcs)', description: 'Three corn tortillas loaded with carne asada, cilantro, chopped onion', price: 9.49, category: 'Mains' },
      { name: 'Super Burrito', description: 'Rice, black beans, chicken, cheese, guacamole wrapped in a flour tortilla', price: 11.99, category: 'Mains' },
      { name: 'Chips & Guacamole', description: 'Warm stone-ground tortilla chips served with fresh house guacamole', price: 5.99, category: 'Sides' },
      { name: 'Horchata', description: 'Sweet, creamy traditional rice milk drink spiced with cinnamon', price: 3.49, category: 'Drinks' }
    ]
  },
  {
    name: 'Taj Mahal Express',
    cuisine: 'Indian, Curry, Naan',
    rating: 4.8,
    reviews: 125,
    deliveryTime: '25-40 min',
    distance: '3.1 miles',
    address: '500 Sutter St, San Francisco, CA 94102',
    phone: '+16505550155',
    banner: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
    location: {
      type: 'Point',
      coordinates: [-122.40873, 37.78918]
    },
    status: 'approved',
    menu: [
      { name: 'Butter Chicken', description: 'Tender chicken pieces simmered in rich creamy tomato butter sauce', price: 16.99, category: 'Mains' },
      { name: 'Chicken Tikka Masala', description: 'Tandoori-grilled chicken chunks served in spiced tomato gravy', price: 16.99, category: 'Mains' },
      { name: 'Garlic Naan', description: 'Fresh clay-oven baked flatbread brushed with garlic and butter', price: 3.99, category: 'Sides' },
      { name: 'Mango Lassi', description: 'Refreshing sweet yogurt beverage blended with ripe mangoes', price: 4.49, category: 'Drinks' }
    ]
  }
];

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/daas_poc';
  const serverSelectionTimeoutMS = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000);

  const conn = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS,
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 0),
    autoIndex: process.env.NODE_ENV !== 'production'
  });

  console.log(`\x1b[36m%s\x1b[0m`, `MongoDB Connected: ${conn.connection.host}`);

  const shouldSeedDemoData =
    process.env.SEED_DEMO_DATA === 'true' ||
    (process.env.SEED_DEMO_DATA !== 'false' && process.env.NODE_ENV !== 'production');

  if (shouldSeedDemoData) {
    
    // Check if database needs a re-seed (missing location field in any document)
    const needsSeed = await Restaurant.countDocuments({ location: { $exists: false } });
    if (needsSeed > 0) {
      console.log('\x1b[33m%s\x1b[0m', 'Old schema detected. Dropping and re-seeding restaurants with coordinates...');
      await Restaurant.deleteMany({});
      await Restaurant.insertMany(seedData);
      console.log('\x1b[32m%s\x1b[0m', 'Successfully seeded default restaurants with coordinates!');
    } else {
      const count = await Restaurant.countDocuments();
      if (count === 0) {
        console.log('\x1b[33m%s\x1b[0m', 'Restaurant collection is empty. Auto-seeding default merchants...');
        await Restaurant.insertMany(seedData);
        console.log('\x1b[32m%s\x1b[0m', 'Successfully seeded default restaurants & menus!');
      }
    }

    // Auto-seed default Admin and Merchant users for testing
    const adminExists = await User.findOne({ email: 'admin@marketplace.com' });
    if (!adminExists) {
      console.log('\x1b[33m%s\x1b[0m', 'Admin user not found. Auto-seeding admin@marketplace.com...');
      const admin = new User({
        name: 'System Administrator',
        email: 'admin@marketplace.com',
        phone: '+16505550199',
        role: 'admin',
        password: 'temp'
      });
      admin.setPassword('adminpassword');
      await admin.save();
      console.log('\x1b[32m%s\x1b[0m', 'Seeded Admin successfully (admin@marketplace.com / adminpassword)');
    }

    const merchantExists = await User.findOne({ email: 'merchant@marketplace.com' });
    if (!merchantExists) {
      console.log('\x1b[33m%s\x1b[0m', 'Merchant user not found. Auto-seeding merchant@marketplace.com...');
      // Link to Burger Palace by default
      const burgerPalace = await Restaurant.findOne({ name: 'Burger Palace' });
      const merchant = new User({
        name: 'Merchant Partner',
        email: 'merchant@marketplace.com',
        phone: '+16505550100',
        role: 'merchant',
        restaurantId: burgerPalace ? burgerPalace._id : null,
        password: 'temp'
      });
      merchant.setPassword('merchantpassword');
      await merchant.save();
      
      if (burgerPalace) {
        burgerPalace.ownerId = merchant._id;
        await burgerPalace.save();
      }
      console.log('\x1b[32m%s\x1b[0m', 'Seeded Merchant successfully (merchant@marketplace.com / merchantpassword)');
    }
  }

  return conn;
};

module.exports = connectDB;
