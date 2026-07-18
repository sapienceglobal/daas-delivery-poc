import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Models
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';
import Category from './models/Category.js';
import MenuItem from './models/MenuItem.js';
import Table from './models/Table.js';
import Employee from './models/Employee.js';
import Driver from './models/Driver.js';
import Order from './models/Order.js';

dotenv.config(); // Uses .env in current working directory (backend)

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createUser = async (userData, password) => {
  const user = new User(userData);
  user.setPassword(password);
  return await user.save();
};

const seedDatabase = async () => {
  await connectDB();

  console.log('Clearing database...');
  await User.deleteMany();
  await Restaurant.deleteMany();
  await Category.deleteMany();
  await MenuItem.deleteMany();
  await Table.deleteMany();
  await Employee.deleteMany();
  await Driver.deleteMany();
  await Order.deleteMany();

  try {
    console.log('Seeding Users...');

    // 1. Super Admin
    const admin = await createUser({
      name: 'Super Admin',
      email: 'admin@admin.com',
      role: 'admin',
      isVerified: true
    }, 'admin123');

    // 2. Merchants
    const merchantPizza = await createUser({
      name: 'Luigi Pizza',
      email: 'luigi@pizza.com',
      role: 'merchant',
      isVerified: true
    }, 'merchant123');

    const merchantBurger = await createUser({
      name: 'Bob Burger',
      email: 'bob@burger.com',
      role: 'merchant',
      isVerified: true
    }, 'merchant123');

    // 3. Customer
    const customer = await createUser({
      name: 'John Doe',
      email: 'customer@customer.com',
      role: 'customer',
      isVerified: true,
      savedAddresses: [
        { label: 'Home', address: '123 Main St, New York, NY 10001, USA', lat: 40.7128, lng: -74.0060, isDefault: true }
      ]
    }, 'customer123');

    // 4. Driver
    const driverUser = await createUser({
      name: 'Fast Driver',
      email: 'driver@driver.com',
      role: 'driver',
      isVerified: true
    }, 'driver123');

    console.log('Seeding Restaurants...');
    // Create Restaurants
    const pizzaRest = await Restaurant.create({
      name: 'Luigi\'s Pizza',
      ownerId: merchantPizza._id,
      cuisine: 'Italian',
      address: '123 Pizza St, Foodville, NY 10001, USA',
      location: { type: 'Point', coordinates: [-73.935242, 40.730610] },
      phone: '1234567890',
      email: 'contact@luigispizza.com',
      isActive: true,
      status: 'approved',
      acceptsDineIn: true,
      acceptsDelivery: true,
      acceptsPickup: true,
      deliveryTime: '30-45 min',
      deliveryFee: 2.99,
      minimumOrder: 15,
      rating: 4.8,
      reviewCount: 120
    });

    // Update merchant pizza
    merchantPizza.restaurantId = pizzaRest._id;
    await merchantPizza.save();

    const burgerRest = await Restaurant.create({
      name: 'Bob\'s Burgers',
      ownerId: merchantBurger._id,
      cuisine: 'American',
      address: '456 Burger Ave, Foodville, NY 10002, USA',
      location: { type: 'Point', coordinates: [-73.935242, 40.730610] },
      phone: '0987654321',
      email: 'contact@bobsburgers.com',
      isActive: true,
      status: 'approved',
      acceptsDineIn: true,
      acceptsDelivery: true,
      acceptsPickup: true,
      deliveryTime: '20-30 min',
      deliveryFee: 1.99,
      minimumOrder: 10,
      rating: 4.5,
      reviewCount: 85
    });

    // Update merchant burger
    merchantBurger.restaurantId = burgerRest._id;
    await merchantBurger.save();

    console.log('Seeding Categories & Menu Items...');
    // Luigi's Menu
    const pizzaCat = await Category.create({ restaurantId: pizzaRest._id, name: 'Pizzas', sortOrder: 1 });
    const pastaCat = await Category.create({ restaurantId: pizzaRest._id, name: 'Pastas', sortOrder: 2 });

    await MenuItem.create([
      { restaurantId: pizzaRest._id, categoryId: pizzaCat._id, name: 'Margherita Pizza', description: 'Classic cheese and tomato', price: 14.99, isVeg: true },
      { restaurantId: pizzaRest._id, categoryId: pizzaCat._id, name: 'Pepperoni Pizza', description: 'Spicy pepperoni with mozzarella', price: 16.99 },
      { restaurantId: pizzaRest._id, categoryId: pastaCat._id, name: 'Spaghetti Carbonara', description: 'Creamy egg and pancetta sauce', price: 12.99 },
      { restaurantId: pizzaRest._id, categoryId: pastaCat._id, name: 'Lasagna', description: 'Layered meat and cheese pasta', price: 15.99 }
    ]);

    // Bob's Menu
    const burgerCat = await Category.create({ restaurantId: burgerRest._id, name: 'Burgers', sortOrder: 1 });
    const sidesCat = await Category.create({ restaurantId: burgerRest._id, name: 'Sides', sortOrder: 2 });

    await MenuItem.create([
      { restaurantId: burgerRest._id, categoryId: burgerCat._id, name: 'Classic Cheeseburger', description: 'Beef patty with cheddar', price: 8.99 },
      { restaurantId: burgerRest._id, categoryId: burgerCat._id, name: 'Bacon Double Burger', description: 'Two patties with bacon', price: 12.99 },
      { restaurantId: burgerRest._id, categoryId: sidesCat._id, name: 'French Fries', description: 'Crispy golden fries', price: 3.99, isVeg: true },
      { restaurantId: burgerRest._id, categoryId: sidesCat._id, name: 'Onion Rings', description: 'Beer-battered onion rings', price: 4.99, isVeg: true }
    ]);

    console.log('Seeding Tables...');
    await Table.create([
      { restaurantId: pizzaRest._id, tableNumber: 'T1', capacity: 4, shape: 'square' },
      { restaurantId: pizzaRest._id, tableNumber: 'T2', capacity: 2, shape: 'round' },
      { restaurantId: burgerRest._id, tableNumber: '1', capacity: 4, shape: 'square' },
      { restaurantId: burgerRest._id, tableNumber: '2', capacity: 6, shape: 'rectangle' }
    ]);

    console.log('Seeding Employees...');
    await Employee.create([
      { restaurantId: pizzaRest._id, userId: merchantPizza._id, firstName: 'Luigi', lastName: 'Mario', role: 'manager', pin: '1111', phone: '1112223333' },
      { restaurantId: pizzaRest._id, firstName: 'Toad', lastName: 'Mushroom', role: 'waiter', pin: '1234', phone: '4445556666' }
    ]);

    console.log('Seeding Drivers...');
    await Driver.create({
      userId: driverUser._id,
      firstName: 'Fast',
      lastName: 'Driver',
      phone: '9998887777',
      vehicleType: 'motorcycle',
      status: 'online',
      isApproved: true,
      currentLocation: { type: 'Point', coordinates: [ -73.935242, 40.730610 ] } // NYC approx
    });

    console.log('Seeding complete! ✨');
    console.log('\n--- TEST CREDENTIALS ---');
    console.log('Admin Panel    : admin@admin.com / admin123');
    console.log('Merchant Panel : luigi@pizza.com / merchant123');
    console.log('Merchant Panel : bob@burger.com / merchant123');
    console.log('Customer Site  : customer@customer.com / customer123');
    console.log('Driver App     : driver@driver.com / driver123');
    console.log('Waitstaff PIN  : 1234 (For POS Clock-in at Luigi\'s Pizza)');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
