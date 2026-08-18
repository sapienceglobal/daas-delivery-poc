import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Temporary schema for script
const RestaurantSchema = new mongoose.Schema({
  name: String,
  slug: String
});

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  salt: String,
  passwordAlgorithm: String,
  role: String,
  name: String,
  restaurantId: mongoose.Schema.Types.ObjectId,
  isEmailVerified: Boolean,
  isVerified: Boolean
});

UserSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password = crypto.scryptSync(password, this.salt, 64).toString('hex');
  this.passwordAlgorithm = 'scrypt';
};

const Restaurant = mongoose.model('Restaurant', RestaurantSchema);
const User = mongoose.model('User', UserSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Find restaurant by partial name or slug
    const restaurant = await Restaurant.findOne({
      $or: [
        { slug: 'lassi-lounge' },
        { name: /Lassi Lounge/i }
      ]
    });
    
    let restaurantId = null;
    if (restaurant) {
      console.log('Found restaurant:', restaurant._id);
      restaurantId = restaurant._id;
    } else {
      console.log('Warning: Lassi Lounge restaurant not found in DB. Leaving restaurantId null.');
    }
    
    const email = 'admin@lassiloungeny.com';
    const rawPassword = 'LL@Admin2026#NYC';
    const role = 'merchant'; // Using correct valid enum value
    
    let user = await User.findOne({ email });
    if (!user) {
      console.log('User not found. Creating...');
      user = new User({
        email,
        role,
        name: 'Lassi Lounge Admin',
        restaurantId,
        isEmailVerified: true,
        isVerified: true
      });
    } else {
      console.log('User found. Updating...');
      user.role = role;
      user.restaurantId = restaurantId;
      user.isEmailVerified = true;
      user.isVerified = true;
    }
    
    user.setPassword(rawPassword);
    await user.save();
    console.log('Admin user ready! You can now log in.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}
run();
