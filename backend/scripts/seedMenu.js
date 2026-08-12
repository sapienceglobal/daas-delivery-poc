import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Restaurant from '../src/models/Restaurant.js';
import Category from '../src/models/Category.js';
import MenuItem from '../src/models/MenuItem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedMenu() {
  try {
    const mongoUri = process.env.MONGODB_URI.replace('/daas_poc?', '/daas_poc_lassi_lounge?');
    await mongoose.connect(mongoUri);
    console.log(`Connected to DB: daas_poc_lassi_lounge`);

    // 1. Read JSON file
    const dataPath = path.join(__dirname, 'menuData.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const menuData = JSON.parse(rawData);

    // 2. Find Restaurant (Lassi Lounge or the active one)
    let restaurant = await Restaurant.findOne({ name: { $regex: new RegExp(menuData.restaurant.name, 'i') } });
    if (!restaurant) {
      restaurant = await Restaurant.findOne({ status: 'active' }); // Fallback to first active
      if (!restaurant) {
        console.error('No restaurant found to attach the menu to!');
        process.exit(1);
      }
    }
    const restaurantId = restaurant._id;
    console.log(`Seeding menu for restaurant: ${restaurant.name} (${restaurantId})`);

    // 3. Optional: Clear existing menu for this restaurant (Commented out for safety)
    // await Category.deleteMany({ restaurantId });
    // await MenuItem.deleteMany({ restaurantId });
    // console.log('Cleared existing categories and items');

    // 4. Iterate over Categories
    let categorySort = 0;
    let itemsAdded = 0;

    for (const catData of menuData.categories) {
      categorySort += 10;
      
      // Find or create Category
      let category = await Category.findOne({ restaurantId, name: catData.category });
      if (!category) {
        category = await Category.create({
          name: catData.category,
          restaurantId,
          sortOrder: categorySort,
          isActive: true
        });
        console.log(`Created Category: ${category.name}`);
      } else {
        console.log(`Found existing Category: ${category.name}`);
      }

      // 5. Iterate over Items
      let itemSort = 0;
      for (const itemData of catData.items) {
        itemSort += 10;
        
        // Find or create Item
        let menuItem = await MenuItem.findOne({ restaurantId, categoryId: category._id, name: itemData.name });
        
        if (!menuItem) {
          await MenuItem.create({
            name: itemData.name,
            description: itemData.description || '',
            price: itemData.price,
            restaurantId,
            categoryId: category._id,
            sortOrder: itemSort,
            isAvailable: true,
            isVeg: catData.category.toLowerCase().includes('veg') && !catData.category.toLowerCase().includes('non'),
          });
          itemsAdded++;
          console.log(`  + Added Item: ${itemData.name} ($${itemData.price})`);
        } else {
           // Optionally update price if it exists
           menuItem.price = itemData.price;
           if (itemData.description) menuItem.description = itemData.description;
           await menuItem.save();
           console.log(`  ~ Updated Item: ${itemData.name} ($${itemData.price})`);
        }
      }
    }

    console.log(`\n✅ Menu seeding completed successfully! Added ${itemsAdded} new items.`);
    process.exit(0);

  } catch (error) {
    console.error('Error seeding menu:', error);
    process.exit(1);
  }
}

seedMenu();
