import mongoose from 'mongoose';
import Restaurant from '../models/Restaurant.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import Employee from '../models/Employee.js';
import Inventory from '../models/Inventory.js';
import Table from '../models/Table.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import Supplier from '../models/Supplier.js';
import Settlement from '../models/Settlement.js';
import Driver from '../models/Driver.js';
import logger from '../utils/logger.js';

/**
 * Comprehensive production-quality seed script.
 * Fills EVERY field in EVERY schema with realistic, interlinked data.
 */
const seedDemoData = async () => {
  const shouldSeed =
    process.env.SEED_DEMO_DATA === 'true' ||
    (process.env.SEED_DEMO_DATA !== 'false' && process.env.NODE_ENV !== 'production');

  if (!shouldSeed) {
    logger.info('Demo data seeding is disabled');
    return;
  }

  const existingCount = await Restaurant.countDocuments();
  if (existingCount > 0) {
    logger.info(`${existingCount} restaurants already exist — skipping seed`);
    return;
  }

  logger.info('🌱 Starting comprehensive database seed...');

  // ════════════════════════════════════════════════════════════════════════════
  // 1. USERS — Admin, 5 Merchants (1 per restaurant), 5 Customers, 1 Driver
  // ════════════════════════════════════════════════════════════════════════════

  // Admin
  const admin = new User({
    name: 'System Administrator',
    email: 'admin@marketplace.com',
    phone: '+16505550199',
    role: 'admin',
    isVerified: true,
    isActive: true,
    lastLogin: new Date('2026-07-12T08:00:00Z'),
    loyaltyPoints: 0,
    notificationPreferences: { email: true, push: true, sms: true, marketing: false },
    savedAddresses: [{
      label: 'Office',
      address: '1 Market St, San Francisco, CA 94105',
      lat: 37.7941, lng: -122.3950,
      isDefault: true
    }],
    stripeCustomerId: 'cus_admin_demo_001',
    password: 'temp'
  });
  admin.setPassword('adminpassword');
  await admin.save();
  logger.info('  ✓ Admin: admin@marketplace.com / adminpassword');

  // Merchants (one per restaurant)
  const merchantProfiles = [
    { name: 'James Rodriguez', email: 'james@burgerpalace.com', phone: '+16505550100' },
    { name: 'Yuki Tanaka', email: 'yuki@wasabizen.com', phone: '+16505550122' },
    { name: 'Marco Rossi', email: 'marco@pizzaco.com', phone: '+16505550133' },
    { name: 'Carlos Mendez', email: 'carlos@tacofiesta.com', phone: '+16505550144' },
    { name: 'Priya Sharma', email: 'priya@lassilounge.com', phone: '+16505550155' },
  ];

  const merchants = [];
  for (const mp of merchantProfiles) {
    const m = new User({
      ...mp,
      role: 'merchant',
      isVerified: true,
      isActive: true,
      lastLogin: new Date('2026-07-13T06:30:00Z'),
      loyaltyPoints: 0,
      notificationPreferences: { email: true, push: true, sms: true, marketing: true },
      savedAddresses: [],
      stripeCustomerId: `cus_merch_${mp.email.split('@')[0]}`,
      password: 'temp'
    });
    m.setPassword('merchantpassword');
    await m.save();
    merchants.push(m);
  }
  logger.info('  ✓ 5 Merchants created');

  // Customers
  const customerProfiles = [
    {
      name: 'Sarah Johnson', email: 'sarah@gmail.com', phone: '+14155550201',
      addresses: [
        { label: 'Home', address: '450 Folsom St, San Francisco, CA 94105', lat: 37.7888, lng: -122.3956, isDefault: true },
        { label: 'Work', address: '555 California St, San Francisco, CA 94104', lat: 37.7922, lng: -122.4038, isDefault: false }
      ]
    },
    {
      name: 'Michael Chen', email: 'michael.chen@yahoo.com', phone: '+14155550202',
      addresses: [
        { label: 'Home', address: '88 King St, San Francisco, CA 94107', lat: 37.7797, lng: -122.3928, isDefault: true },
        { label: 'Gym', address: '201 Spear St, San Francisco, CA 94105', lat: 37.7913, lng: -122.3933, isDefault: false }
      ]
    },
    {
      name: 'Emily Davis', email: 'emily.davis@outlook.com', phone: '+14155550203',
      addresses: [
        { label: 'Apartment', address: '1200 Market St, San Francisco, CA 94102', lat: 37.7786, lng: -122.4130, isDefault: true }
      ]
    },
    {
      name: 'Raj Patel', email: 'raj.patel@gmail.com', phone: '+14155550204',
      addresses: [
        { label: 'Home', address: '350 Mission St, San Francisco, CA 94105', lat: 37.7906, lng: -122.3964, isDefault: true },
        { label: 'Office', address: '44 Montgomery St, San Francisco, CA 94104', lat: 37.7893, lng: -122.4020, isDefault: false }
      ]
    },
    {
      name: 'Jessica Williams', email: 'jessica.w@gmail.com', phone: '+14155550205',
      addresses: [
        { label: 'Home', address: '950 Mason St, San Francisco, CA 94108', lat: 37.7917, lng: -122.4110, isDefault: true }
      ]
    }
  ];

  const customers = [];
  for (const cp of customerProfiles) {
    const c = new User({
      name: cp.name,
      email: cp.email,
      phone: cp.phone,
      role: 'customer',
      isVerified: true,
      isActive: true,
      lastLogin: new Date('2026-07-13T10:00:00Z'),
      loyaltyPoints: 0, // will be updated after orders
      savedAddresses: cp.addresses,
      notificationPreferences: { email: true, push: true, sms: false, marketing: true },
      stripeCustomerId: `cus_cust_${cp.email.split('@')[0]}`,
      favoriteRestaurants: [],
      favoriteItems: [],
      password: 'temp'
    });
    c.setPassword('password123');
    await c.save();
    customers.push(c);
  }
  logger.info('  ✓ 5 Customers created');

  // Driver
  const driverUser = new User({
    name: 'David Martinez',
    email: 'david.driver@gmail.com',
    phone: '+14155550301',
    role: 'driver',
    isVerified: true,
    isActive: true,
    lastLogin: new Date('2026-07-13T07:00:00Z'),
    savedAddresses: [{ label: 'Home', address: '300 3rd St, San Francisco, CA 94107', lat: 37.7842, lng: -122.3943, isDefault: true }],
    notificationPreferences: { email: true, push: true, sms: true, marketing: false },
    password: 'temp'
  });
  driverUser.setPassword('driverpassword');
  await driverUser.save();
  logger.info('  ✓ Driver: david.driver@gmail.com / driverpassword');

  // ════════════════════════════════════════════════════════════════════════════
  // 2. DRIVER PROFILE
  // ════════════════════════════════════════════════════════════════════════════

  const driver = await Driver.create({
    userId: driverUser._id,
    firstName: 'David',
    lastName: 'Martinez',
    phone: '+14155550301',
    avatar: null,
    vehicleType: 'car',
    vehicleMake: 'Toyota',
    vehicleModel: 'Corolla',
    vehicleColor: 'Silver',
    licensePlate: '7ABC123',
    documents: [
      { type: 'license', url: 'https://storage.example.com/docs/dl_david.pdf', verified: true, uploadedAt: new Date('2026-01-15'), expiresAt: new Date('2030-01-15') },
      { type: 'insurance', url: 'https://storage.example.com/docs/ins_david.pdf', verified: true, uploadedAt: new Date('2026-01-15'), expiresAt: new Date('2027-01-15') },
      { type: 'registration', url: 'https://storage.example.com/docs/reg_david.pdf', verified: true, uploadedAt: new Date('2026-01-15'), expiresAt: new Date('2027-06-01') },
      { type: 'background_check', url: 'https://storage.example.com/docs/bg_david.pdf', verified: true, uploadedAt: new Date('2026-01-10'), expiresAt: null }
    ],
    status: 'online',
    isApproved: true,
    isActive: true,
    currentLocation: { type: 'Point', coordinates: [-122.3950, 37.7870] },
    lastLocationUpdate: new Date('2026-07-13T11:50:00Z'),
    rating: 4.9,
    totalDeliveries: 342,
    totalEarnings: 5130.50,
    currentOrderId: null,
    preferredZones: [
      { name: 'Financial District', coordinates: [-122.4000, 37.7920] },
      { name: 'SoMa', coordinates: [-122.3950, 37.7830] }
    ]
  });
  logger.info('  ✓ Driver profile created');

  // ════════════════════════════════════════════════════════════════════════════
  // 3. RESTAURANTS — 5 real restaurants with ALL fields populated
  // ════════════════════════════════════════════════════════════════════════════

  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const restaurantDefinitions = [
    {
      name: 'Burger Palace',
      description: 'Premium craft burgers made with locally-sourced Angus beef, artisan buns, and secret house sauces. Voted #1 burger joint in SF three years running.',
      cuisine: 'Burgers, Fast Food, American',
      rating: 4.8, reviewCount: 142,
      deliveryTime: '15-25 min', distance: '1.2 miles',
      deliveryFee: 3.99, minimumOrder: 15, deliveryRadius: 12,
      address: '100 Main St, San Francisco, CA 94105',
      phone: '+16505550100',
      email: 'info@burgerpalace.com',
      website: 'https://burgerpalace.com',
      location: { type: 'Point', coordinates: [-122.39958, 37.79018] },
      banner: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=100&q=80',
      images: [
        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=400&q=80'
      ],
      operatingHours: {
        monday: { open: '10:00', close: '22:00', isClosed: false },
        tuesday: { open: '10:00', close: '22:00', isClosed: false },
        wednesday: { open: '10:00', close: '22:00', isClosed: false },
        thursday: { open: '10:00', close: '23:00', isClosed: false },
        friday: { open: '10:00', close: '00:00', isClosed: false },
        saturday: { open: '11:00', close: '00:00', isClosed: false },
        sunday: { open: '11:00', close: '21:00', isClosed: false }
      },
      openTime: '10:00', closeTime: '22:00',
      status: 'approved', isActive: true, isFeatured: true,
      taxRate: 0.0875, commissionRate: 0.15, subscriptionPlan: 'premium',
      businessInfo: {
        legalName: 'Burger Palace LLC',
        dbaName: 'Burger Palace',
        taxIdLast4: '4521',
        businessPhone: '+16505550100',
        businessEmail: 'finance@burgerpalace.com',
        ownerName: 'James Rodriguez',
        ownerTitle: 'CEO & Founder',
        ownerPhone: '+16505550100',
        ownerEmail: 'james@burgerpalace.com',
        entityType: 'llc'
      },
      documents: [
        { name: 'Business License', type: 'business_license', url: 'https://storage.example.com/docs/bp_license.pdf', verified: true, uploadedAt: new Date('2026-01-10') },
        { name: 'Food Handler Permit', type: 'food_permit', url: 'https://storage.example.com/docs/bp_food.pdf', verified: true, uploadedAt: new Date('2026-01-10') },
        { name: 'Liability Insurance', type: 'insurance', url: 'https://storage.example.com/docs/bp_insurance.pdf', verified: true, uploadedAt: new Date('2026-01-12') }
      ],
      onboardingStatus: 'approved',
      onboardingSubmittedAt: new Date('2026-01-10'),
      onboardingReviewedAt: new Date('2026-01-12'),
      onboardingReviewNotes: 'All documents verified. Welcome aboard!',
      acceptsOnlineOrders: true, acceptsDineIn: true, acceptsPickup: true,
      autoAcceptOrders: false, preparationTime: 15,
      stripeAccountId: 'acct_bp_demo_001'
    },
    {
      name: 'Wasabi Zen',
      description: 'Authentic Japanese cuisine featuring premium-grade sushi, sashimi, and traditional bowls prepared by Chef Yuki with 15 years of Michelin-star experience.',
      cuisine: 'Sushi, Japanese, Bowls',
      rating: 4.9, reviewCount: 215,
      deliveryTime: '20-35 min', distance: '2.4 miles',
      deliveryFee: 4.99, minimumOrder: 20, deliveryRadius: 10,
      address: '200 Pine St, San Francisco, CA 94104',
      phone: '+16505550122',
      email: 'hello@wasabizen.com',
      website: 'https://wasabizen.com',
      location: { type: 'Point', coordinates: [-122.40058, 37.79155] },
      banner: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80',
      logo: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=100&q=80',
      images: [
        'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=400&q=80'
      ],
      operatingHours: {
        monday: { open: '11:30', close: '21:30', isClosed: false },
        tuesday: { open: '11:30', close: '21:30', isClosed: false },
        wednesday: { open: '11:30', close: '21:30', isClosed: false },
        thursday: { open: '11:30', close: '22:00', isClosed: false },
        friday: { open: '11:30', close: '23:00', isClosed: false },
        saturday: { open: '12:00', close: '23:00', isClosed: false },
        sunday: { open: '12:00', close: '21:00', isClosed: true }
      },
      openTime: '11:30', closeTime: '21:30',
      status: 'approved', isActive: true, isFeatured: true,
      taxRate: 0.0875, commissionRate: 0.12, subscriptionPlan: 'enterprise',
      businessInfo: {
        legalName: 'Wasabi Zen Inc.',
        dbaName: 'Wasabi Zen',
        taxIdLast4: '7832',
        businessPhone: '+16505550122',
        businessEmail: 'finance@wasabizen.com',
        ownerName: 'Yuki Tanaka',
        ownerTitle: 'Head Chef & Owner',
        ownerPhone: '+16505550122',
        ownerEmail: 'yuki@wasabizen.com',
        entityType: 'corporation'
      },
      documents: [
        { name: 'Business License', type: 'business_license', url: 'https://storage.example.com/docs/wz_license.pdf', verified: true, uploadedAt: new Date('2025-11-01') },
        { name: 'Food Permit', type: 'food_permit', url: 'https://storage.example.com/docs/wz_food.pdf', verified: true, uploadedAt: new Date('2025-11-01') }
      ],
      onboardingStatus: 'approved',
      onboardingSubmittedAt: new Date('2025-11-01'),
      onboardingReviewedAt: new Date('2025-11-03'),
      onboardingReviewNotes: 'Premium partner. Expedited review.',
      acceptsOnlineOrders: true, acceptsDineIn: true, acceptsPickup: true,
      autoAcceptOrders: true, preparationTime: 20,
      stripeAccountId: 'acct_wz_demo_002'
    },
    {
      name: 'Pizza & Co',
      description: 'Wood-fired Neapolitan pizza and handmade pasta from our Italian-born chef. Using imported San Marzano tomatoes, buffalo mozzarella, and 72-hour fermented dough.',
      cuisine: 'Pizza, Italian, Pasta',
      rating: 4.7, reviewCount: 188,
      deliveryTime: '20-30 min', distance: '1.8 miles',
      deliveryFee: 2.99, minimumOrder: 12, deliveryRadius: 15,
      address: '300 Montgomery St, San Francisco, CA 94104',
      phone: '+16505550133',
      email: 'orders@pizzaco.com',
      website: 'https://pizzaco.com',
      location: { type: 'Point', coordinates: [-122.40194, 37.79241] },
      banner: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
      logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=100&q=80',
      images: [],
      operatingHours: {
        monday: { open: '11:00', close: '22:00', isClosed: false },
        tuesday: { open: '11:00', close: '22:00', isClosed: false },
        wednesday: { open: '11:00', close: '22:00', isClosed: false },
        thursday: { open: '11:00', close: '22:00', isClosed: false },
        friday: { open: '11:00', close: '23:30', isClosed: false },
        saturday: { open: '11:00', close: '23:30', isClosed: false },
        sunday: { open: '12:00', close: '21:00', isClosed: false }
      },
      openTime: '11:00', closeTime: '22:00',
      status: 'approved', isActive: true, isFeatured: false,
      taxRate: 0.0875, commissionRate: 0.15, subscriptionPlan: 'basic',
      businessInfo: {
        legalName: 'Pizza & Co LLC',
        dbaName: 'Pizza & Co',
        taxIdLast4: '1190',
        businessPhone: '+16505550133',
        businessEmail: 'marco@pizzaco.com',
        ownerName: 'Marco Rossi',
        ownerTitle: 'Owner',
        ownerPhone: '+16505550133',
        ownerEmail: 'marco@pizzaco.com',
        entityType: 'llc'
      },
      documents: [
        { name: 'Business License', type: 'business_license', url: 'https://storage.example.com/docs/pc_license.pdf', verified: true, uploadedAt: new Date('2026-02-01') }
      ],
      onboardingStatus: 'approved',
      onboardingSubmittedAt: new Date('2026-02-01'),
      onboardingReviewedAt: new Date('2026-02-04'),
      onboardingReviewNotes: '',
      acceptsOnlineOrders: true, acceptsDineIn: false, acceptsPickup: true,
      autoAcceptOrders: false, preparationTime: 20,
      stripeAccountId: 'acct_pc_demo_003'
    },
    {
      name: 'Taco Fiesta',
      description: 'Street-style Mexican food from Oaxaca to your doorstep. Authentic tacos, burritos, and fresh salsas made with hand-pressed tortillas and slow-cooked meats.',
      cuisine: 'Mexican, Tacos, Burritos',
      rating: 4.6, reviewCount: 97,
      deliveryTime: '10-20 min', distance: '0.8 miles',
      deliveryFee: 1.99, minimumOrder: 10, deliveryRadius: 8,
      address: '400 Bush St, San Francisco, CA 94108',
      phone: '+16505550144',
      email: 'hola@tacofiesta.com',
      website: null,
      location: { type: 'Point', coordinates: [-122.40384, 37.79075] },
      banner: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
      logo: null,
      images: [],
      operatingHours: {
        monday: { open: '09:00', close: '22:00', isClosed: false },
        tuesday: { open: '09:00', close: '22:00', isClosed: false },
        wednesday: { open: '09:00', close: '22:00', isClosed: false },
        thursday: { open: '09:00', close: '22:00', isClosed: false },
        friday: { open: '09:00', close: '00:00', isClosed: false },
        saturday: { open: '10:00', close: '00:00', isClosed: false },
        sunday: { open: '10:00', close: '20:00', isClosed: false }
      },
      openTime: '09:00', closeTime: '22:00',
      status: 'approved', isActive: true, isFeatured: false,
      taxRate: 0.0875, commissionRate: 0.15, subscriptionPlan: 'free',
      businessInfo: {
        legalName: 'Taco Fiesta',
        dbaName: 'Taco Fiesta',
        taxIdLast4: '6654',
        businessPhone: '+16505550144',
        businessEmail: 'carlos@tacofiesta.com',
        ownerName: 'Carlos Mendez',
        ownerTitle: 'Owner & Chef',
        ownerPhone: '+16505550144',
        ownerEmail: 'carlos@tacofiesta.com',
        entityType: 'sole_proprietor'
      },
      documents: [
        { name: 'Business License', type: 'business_license', url: 'https://storage.example.com/docs/tf_license.pdf', verified: true, uploadedAt: new Date('2026-03-01') },
        { name: 'Owner ID', type: 'owner_id', url: 'https://storage.example.com/docs/tf_ownerid.pdf', verified: true, uploadedAt: new Date('2026-03-01') }
      ],
      onboardingStatus: 'approved',
      onboardingSubmittedAt: new Date('2026-03-01'),
      onboardingReviewedAt: new Date('2026-03-02'),
      onboardingReviewNotes: 'Approved. Local favorite.',
      acceptsOnlineOrders: true, acceptsDineIn: false, acceptsPickup: true,
      autoAcceptOrders: true, preparationTime: 12,
      stripeAccountId: null
    },
    {
      name: 'Lassi Lounge',
      description: 'Experience the rich and authentic flavors of India. From traditional favorites to modern delights, every dish is made with love.',
      cuisine: 'Indian, Curry, Biryani',
      rating: 4.8, reviewCount: 128,
      deliveryTime: '25-40 min', distance: '3.1 miles',
      deliveryFee: 4.49, minimumOrder: 18, deliveryRadius: 12,
      address: '34 Union Avenue, Patiala, NY 11022',
      phone: '(516) 612-0300',
      email: 'info@lassilounge.com',
      website: 'https://lassilounge.com',
      location: { type: 'Point', coordinates: [-122.40873, 37.78918] },
      banner: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
      logo: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=100&q=80',
      images: [
        'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80'
      ],
      operatingHours: {
        monday: { open: '11:30', close: '22:00', isClosed: false },
        tuesday: { open: '11:30', close: '22:00', isClosed: false },
        wednesday: { open: '11:30', close: '22:00', isClosed: false },
        thursday: { open: '11:30', close: '22:00', isClosed: false },
        friday: { open: '11:30', close: '23:00', isClosed: false },
        saturday: { open: '12:00', close: '23:30', isClosed: false },
        sunday: { open: '12:00', close: '22:00', isClosed: false }
      },
      openTime: '11:30', closeTime: '22:00',
      status: 'approved', isActive: true, isFeatured: true,
      taxRate: 0.0875, commissionRate: 0.13, subscriptionPlan: 'premium',
      businessInfo: {
        legalName: 'Lassi Lounge Corp',
        dbaName: 'Lassi Lounge',
        taxIdLast4: '9918',
        businessPhone: '(516) 612-0300',
        businessEmail: 'priya@lassilounge.com',
        ownerName: 'Priya Sharma',
        ownerTitle: 'Managing Director',
        ownerPhone: '(516) 612-0300',
        ownerEmail: 'priya@lassilounge.com',
        entityType: 'corporation'
      },
      documents: [
        { name: 'Business License', type: 'business_license', url: 'https://storage.example.com/docs/tm_license.pdf', verified: true, uploadedAt: new Date('2025-12-10') },
        { name: 'Food Permit', type: 'food_permit', url: 'https://storage.example.com/docs/tm_food.pdf', verified: true, uploadedAt: new Date('2025-12-10') },
        { name: 'Insurance Certificate', type: 'insurance', url: 'https://storage.example.com/docs/tm_insurance.pdf', verified: true, uploadedAt: new Date('2025-12-12') },
        { name: 'EIN Letter', type: 'ein_letter', url: 'https://storage.example.com/docs/tm_ein.pdf', verified: true, uploadedAt: new Date('2025-12-12') }
      ],
      onboardingStatus: 'approved',
      onboardingSubmittedAt: new Date('2025-12-10'),
      onboardingReviewedAt: new Date('2025-12-14'),
      onboardingReviewNotes: 'Excellent documentation. Premium partner.',
      acceptsOnlineOrders: true, acceptsDineIn: true, acceptsPickup: true,
      autoAcceptOrders: false, preparationTime: 25,
      stripeAccountId: 'acct_tm_demo_005'
    }
  ];

  const restaurants = [];
  for (let i = 0; i < restaurantDefinitions.length; i++) {
    const rd = restaurantDefinitions[i];
    const rest = await Restaurant.create({ ...rd, ownerId: merchants[i]._id });
    restaurants.push(rest);
    // Link merchant to restaurant
    merchants[i].restaurantId = rest._id;
    await merchants[i].save();
  }
  // Link admin's onboardingReviewedBy
  for (const r of restaurants) {
    r.onboardingReviewedBy = admin._id;
    await r.save();
  }
  logger.info('  ✓ 5 Restaurants created with full details');

  // ════════════════════════════════════════════════════════════════════════════
  // 4. CATEGORIES & MENU ITEMS — rich data per restaurant
  // ════════════════════════════════════════════════════════════════════════════

  const menuByRestaurant = [
    // R0: Burger Palace
    [
      { catName: 'Signature Burgers', catDesc: 'Our handcrafted premium burgers', items: [
        { name: 'Classic Cheeseburger', description: 'Angus beef patty, aged cheddar, crisp lettuce, vine tomato, pickles, special house sauce on a brioche bun', price: 9.99, calories: 650, preparationTime: 12, tags: ['beef', 'classic'], isVeg: false, isSpicy: false, isGlutenFree: false, isBestseller: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80', sizeVariations: [{ name: 'Regular', price: 9.99 }, { name: 'Double', price: 13.99 }], addOns: [{ name: 'Extra Cheese', price: 1.50, isDefault: false }, { name: 'Bacon', price: 2.00, isDefault: false }, { name: 'Jalapeños', price: 0.75, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Bacon Double Cheeseburger', description: 'Two smashed beef patties, double hickory-smoked bacon, double American cheese, caramelized onions, tangy BBQ sauce', price: 12.99, calories: 950, preparationTime: 15, tags: ['beef', 'bacon', 'premium'], isBestseller: true, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=300&q=80', sizeVariations: [], addOns: [{ name: 'Fried Egg', price: 1.50, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Mushroom Swiss Burger', description: 'Beef patty topped with sautéed wild mushrooms, melted Swiss cheese, garlic aioli', price: 11.49, calories: 720, preparationTime: 14, tags: ['beef', 'mushroom'], image: null, sizeVariations: [{ name: 'Regular', price: 11.49 }, { name: 'Double', price: 15.49 }], addOns: [{ name: 'Truffle Mayo', price: 1.00, isDefault: false }], discount: { type: 'percentage', value: 10 } },
        { name: 'Veggie Beyond Burger', description: 'Plant-based Beyond patty, vegan cheese, avocado, sprouts, chipotle aioli on a wheat bun', price: 11.99, calories: 520, preparationTime: 12, tags: ['vegan', 'plant-based'], isVeg: true, isVegan: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Sides & Snacks', catDesc: 'Perfect companions to your burger', items: [
        { name: 'Truffle Garlic Fries', description: 'Crispy golden fries tossed in truffle oil with freshly minced roasted garlic and parmesan shavings', price: 5.99, calories: 420, preparationTime: 8, tags: ['fries', 'truffle'], isVeg: true, isBestseller: true, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=300&q=80', sizeVariations: [{ name: 'Regular', price: 5.99 }, { name: 'Large', price: 7.99 }], addOns: [{ name: 'Ranch Dip', price: 0.75, isDefault: false }, { name: 'Cheese Sauce', price: 1.00, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Onion Rings', description: 'Beer-battered thick-cut onion rings served with smoky chipotle dip', price: 4.99, calories: 380, preparationTime: 7, tags: ['fried', 'snack'], isVeg: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Loaded Nachos', description: 'Crispy tortilla chips topped with melted cheese, jalapeños, sour cream, guacamole, and pico de gallo', price: 7.99, calories: 580, preparationTime: 10, tags: ['nachos', 'sharing'], isVeg: true, isSpicy: true, image: null, sizeVariations: [], addOns: [{ name: 'Ground Beef', price: 2.50, isDefault: false }], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Beverages', catDesc: 'Freshly made drinks and shakes', items: [
        { name: 'Chocolate Milkshake', description: 'Creamy chocolate ice cream blended with whole milk and drizzled with rich fudge syrup, topped with whipped cream', price: 5.49, calories: 520, preparationTime: 5, tags: ['milkshake', 'chocolate'], isVeg: true, image: null, sizeVariations: [{ name: 'Regular', price: 5.49 }, { name: 'Large', price: 6.99 }], addOns: [{ name: 'Oreo Crumble', price: 0.75, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Fresh Lemonade', description: 'Hand-squeezed lemons with cane sugar and fresh mint', price: 3.49, calories: 120, preparationTime: 3, tags: ['drink', 'fresh'], isVeg: true, isVegan: true, isGlutenFree: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Desserts', catDesc: 'Sweet endings', items: [
        { name: 'New York Cheesecake', description: 'Dense, creamy cheesecake on a graham cracker crust with strawberry compote', price: 6.99, calories: 450, preparationTime: 3, tags: ['dessert', 'cheesecake'], isVeg: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]}
    ],
    // R1: Wasabi Zen
    [
      { catName: 'Sushi Rolls', catDesc: 'Hand-rolled artisan sushi', items: [
        { name: 'Spicy Tuna Roll', description: 'Fresh bluefin tuna, cucumber, spicy mayo, toasted sesame, served with pickled ginger and wasabi', price: 11.99, calories: 320, preparationTime: 15, tags: ['sushi', 'spicy', 'tuna'], isSpicy: true, isBestseller: true, isGlutenFree: true, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80', sizeVariations: [{ name: '6 pcs', price: 11.99 }, { name: '12 pcs', price: 20.99 }], addOns: [{ name: 'Extra Wasabi', price: 0.50, isDefault: false }, { name: 'Soy Sauce Packet', price: 0.00, isDefault: true }], discount: { type: null, value: 0 } },
        { name: 'California Roll', description: 'Kani crab, ripe avocado, cucumber, masago roe, wrapped in sushi rice and nori', price: 8.99, calories: 280, preparationTime: 12, tags: ['sushi', 'crab'], isGlutenFree: true, image: null, sizeVariations: [{ name: '6 pcs', price: 8.99 }, { name: '12 pcs', price: 15.99 }], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Dragon Roll', description: 'Shrimp tempura, eel, avocado on top, drizzled with unagi sauce and sesame', price: 16.99, calories: 480, preparationTime: 18, tags: ['sushi', 'premium', 'eel'], isBestseller: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Rainbow Roll', description: 'California roll topped with assorted sashimi — tuna, salmon, yellowtail, shrimp, avocado', price: 18.99, calories: 420, preparationTime: 20, tags: ['sushi', 'premium'], image: null, sizeVariations: [], addOns: [], discount: { type: 'flat', value: 2.00 } }
      ]},
      { catName: 'Bowls & Entrees', catDesc: 'Hearty Japanese mains', items: [
        { name: 'Salmon Teriyaki Bowl', description: 'Grilled Atlantic salmon glazed in house teriyaki, steamed jasmine rice, broccoli, edamame, pickled carrot', price: 15.99, calories: 580, preparationTime: 18, tags: ['bowl', 'salmon', 'teriyaki'], isBestseller: true, image: null, sizeVariations: [], addOns: [{ name: 'Extra Rice', price: 1.50, isDefault: false }, { name: 'Avocado', price: 2.00, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Chicken Katsu Curry', description: 'Crispy panko-breaded chicken cutlet with Japanese golden curry, steamed rice, and pickled vegetables', price: 14.99, calories: 680, preparationTime: 20, tags: ['curry', 'chicken', 'katsu'], isSpicy: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Sides & Soups', catDesc: 'Traditional accompaniments', items: [
        { name: 'Miso Soup', description: 'Traditional dashi broth with silken tofu, wakame seaweed, and sliced green onion', price: 3.49, calories: 80, preparationTime: 5, tags: ['soup', 'traditional'], isVeg: true, isGlutenFree: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Edamame', description: 'Steamed young soybeans seasoned with sea salt', price: 4.49, calories: 120, preparationTime: 5, tags: ['appetizer', 'healthy'], isVeg: true, isVegan: true, isGlutenFree: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Gyoza (6 pcs)', description: 'Pan-fried pork and vegetable dumplings with ponzu dipping sauce', price: 6.99, calories: 320, preparationTime: 10, tags: ['dumpling', 'appetizer'], image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]}
    ],
    // R2: Pizza & Co
    [
      { catName: 'Wood-Fired Pizzas', catDesc: 'Traditional Neapolitan style, 72h fermented dough', items: [
        { name: 'Pepperoni Pizza', description: 'Thick-cut pepperoni, fresh mozzarella, crushed San Marzano tomato sauce on 72-hour fermented dough', price: 14.99, calories: 850, preparationTime: 20, tags: ['pepperoni', 'classic'], isBestseller: true, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=300&q=80', sizeVariations: [{ name: 'Small 10"', price: 10.99 }, { name: 'Medium 12"', price: 14.99 }, { name: 'Large 16"', price: 18.99 }], addOns: [{ name: 'Extra Cheese', price: 2.00, isDefault: false }, { name: 'Extra Pepperoni', price: 2.50, isDefault: false }, { name: 'Garlic Crust', price: 1.00, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Margherita Pizza', description: 'Buffalo mozzarella, sliced vine tomatoes, fresh basil, extra virgin olive oil drizzle', price: 12.99, calories: 720, preparationTime: 18, tags: ['margherita', 'vegetarian', 'classic'], isVeg: true, image: null, sizeVariations: [{ name: 'Small 10"', price: 8.99 }, { name: 'Medium 12"', price: 12.99 }, { name: 'Large 16"', price: 16.99 }], addOns: [{ name: 'Burrata', price: 3.00, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'BBQ Chicken Pizza', description: 'Grilled chicken, red onions, cilantro, smoked gouda, tangy BBQ sauce base', price: 15.99, calories: 800, preparationTime: 20, tags: ['chicken', 'bbq'], image: null, sizeVariations: [{ name: 'Medium 12"', price: 15.99 }, { name: 'Large 16"', price: 19.99 }], addOns: [], discount: { type: 'percentage', value: 15 } },
        { name: 'Four Cheese Pizza', description: 'Mozzarella, gorgonzola, fontina, and parmesan on a garlic cream base', price: 13.99, calories: 780, preparationTime: 18, tags: ['cheese', 'vegetarian'], isVeg: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Pasta', catDesc: 'Handmade daily', items: [
        { name: 'Fettuccine Alfredo', description: 'Fresh fettuccine in a rich parmesan cream sauce with cracked black pepper', price: 13.99, calories: 680, preparationTime: 15, tags: ['pasta', 'cream'], isVeg: true, image: null, sizeVariations: [], addOns: [{ name: 'Grilled Chicken', price: 3.00, isDefault: false }, { name: 'Shrimp', price: 4.00, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Spaghetti Bolognese', description: 'Al dente spaghetti with slow-simmered Bolognese meat sauce and shaved parmesan', price: 14.49, calories: 620, preparationTime: 15, tags: ['pasta', 'meat'], image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Salads & Sides', catDesc: 'Fresh starters', items: [
        { name: 'Caesar Salad', description: 'Crisp romaine, shaved parmesan, garlic croutons, house-made caesar dressing', price: 7.99, calories: 280, preparationTime: 8, tags: ['salad', 'classic'], isVeg: true, image: null, sizeVariations: [], addOns: [{ name: 'Grilled Chicken', price: 3.00, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Garlic Bread', description: 'Toasted ciabatta bread with garlic butter, herbs, and melted mozzarella', price: 4.99, calories: 320, preparationTime: 8, tags: ['bread', 'appetizer'], isVeg: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Desserts', catDesc: 'Italian dolci', items: [
        { name: 'Tiramisu', description: 'Espresso-soaked ladyfingers layered with whipped mascarpone cream, dusted with cocoa', price: 6.49, calories: 420, preparationTime: 5, tags: ['dessert', 'italian'], isVeg: true, isBestseller: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Panna Cotta', description: 'Vanilla bean panna cotta with mixed berry compote and fresh mint', price: 5.99, calories: 340, preparationTime: 5, tags: ['dessert', 'cream'], isVeg: true, isGlutenFree: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]}
    ],
    // R3: Taco Fiesta
    [
      { catName: 'Tacos', catDesc: 'Authentic street-style tacos', items: [
        { name: 'Street Tacos (3 pcs)', description: 'Three double corn tortillas loaded with carne asada, fresh cilantro, diced onion, and salsa verde', price: 9.49, calories: 480, preparationTime: 10, tags: ['taco', 'beef'], isBestseller: true, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=300&q=80', sizeVariations: [], addOns: [{ name: 'Extra Salsa', price: 0.50, isDefault: false }, { name: 'Sour Cream', price: 0.75, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Fish Tacos (2 pcs)', description: 'Beer-battered mahi mahi, shredded cabbage, lime crema, pico de gallo on flour tortillas', price: 10.99, calories: 420, preparationTime: 12, tags: ['taco', 'fish', 'seafood'], image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Al Pastor Tacos (3 pcs)', description: 'Marinated pork with pineapple, onion, cilantro on corn tortillas', price: 10.49, calories: 510, preparationTime: 10, tags: ['taco', 'pork'], isSpicy: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Burritos & Bowls', catDesc: 'Loaded and satisfying', items: [
        { name: 'Super Burrito', description: 'Flour tortilla stuffed with Mexican rice, black beans, grilled chicken, cheese, sour cream, guacamole, and pico de gallo', price: 11.99, calories: 780, preparationTime: 12, tags: ['burrito', 'chicken'], isBestseller: true, image: null, sizeVariations: [], addOns: [{ name: 'Extra Guac', price: 2.00, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Burrito Bowl', description: 'All the burrito fillings in a bowl — rice, beans, choice of protein, cheese, lettuce, salsa', price: 10.99, calories: 620, preparationTime: 10, tags: ['bowl', 'healthy'], isGlutenFree: true, image: null, sizeVariations: [], addOns: [{ name: 'Steak instead of Chicken', price: 2.50, isDefault: false }], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Sides', catDesc: 'Mexican sides', items: [
        { name: 'Chips & Guacamole', description: 'Warm house-made tortilla chips with freshly prepared guacamole', price: 5.99, calories: 350, preparationTime: 5, tags: ['appetizer', 'guac'], isVeg: true, isVegan: true, isGlutenFree: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Elote (Mexican Corn)', description: 'Grilled corn on the cob with mayo, cotija cheese, chili powder, and lime', price: 4.49, calories: 280, preparationTime: 8, tags: ['corn', 'traditional'], isVeg: true, isSpicy: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Drinks', catDesc: 'Traditional Mexican beverages', items: [
        { name: 'Horchata', description: 'Creamy traditional rice milk drink delicately spiced with cinnamon and vanilla', price: 3.49, calories: 220, preparationTime: 3, tags: ['drink', 'traditional'], isVeg: true, isGlutenFree: true, image: null, sizeVariations: [{ name: 'Regular', price: 3.49 }, { name: 'Large', price: 4.49 }], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Jamaica (Hibiscus Tea)', description: 'Refreshing cold hibiscus flower tea sweetened with cane sugar', price: 2.99, calories: 120, preparationTime: 2, tags: ['drink', 'tea'], isVeg: true, isVegan: true, isGlutenFree: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]}
    ],
    // R4: Taj Mahal Express
    [
      { catName: 'Curries & Mains', catDesc: 'Rich aromatic curries', items: [
        { name: 'Butter Chicken', description: 'Tender tandoori chicken pieces simmered in velvety tomato-butter-cream sauce with kasuri methi, served with basmati rice', price: 16.99, calories: 620, preparationTime: 20, tags: ['chicken', 'curry', 'cream'], isSpicy: true, isBestseller: true, image: '/images/branded/lassi-lounge/dishes/butter-chicken.jpg', sizeVariations: [], addOns: [{ name: 'Extra Rice', price: 2.00, isDefault: false }, { name: 'Naan', price: 2.50, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Lamb Rogan Josh', description: 'Slow-braised lamb shanks in Kashmiri chili and yogurt-based aromatic gravy', price: 18.99, calories: 650, preparationTime: 25, tags: ['lamb', 'curry', 'kashmiri'], isSpicy: true, isBestseller: true, image: '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg', sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Chicken Biryani', description: 'Fragrant basmati rice layered with spiced chicken, saffron, fried onions, served with raita', price: 15.99, calories: 720, preparationTime: 25, tags: ['biryani', 'chicken', 'rice'], isSpicy: true, isBestseller: true, image: '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg', sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Dal Makhani', description: 'Creamy black lentils cooked with butter & spices.', price: 13.99, calories: 420, preparationTime: 18, tags: ['vegetarian', 'dal', 'creamy'], isVeg: true, isBestseller: true, image: '/images/branded/lassi-lounge/dishes/dal-makhani.jpg', sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Chicken Tikka Masala', description: 'Charcoal-grilled chicken tikka in rich spiced tomato masala gravy, garnished with cream and cilantro', price: 16.99, calories: 580, preparationTime: 22, tags: ['chicken', 'tikka', 'masala'], isSpicy: true, isBestseller: false, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80', sizeVariations: [], addOns: [{ name: 'Extra Spicy', price: 0.00, isDefault: false }], discount: { type: null, value: 0 } },
        { name: 'Palak Paneer', description: 'Fresh spinach puree with cubes of house-made paneer, tempered with cumin and garlic', price: 13.99, calories: 380, preparationTime: 18, tags: ['vegetarian', 'paneer', 'spinach'], isVeg: true, isGlutenFree: true, isBestseller: false, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80', sizeVariations: [], addOns: [{ name: 'Extra Paneer', price: 2.50, isDefault: false }], discount: { type: 'flat', value: 1.50 } }
      ]},
      { catName: 'Breads', catDesc: 'Fresh from the clay oven', items: [
        { name: 'Garlic Naan', description: 'Soft leavened bread baked in tandoor, brushed with garlic butter and fresh cilantro', price: 3.99, calories: 260, preparationTime: 8, tags: ['bread', 'naan'], isVeg: true, isBestseller: false, image: 'https://images.unsplash.com/photo-1605333396914-22b0c36b1328?auto=format&fit=crop&w=400&q=80', sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Cheese Naan', description: 'Naan stuffed with a blend of mozzarella and cheddar cheese', price: 4.49, calories: 340, preparationTime: 10, tags: ['bread', 'cheese'], isVeg: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Tandoori Roti', description: 'Whole wheat flatbread baked in the tandoor', price: 2.49, calories: 180, preparationTime: 6, tags: ['bread', 'healthy'], isVeg: true, isVegan: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Appetizers', catDesc: 'Starters & snacks', items: [
        { 
          name: 'Paneer Tikka', 
          description: 'Cottage cheese cubes marinated in a blend of yogurt, spices and herbs, grilled to perfection in a tandoor for a smoky and flavorful taste.', 
          price: 13.99, 
          calories: 320, 
          preparationTime: 25, 
          cookingMethod: 'Tandoor Grilled',
          ingredients: 'Paneer, Yogurt, Ginger Garlic Paste, Lemon Juice, Garam Masala, Turmeric, Red Chili Powder, Cumin Powder, Coriander Powder, Salt, Kasuri Methi, Mustard Oil, Capsicum, Onion.',
          tags: ['vegetarian', 'paneer', 'spicy'], 
          isVeg: true, 
          isSpicy: true, 
          isBestseller: true, 
          image: '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg', 
          sizeVariations: [
            { name: 'Half Portion', price: 8.99 }, 
            { name: 'Full Portion', price: 13.99 }, 
            { name: 'Family Portion (Serves 4)', price: 24.99 }
          ], 
          addOns: [
            { name: 'Extra Paneer', price: 3.00, isDefault: false }, 
            { name: 'Extra Cheese', price: 2.00, isDefault: false }, 
            { name: 'Mint Chutney', price: 1.00, isDefault: false }, 
            { name: 'Mayonnaise Dip', price: 1.00, isDefault: false }, 
            { name: 'Tandoori Roti (2 pcs)', price: 2.50, isDefault: false }
          ], 
          discount: { type: null, value: 0 } 
        },
        { name: 'Samosa (2 pcs)', description: 'Crispy pastry filled with spiced potatoes and green peas, served with mint chutney and tamarind sauce', price: 4.99, calories: 320, preparationTime: 8, tags: ['snack', 'vegetarian'], isVeg: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Chicken Pakora', description: 'Boneless chicken pieces marinated in spices, coated in gram flour batter, deep fried golden', price: 7.99, calories: 380, preparationTime: 12, tags: ['appetizer', 'fried'], isSpicy: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]},
      { catName: 'Beverages', catDesc: 'Indian drinks', items: [
        { name: 'Mango Lassi', description: 'Sweet yogurt beverage blended with ripe Alphonso mango pulp and a hint of cardamom', price: 4.49, calories: 280, preparationTime: 5, tags: ['drink', 'mango', 'yogurt'], isVeg: true, isGlutenFree: true, isBestseller: true, image: '/images/branded/lassi-lounge/dishes/mango-lassi.jpg', sizeVariations: [{ name: 'Regular', price: 4.49 }, { name: 'Large', price: 5.99 }], addOns: [], discount: { type: null, value: 0 } },
        { name: 'Masala Chai', description: 'Strong black tea brewed with whole spices — cardamom, cinnamon, ginger, cloves — and steamed milk', price: 2.99, calories: 90, preparationTime: 5, tags: ['tea', 'traditional'], isVeg: true, isGlutenFree: true, image: null, sizeVariations: [], addOns: [], discount: { type: null, value: 0 } }
      ]}
    ]
  ];

  const allMenuItems = []; // flat array indexed by restaurant
  for (let ri = 0; ri < restaurants.length; ri++) {
    const restItems = [];
    const cats = menuByRestaurant[ri];
    for (let ci = 0; ci < cats.length; ci++) {
      const cat = await Category.create({
        name: cats[ci].catName,
        description: cats[ci].catDesc,
        restaurantId: restaurants[ri]._id,
        sortOrder: ci,
        isActive: true
      });
      for (let ii = 0; ii < cats[ci].items.length; ii++) {
        const itemData = cats[ci].items[ii];
        const item = await MenuItem.create({
          ...itemData,
          restaurantId: restaurants[ri]._id,
          categoryId: cat._id,
          sortOrder: ii,
          isAvailable: true
        });
        restItems.push(item);
      }
    }
    allMenuItems.push(restItems);
  }
  logger.info('  ✓ Categories & menu items created (50+ items across 5 restaurants)');

  // Set some favorite items and restaurants for customers
  for (let ci = 0; ci < customers.length; ci++) {
    customers[ci].favoriteRestaurants = [restaurants[ci % 5]._id, restaurants[(ci + 1) % 5]._id];
    customers[ci].favoriteItems = [allMenuItems[ci % 5][0]._id];
    await customers[ci].save();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. COUPONS
  // ════════════════════════════════════════════════════════════════════════════

  const coupons = await Coupon.insertMany([
    { code: 'WELCOME20', description: '20% off your first order — new customers only!', type: 'percentage', value: 20, maxDiscount: 15, minCartValue: 15, firstOrderOnly: true, maxUses: 1000, maxUsesPerUser: 1, usedCount: 47, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), isActive: true, createdBy: admin._id, specificRestaurant: null, applicableCuisines: [] },
    { code: 'BURGER5', description: '$5 off any Burger Palace order over $20', type: 'flat', value: 5, maxDiscount: null, minCartValue: 20, firstOrderOnly: false, maxUses: 500, maxUsesPerUser: 3, usedCount: 112, startDate: new Date('2026-06-01'), endDate: new Date('2026-09-30'), isActive: true, createdBy: merchants[0]._id, specificRestaurant: restaurants[0]._id, applicableCuisines: ['burgers'] },
    { code: 'FREEDELIVERY', description: 'Free delivery on all orders above $25', type: 'free_delivery', value: 0, maxDiscount: null, minCartValue: 25, firstOrderOnly: false, maxUses: null, maxUsesPerUser: 5, usedCount: 203, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), isActive: true, createdBy: admin._id, specificRestaurant: null, applicableCuisines: [] },
    { code: 'SUSHI10', description: '10% off at Wasabi Zen (max $10 discount)', type: 'percentage', value: 10, maxDiscount: 10, minCartValue: 20, firstOrderOnly: false, maxUses: 200, maxUsesPerUser: 2, usedCount: 58, startDate: new Date('2026-07-01'), endDate: new Date('2026-08-31'), isActive: true, createdBy: merchants[1]._id, specificRestaurant: restaurants[1]._id, applicableCuisines: ['sushi', 'japanese'] },
    { code: 'EXPIRED2025', description: 'Old expired promo', type: 'flat', value: 10, maxDiscount: null, minCartValue: 10, firstOrderOnly: false, maxUses: 100, maxUsesPerUser: 1, usedCount: 100, startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), isActive: false, createdBy: admin._id, specificRestaurant: null, applicableCuisines: [] }
  ]);
  logger.info('  ✓ 5 Coupons created');

  // ════════════════════════════════════════════════════════════════════════════
  // 6. ORDERS — 10 realistic orders across customers & restaurants
  // ════════════════════════════════════════════════════════════════════════════

  const orderDefinitions = [
    // Order 1: Sarah orders from Burger Palace — delivered, rated
    { custIdx: 0, restIdx: 0, items: [{ idx: 0, qty: 1, size: { name: 'Double', price: 13.99 }, addOns: [{ name: 'Bacon', price: 2.00 }] }, { idx: 4, qty: 1, size: { name: 'Regular', price: 5.99 }, addOns: [] }], status: 'delivered', orderType: 'delivery', paymentMethod: 'credit_card', tip: 3.00, couponIdx: 1, rating: 5, review: 'Best burger in the city! The double with bacon is insane.', daysAgo: 25 },
    // Order 2: Michael orders from Wasabi Zen — delivered, rated
    { custIdx: 1, restIdx: 1, items: [{ idx: 0, qty: 2, size: { name: '6 pcs', price: 11.99 }, addOns: [] }, { idx: 4, qty: 1, size: null, addOns: [{ name: 'Extra Rice', price: 1.50 }] }, { idx: 6, qty: 1, size: null, addOns: [] }], status: 'delivered', orderType: 'delivery', paymentMethod: 'credit_card', tip: 5.00, couponIdx: null, rating: 5, review: 'Freshest sushi in SF. The spicy tuna is absolutely phenomenal!', daysAgo: 20 },
    // Order 3: Emily orders from Pizza & Co — delivered, rated
    { custIdx: 2, restIdx: 2, items: [{ idx: 0, qty: 1, size: { name: 'Large 16"', price: 18.99 }, addOns: [{ name: 'Extra Cheese', price: 2.00 }] }, { idx: 6, qty: 1, size: null, addOns: [] }], status: 'delivered', orderType: 'delivery', paymentMethod: 'credit_card', tip: 4.00, couponIdx: null, rating: 4, review: 'Great pizza, crust was perfectly charred. Delivery took a bit long.', daysAgo: 18 },
    // Order 4: Raj orders from Lassi Lounge — delivered, rated
    { custIdx: 3, restIdx: 4, items: [{ idx: 0, qty: 1, size: null, addOns: [{ name: 'Naan', price: 2.50 }] }, { idx: 4, qty: 1, size: null, addOns: [] }, { idx: 5, qty: 2, size: null, addOns: [] }], status: 'delivered', orderType: 'delivery', paymentMethod: 'credit_card', tip: 4.50, couponIdx: null, rating: 5, review: 'Authentic North Indian flavors. Butter chicken is exactly like home!', daysAgo: 15 },
    // Order 5: Jessica orders from Taco Fiesta — delivered, no review
    { custIdx: 4, restIdx: 3, items: [{ idx: 0, qty: 2, size: null, addOns: [{ name: 'Extra Salsa', price: 0.50 }] }, { idx: 3, qty: 1, size: null, addOns: [{ name: 'Extra Guac', price: 2.00 }] }, { idx: 5, qty: 1, size: null, addOns: [] }], status: 'delivered', orderType: 'pickup', paymentMethod: 'cash', tip: 2.00, couponIdx: null, rating: null, review: null, daysAgo: 10 },
    // Order 6: Sarah orders from Wasabi Zen — delivered, rated
    { custIdx: 0, restIdx: 1, items: [{ idx: 2, qty: 1, size: null, addOns: [] }, { idx: 3, qty: 1, size: null, addOns: [] }, { idx: 8, qty: 2, size: null, addOns: [] }], status: 'delivered', orderType: 'delivery', paymentMethod: 'credit_card', tip: 6.00, couponIdx: 3, rating: 5, review: 'Dragon roll is a masterpiece. Will order again!', daysAgo: 7 },
    // Order 7: Michael orders from Burger Palace — preparing (active)
    { custIdx: 1, restIdx: 0, items: [{ idx: 1, qty: 1, size: null, addOns: [{ name: 'Fried Egg', price: 1.50 }] }, { idx: 5, qty: 1, size: null, addOns: [] }, { idx: 7, qty: 1, size: { name: 'Regular', price: 5.49 }, addOns: [] }], status: 'preparing', orderType: 'delivery', paymentMethod: 'credit_card', tip: 3.50, couponIdx: null, rating: null, review: null, daysAgo: 0 },
    // Order 8: Emily orders from Lassi Lounge — pending (just placed)
    { custIdx: 2, restIdx: 4, items: [{ idx: 1, qty: 1, size: null, addOns: [] }, { idx: 3, qty: 1, size: null, addOns: [{ name: 'Extra Paneer', price: 2.50 }] }, { idx: 6, qty: 1, size: null, addOns: [] }, { idx: 9, qty: 2, size: null, addOns: [] }], status: 'pending', orderType: 'delivery', paymentMethod: 'credit_card', tip: 5.00, couponIdx: null, rating: null, review: null, daysAgo: 0 },
    // Order 9: Raj cancels Taco Fiesta order
    { custIdx: 3, restIdx: 3, items: [{ idx: 0, qty: 3, size: null, addOns: [] }], status: 'cancelled', orderType: 'delivery', paymentMethod: 'credit_card', tip: 0, couponIdx: null, rating: null, review: null, daysAgo: 12 },
    // Order 10: Jessica orders from Pizza & Co — delivered, rated
    { custIdx: 4, restIdx: 2, items: [{ idx: 1, qty: 1, size: { name: 'Large 16"', price: 16.99 }, addOns: [{ name: 'Burrata', price: 3.00 }] }, { idx: 4, qty: 1, size: null, addOns: [{ name: 'Grilled Chicken', price: 3.00 }] }, { idx: 8, qty: 1, size: null, addOns: [] }], status: 'delivered', orderType: 'delivery', paymentMethod: 'credit_card', tip: 4.00, couponIdx: null, rating: 4, review: 'Margherita with burrata is divine. Alfredo was rich and creamy.', daysAgo: 5 }
  ];

  const orders = [];
  for (const od of orderDefinitions) {
    const cust = customers[od.custIdx];
    const rest = restaurants[od.restIdx];
    const restMenuItems = allMenuItems[od.restIdx];

    const orderItems = od.items.map(oi => {
      const mi = restMenuItems[oi.idx];
      const unitPrice = oi.size ? oi.size.price : mi.price;
      const addOnTotal = oi.addOns.reduce((s, a) => s + a.price, 0);
      const lineTotal = (unitPrice + addOnTotal) * oi.qty;
      return {
        menuItemId: mi._id,
        name: mi.name,
        price: unitPrice,
        quantity: oi.qty,
        selectedSize: oi.size || { name: null, price: null },
        addOns: oi.addOns,
        specialInstructions: oi.qty > 1 ? 'No special instructions' : '',
        lineTotal
      };
    });

    const subtotal = Math.round(orderItems.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
    const tax = Math.round(subtotal * rest.taxRate * 100) / 100;
    const deliveryFee = od.orderType === 'delivery' ? rest.deliveryFee : 0;
    const platformFee = 2.00;
    const serviceFee = Math.round(subtotal * 0.03 * 100) / 100;
    const couponDiscount = od.couponIdx !== null ? (coupons[od.couponIdx].type === 'flat' ? coupons[od.couponIdx].value : Math.min(subtotal * coupons[od.couponIdx].value / 100, coupons[od.couponIdx].maxDiscount || Infinity)) : 0;
    const loyaltyPointsEarned = od.status === 'delivered' ? Math.floor(subtotal * 10) : 0;

    const createdAt = new Date(now - od.daysAgo * 24 * 60 * 60 * 1000);
    const statusUpdates = [{ status: 'pending', timestamp: createdAt, description: 'Order placed' }];
    if (['accepted', 'preparing', 'ready', 'picked_up', 'delivered'].includes(od.status)) {
      statusUpdates.push({ status: 'accepted', timestamp: new Date(createdAt.getTime() + 2 * 60000), description: 'Restaurant accepted' });
    }
    if (['preparing', 'ready', 'picked_up', 'delivered'].includes(od.status)) {
      statusUpdates.push({ status: 'preparing', timestamp: new Date(createdAt.getTime() + 3 * 60000), description: 'Kitchen started preparing' });
    }
    if (['ready', 'picked_up', 'delivered'].includes(od.status)) {
      statusUpdates.push({ status: 'ready', timestamp: new Date(createdAt.getTime() + 15 * 60000), description: 'Order ready for pickup' });
    }
    if (['picked_up', 'delivered'].includes(od.status)) {
      statusUpdates.push({ status: 'picked_up', timestamp: new Date(createdAt.getTime() + 20 * 60000), description: 'Driver picked up order' });
    }
    if (od.status === 'delivered') {
      statusUpdates.push({ status: 'delivered', timestamp: new Date(createdAt.getTime() + 35 * 60000), description: 'Delivered to customer' });
    }
    if (od.status === 'cancelled') {
      statusUpdates.push({ status: 'cancelled', timestamp: new Date(createdAt.getTime() + 5 * 60000), description: 'Cancelled by customer' });
    }

    const order = new Order({
      userId: cust._id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerEmail: cust.email,
      address: cust.savedAddresses[0]?.address || '123 Main St, SF',
      addressLat: cust.savedAddresses[0]?.lat || 37.79,
      addressLng: cust.savedAddresses[0]?.lng || -122.40,
      restaurantId: rest._id,
      restaurantName: rest.name,
      restaurantAddress: rest.address,
      restaurantPhone: rest.phone,
      items: orderItems,
      orderType: od.orderType,
      subtotal, tax, deliveryFee, platformFee, serviceFee,
      tip: od.tip,
      discount: couponDiscount,
      loyaltyDiscount: 0,
      loyaltyPointsUsed: 0,
      loyaltyPointsEarned,
      couponId: od.couponIdx !== null ? coupons[od.couponIdx]._id : null,
      couponCode: od.couponIdx !== null ? coupons[od.couponIdx].code : null,
      paymentMethod: od.paymentMethod,
      paymentStatus: od.status === 'delivered' ? 'paid' : (od.status === 'cancelled' ? 'refunded' : 'pending'),
      status: od.status,
      statusUpdates,
      rating: od.rating,
      review: od.review,
      refunded: od.status === 'cancelled',
      refundAmount: od.status === 'cancelled' ? subtotal : 0,
      refundReason: od.status === 'cancelled' ? 'Customer requested cancellation' : null,
      driverId: od.orderType === 'delivery' && od.status === 'delivered' ? driver._id : null,
      dasherName: od.orderType === 'delivery' && od.status === 'delivered' ? 'David Martinez' : null,
      dasherPhone: od.orderType === 'delivery' && od.status === 'delivered' ? '+14155550301' : null,
      courierNotes: od.orderType === 'delivery' ? 'Please ring the doorbell' : null,
      stripePaymentIntentId: od.paymentMethod === 'credit_card' ? `pi_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + 35 * 60000)
    });
    await order.save();
    orders.push(order);
  }
  logger.info('  ✓ 10 Orders created');

  // ════════════════════════════════════════════════════════════════════════════
  // 7. REVIEWS — for delivered + rated orders
  // ════════════════════════════════════════════════════════════════════════════

  const reviewData = [];
  for (const o of orders) {
    if (o.rating && o.status === 'delivered') {
      reviewData.push({
        userId: o.userId,
        restaurantId: o.restaurantId,
        orderId: o._id,
        foodRating: o.rating,
        deliveryRating: o.orderType === 'delivery' ? Math.min(5, o.rating) : null,
        overallRating: o.rating,
        title: o.rating === 5 ? 'Amazing experience!' : 'Pretty good overall',
        comment: o.review || '',
        images: [],
        reply: o.rating === 5 ? {
          text: 'Thank you so much for your kind words! We look forward to serving you again.',
          repliedAt: new Date(o.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000),
          repliedBy: merchants[restaurantDefinitions.findIndex(r => r.name === o.restaurantName)]?._id || merchants[0]._id
        } : { text: null, repliedAt: null, repliedBy: null },
        helpfulCount: Math.floor(Math.random() * 8),
        isVisible: true,
        reportCount: 0,
        createdAt: new Date(o.createdAt.getTime() + 60 * 60 * 1000)
      });
    }
  }
  await Review.insertMany(reviewData);
  logger.info(`  ✓ ${reviewData.length} Reviews created`);

  // ════════════════════════════════════════════════════════════════════════════
  // 8. PAYMENTS — one per order
  // ════════════════════════════════════════════════════════════════════════════

  const paymentDocs = orders.map((o, i) => ({
    orderId: o._id,
    userId: o.userId,
    restaurantId: o.restaurantId,
    method: o.paymentMethod,
    status: o.paymentStatus,
    amount: o.total,
    currency: 'USD',
    tip: o.tip,
    stripePaymentIntentId: o.stripePaymentIntentId || null,
    stripeChargeId: o.paymentMethod === 'credit_card' ? `ch_demo_${i}` : null,
    isSplit: false,
    splitParts: [],
    refunds: o.refunded ? [{ amount: o.refundAmount, reason: o.refundReason, stripeRefundId: `re_demo_${i}`, refundedAt: o.updatedAt, refundedBy: admin._id }] : [],
    totalRefunded: o.refundAmount || 0,
    invoiceNumber: `INV-2026-${String(1000 + i).slice(-4)}`,
    receiptUrl: `https://pay.stripe.com/receipts/demo_${i}`,
    failureReason: null,
    metadata: { source: 'web', platform: 'daas-marketplace' }
  }));
  await Payment.insertMany(paymentDocs);
  logger.info('  ✓ 10 Payments created');

  // ════════════════════════════════════════════════════════════════════════════
  // 9. LOYALTY TRANSACTIONS — earned points for delivered orders
  // ════════════════════════════════════════════════════════════════════════════

  let loyaltyBalance = {};
  const loyaltyDocs = [];
  for (const o of orders) {
    if (o.status === 'delivered' && o.loyaltyPointsEarned > 0) {
      const uid = o.userId.toString();
      loyaltyBalance[uid] = (loyaltyBalance[uid] || 0) + o.loyaltyPointsEarned;
      loyaltyDocs.push({
        userId: o.userId,
        orderId: o._id,
        type: 'earned',
        points: o.loyaltyPointsEarned,
        balanceAfter: loyaltyBalance[uid],
        description: `Earned ${o.loyaltyPointsEarned} points from order ${o.orderNumber}`,
        reward: { type: null, value: null, couponId: null },
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        createdAt: o.createdAt
      });
    }
  }
  // Bonus welcome points
  for (const c of customers) {
    const uid = c._id.toString();
    loyaltyBalance[uid] = (loyaltyBalance[uid] || 0) + 100;
    loyaltyDocs.push({
      userId: c._id,
      type: 'bonus',
      points: 100,
      balanceAfter: loyaltyBalance[uid],
      description: 'Welcome bonus — 100 points for signing up!',
      reward: { type: null, value: null, couponId: null },
      expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000)
    });
  }
  await LoyaltyTransaction.insertMany(loyaltyDocs);
  // Update customer loyalty points
  for (const c of customers) {
    const uid = c._id.toString();
    c.loyaltyPoints = loyaltyBalance[uid] || 0;
    await c.save();
  }
  logger.info(`  ✓ ${loyaltyDocs.length} Loyalty transactions created`);

  // ════════════════════════════════════════════════════════════════════════════
  // 10. EMPLOYEES — 2-3 per restaurant
  // ════════════════════════════════════════════════════════════════════════════

  const employeeData = [
    // Burger Palace
    { restIdx: 0, firstName: 'Tom', lastName: 'Wilson', email: 'tom@burgerpalace.com', phone: '+14155551001', role: 'chef', hourlyRate: 22, payType: 'hourly', pin: '1234', schedule: [{ day: 'monday', startTime: '10:00', endTime: '18:00', isOff: false }, { day: 'tuesday', startTime: '10:00', endTime: '18:00', isOff: false }, { day: 'wednesday', startTime: '10:00', endTime: '18:00', isOff: false }, { day: 'thursday', startTime: '10:00', endTime: '18:00', isOff: false }, { day: 'friday', startTime: '10:00', endTime: '22:00', isOff: false }, { day: 'saturday', startTime: '10:00', endTime: '22:00', isOff: false }, { day: 'sunday', startTime: '00:00', endTime: '00:00', isOff: true }], permissions: { canManageMenu: false, canManageOrders: true, canManageEmployees: false, canManageInventory: true, canViewAnalytics: false, canProcessPayments: false } },
    { restIdx: 0, firstName: 'Lisa', lastName: 'Park', email: 'lisa@burgerpalace.com', phone: '+14155551002', role: 'cashier', hourlyRate: 18, payType: 'hourly', pin: '5678', schedule: [{ day: 'monday', startTime: '10:00', endTime: '18:00', isOff: false }, { day: 'tuesday', startTime: '10:00', endTime: '18:00', isOff: false }, { day: 'wednesday', startTime: '00:00', endTime: '00:00', isOff: true }, { day: 'thursday', startTime: '10:00', endTime: '18:00', isOff: false }, { day: 'friday', startTime: '14:00', endTime: '22:00', isOff: false }, { day: 'saturday', startTime: '11:00', endTime: '20:00', isOff: false }, { day: 'sunday', startTime: '11:00', endTime: '19:00', isOff: false }], permissions: { canManageMenu: false, canManageOrders: true, canManageEmployees: false, canManageInventory: false, canViewAnalytics: false, canProcessPayments: true } },
    // Wasabi Zen
    { restIdx: 1, firstName: 'Kenji', lastName: 'Yamamoto', email: 'kenji@wasabizen.com', phone: '+14155551003', role: 'chef', hourlyRate: 28, payType: 'hourly', pin: '2345', schedule: [{ day: 'monday', startTime: '11:00', endTime: '21:00', isOff: false }, { day: 'tuesday', startTime: '11:00', endTime: '21:00', isOff: false }, { day: 'wednesday', startTime: '11:00', endTime: '21:00', isOff: false }, { day: 'thursday', startTime: '11:00', endTime: '22:00', isOff: false }, { day: 'friday', startTime: '11:00', endTime: '23:00', isOff: false }, { day: 'saturday', startTime: '00:00', endTime: '00:00', isOff: true }, { day: 'sunday', startTime: '00:00', endTime: '00:00', isOff: true }], permissions: { canManageMenu: true, canManageOrders: true, canManageEmployees: false, canManageInventory: true, canViewAnalytics: false, canProcessPayments: false } },
    // Pizza & Co
    { restIdx: 2, firstName: 'Antonio', lastName: 'Bianchi', email: 'antonio@pizzaco.com', phone: '+14155551004', role: 'chef', hourlyRate: 24, payType: 'hourly', pin: '3456', schedule: [{ day: 'monday', startTime: '11:00', endTime: '22:00', isOff: false }, { day: 'tuesday', startTime: '11:00', endTime: '22:00', isOff: false }, { day: 'wednesday', startTime: '11:00', endTime: '22:00', isOff: false }, { day: 'thursday', startTime: '11:00', endTime: '22:00', isOff: false }, { day: 'friday', startTime: '11:00', endTime: '23:00', isOff: false }, { day: 'saturday', startTime: '11:00', endTime: '23:00', isOff: false }, { day: 'sunday', startTime: '00:00', endTime: '00:00', isOff: true }], permissions: { canManageMenu: true, canManageOrders: true, canManageEmployees: false, canManageInventory: true, canViewAnalytics: false, canProcessPayments: false } },
    { restIdx: 2, firstName: 'Sofia', lastName: 'Conti', email: 'sofia@pizzaco.com', phone: '+14155551005', role: 'waiter', hourlyRate: 16, payType: 'hourly', pin: '4567', schedule: [{ day: 'monday', startTime: '17:00', endTime: '22:00', isOff: false }, { day: 'tuesday', startTime: '17:00', endTime: '22:00', isOff: false }, { day: 'wednesday', startTime: '00:00', endTime: '00:00', isOff: true }, { day: 'thursday', startTime: '17:00', endTime: '22:00', isOff: false }, { day: 'friday', startTime: '17:00', endTime: '23:00', isOff: false }, { day: 'saturday', startTime: '12:00', endTime: '23:00', isOff: false }, { day: 'sunday', startTime: '12:00', endTime: '21:00', isOff: false }], permissions: { canManageMenu: false, canManageOrders: true, canManageEmployees: false, canManageInventory: false, canViewAnalytics: false, canProcessPayments: true } },
    // Taco Fiesta
    { restIdx: 3, firstName: 'Maria', lastName: 'Garcia', email: 'maria@tacofiesta.com', phone: '+14155551006', role: 'manager', salary: 4200, payType: 'salary', pin: '6789', schedule: [{ day: 'monday', startTime: '09:00', endTime: '17:00', isOff: false }, { day: 'tuesday', startTime: '09:00', endTime: '17:00', isOff: false }, { day: 'wednesday', startTime: '09:00', endTime: '17:00', isOff: false }, { day: 'thursday', startTime: '09:00', endTime: '17:00', isOff: false }, { day: 'friday', startTime: '09:00', endTime: '17:00', isOff: false }, { day: 'saturday', startTime: '00:00', endTime: '00:00', isOff: true }, { day: 'sunday', startTime: '00:00', endTime: '00:00', isOff: true }], permissions: { canManageMenu: true, canManageOrders: true, canManageEmployees: true, canManageInventory: true, canViewAnalytics: true, canProcessPayments: true } },
    // Taj Mahal Express
    { restIdx: 4, firstName: 'Amit', lastName: 'Verma', email: 'amit@tajmahal.com', phone: '+14155551007', role: 'chef', hourlyRate: 26, payType: 'hourly', pin: '7890', schedule: [{ day: 'monday', startTime: '10:00', endTime: '22:00', isOff: false }, { day: 'tuesday', startTime: '10:00', endTime: '22:00', isOff: false }, { day: 'wednesday', startTime: '10:00', endTime: '22:00', isOff: false }, { day: 'thursday', startTime: '10:00', endTime: '22:00', isOff: false }, { day: 'friday', startTime: '10:00', endTime: '23:00', isOff: false }, { day: 'saturday', startTime: '10:00', endTime: '23:00', isOff: false }, { day: 'sunday', startTime: '00:00', endTime: '00:00', isOff: true }], permissions: { canManageMenu: true, canManageOrders: true, canManageEmployees: false, canManageInventory: true, canViewAnalytics: false, canProcessPayments: false } },
    { restIdx: 4, firstName: 'Neha', lastName: 'Kapoor', email: 'neha@tajmahal.com', phone: '+14155551008', role: 'cashier', hourlyRate: 17, payType: 'hourly', pin: '8901', schedule: [{ day: 'monday', startTime: '11:00', endTime: '19:00', isOff: false }, { day: 'tuesday', startTime: '11:00', endTime: '19:00', isOff: false }, { day: 'wednesday', startTime: '11:00', endTime: '19:00', isOff: false }, { day: 'thursday', startTime: '11:00', endTime: '19:00', isOff: false }, { day: 'friday', startTime: '11:00', endTime: '21:00', isOff: false }, { day: 'saturday', startTime: '00:00', endTime: '00:00', isOff: true }, { day: 'sunday', startTime: '12:00', endTime: '20:00', isOff: false }], permissions: { canManageMenu: false, canManageOrders: true, canManageEmployees: false, canManageInventory: false, canViewAnalytics: false, canProcessPayments: true } }
  ];

  for (const ed of employeeData) {
    const todayAttendance = { date: new Date(), clockIn: new Date(now.getTime() - 4 * 60 * 60 * 1000), clockOut: null, hoursWorked: 4, status: 'present', notes: '' };
    const yesterdayAttendance = { date: new Date(now - 24 * 60 * 60 * 1000), clockIn: new Date(now - 28 * 60 * 60 * 1000), clockOut: new Date(now - 20 * 60 * 60 * 1000), hoursWorked: 8, status: 'present', notes: '' };
    await Employee.create({
      restaurantId: restaurants[ed.restIdx]._id,
      firstName: ed.firstName,
      lastName: ed.lastName,
      email: ed.email,
      phone: ed.phone,
      role: ed.role,
      hourlyRate: ed.hourlyRate || 0,
      salary: ed.salary || 0,
      payType: ed.payType,
      pin: ed.pin,
      schedule: ed.schedule,
      permissions: ed.permissions,
      attendance: [yesterdayAttendance, todayAttendance],
      hireDate: new Date('2026-01-15'),
      isActive: true
    });
  }
  logger.info('  ✓ 8 Employees created with schedules & attendance');

  // ════════════════════════════════════════════════════════════════════════════
  // 11. TABLES — for restaurants that accept dine-in
  // ════════════════════════════════════════════════════════════════════════════

  const tableData = [
    // Burger Palace (dine-in)
    { restIdx: 0, tables: [
      { tableNumber: 'T1', capacity: 2, shape: 'square', floor: 'Main', positionX: 50, positionY: 50, status: 'available' },
      { tableNumber: 'T2', capacity: 4, shape: 'rectangle', floor: 'Main', positionX: 150, positionY: 50, status: 'occupied', occupiedAt: new Date(), reservedFor: { customerName: null, customerPhone: null, reservationTime: null, partySize: null } },
      { tableNumber: 'T3', capacity: 6, shape: 'round', floor: 'Main', positionX: 50, positionY: 150, status: 'available' },
      { tableNumber: 'T4', capacity: 2, shape: 'square', floor: 'Patio', positionX: 250, positionY: 50, status: 'reserved', reservedFor: { customerName: 'Alex Brown', customerPhone: '+14155559999', reservationTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), partySize: 2 } },
      { tableNumber: 'T5', capacity: 8, shape: 'rectangle', floor: 'Main', positionX: 150, positionY: 150, status: 'available' }
    ]},
    // Wasabi Zen (dine-in)
    { restIdx: 1, tables: [
      { tableNumber: 'S1', capacity: 2, shape: 'square', floor: 'Main', positionX: 50, positionY: 50, status: 'available' },
      { tableNumber: 'S2', capacity: 4, shape: 'rectangle', floor: 'Main', positionX: 150, positionY: 50, status: 'available' },
      { tableNumber: 'S3', capacity: 6, shape: 'round', floor: 'Private', positionX: 50, positionY: 150, status: 'reserved', reservedFor: { customerName: 'Corporate Event', customerPhone: '+14155558888', reservationTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), partySize: 6 } },
      { tableNumber: 'B1', capacity: 4, shape: 'rectangle', floor: 'Bar', positionX: 250, positionY: 50, status: 'occupied', occupiedAt: new Date(now.getTime() - 30 * 60 * 1000) }
    ]},
    // Taj Mahal Express (dine-in)
    { restIdx: 4, tables: [
      { tableNumber: 'A1', capacity: 2, shape: 'square', floor: 'Main', positionX: 50, positionY: 50, status: 'available' },
      { tableNumber: 'A2', capacity: 4, shape: 'round', floor: 'Main', positionX: 150, positionY: 50, status: 'available' },
      { tableNumber: 'A3', capacity: 8, shape: 'rectangle', floor: 'Private', positionX: 50, positionY: 150, status: 'available' },
      { tableNumber: 'A4', capacity: 4, shape: 'square', floor: 'Main', positionX: 250, positionY: 50, status: 'occupied', occupiedAt: new Date(now.getTime() - 45 * 60 * 1000) }
    ]}
  ];

  for (const td of tableData) {
    for (const t of td.tables) {
      await Table.create({ restaurantId: restaurants[td.restIdx]._id, ...t, isActive: true });
    }
  }
  logger.info('  ✓ 13 Tables created across 3 dine-in restaurants');

  // ════════════════════════════════════════════════════════════════════════════
  // 12. INVENTORY — ingredients per restaurant
  // ════════════════════════════════════════════════════════════════════════════

  const inventoryData = [
    { restIdx: 0, items: [
      { name: 'Ground Beef (Angus)', sku: 'BP-BEEF-001', category: 'Proteins', quantity: 45, unit: 'kg', lowStockThreshold: 10, costPerUnit: 12.50, supplier: { name: 'Bay Area Meats', phone: '+14155552001', email: 'orders@bayareameats.com' }, lastRestockedAt: new Date(now - 3 * 24 * 60 * 60 * 1000), expiresAt: new Date(now + 5 * 24 * 60 * 60 * 1000), purchases: [{ quantity: 50, costPerUnit: 12.50, totalCost: 625, supplier: 'Bay Area Meats', purchasedAt: new Date(now - 3 * 24 * 60 * 60 * 1000), purchasedBy: merchants[0]._id }], wastageLog: [{ quantity: 2, reason: 'Expired before use', loggedAt: new Date(now - 1 * 24 * 60 * 60 * 1000), loggedBy: merchants[0]._id }] },
      { name: 'Burger Buns (Brioche)', sku: 'BP-BUN-001', category: 'Bakery', quantity: 120, unit: 'pieces', lowStockThreshold: 30, costPerUnit: 0.85, supplier: { name: 'Golden Gate Bakery', phone: '+14155552002', email: 'supply@ggbakery.com' }, lastRestockedAt: new Date(now - 1 * 24 * 60 * 60 * 1000), expiresAt: new Date(now + 3 * 24 * 60 * 60 * 1000), purchases: [{ quantity: 150, costPerUnit: 0.85, totalCost: 127.50, supplier: 'Golden Gate Bakery', purchasedAt: new Date(now - 1 * 24 * 60 * 60 * 1000), purchasedBy: merchants[0]._id }], wastageLog: [] },
      { name: 'Cheddar Cheese', sku: 'BP-CHDR-001', category: 'Dairy', quantity: 8, unit: 'kg', lowStockThreshold: 5, costPerUnit: 9.99, supplier: { name: 'Bay Area Meats', phone: '+14155552001', email: 'orders@bayareameats.com' }, lastRestockedAt: new Date(now - 5 * 24 * 60 * 60 * 1000), expiresAt: new Date(now + 14 * 24 * 60 * 60 * 1000), purchases: [], wastageLog: [] },
      { name: 'Russet Potatoes', sku: 'BP-POT-001', category: 'Produce', quantity: 25, unit: 'kg', lowStockThreshold: 8, costPerUnit: 2.50, supplier: { name: 'Fresh Farm Produce', phone: '+14155552003', email: 'info@freshfarm.com' }, lastRestockedAt: new Date(now - 2 * 24 * 60 * 60 * 1000), expiresAt: new Date(now + 10 * 24 * 60 * 60 * 1000), purchases: [], wastageLog: [] }
    ]},
    { restIdx: 4, items: [
      { name: 'Basmati Rice', sku: 'TM-RICE-001', category: 'Grains', quantity: 50, unit: 'kg', lowStockThreshold: 10, costPerUnit: 4.99, supplier: { name: 'India Spice Imports', phone: '+14155552010', email: 'bulk@indiaspice.com' }, lastRestockedAt: new Date(now - 7 * 24 * 60 * 60 * 1000), expiresAt: null, purchases: [{ quantity: 50, costPerUnit: 4.99, totalCost: 249.50, supplier: 'India Spice Imports', purchasedAt: new Date(now - 7 * 24 * 60 * 60 * 1000), purchasedBy: merchants[4]._id }], wastageLog: [] },
      { name: 'Chicken Breast (Boneless)', sku: 'TM-CHKN-001', category: 'Proteins', quantity: 30, unit: 'kg', lowStockThreshold: 8, costPerUnit: 8.99, supplier: { name: 'Bay Area Meats', phone: '+14155552001', email: 'orders@bayareameats.com' }, lastRestockedAt: new Date(now - 2 * 24 * 60 * 60 * 1000), expiresAt: new Date(now + 4 * 24 * 60 * 60 * 1000), purchases: [], wastageLog: [] },
      { name: 'Garam Masala Spice Blend', sku: 'TM-SPICE-001', category: 'Spices', quantity: 3, unit: 'kg', lowStockThreshold: 1, costPerUnit: 18.50, supplier: { name: 'India Spice Imports', phone: '+14155552010', email: 'bulk@indiaspice.com' }, lastRestockedAt: new Date(now - 14 * 24 * 60 * 60 * 1000), expiresAt: new Date(now + 180 * 24 * 60 * 60 * 1000), purchases: [], wastageLog: [] }
    ]}
  ];

  for (const inv of inventoryData) {
    for (const item of inv.items) {
      await Inventory.create({ restaurantId: restaurants[inv.restIdx]._id, ...item, isActive: true });
    }
  }
  logger.info('  ✓ 7 Inventory items created');

  // ════════════════════════════════════════════════════════════════════════════
  // 13. SUPPLIERS
  // ════════════════════════════════════════════════════════════════════════════

  await Supplier.insertMany([
    { restaurantId: restaurants[0]._id, name: 'Bay Area Meats', contactName: 'Robert Hayes', phone: '+14155552001', email: 'orders@bayareameats.com', address: '1200 Evans Ave, San Francisco, CA 94124', itemsProvided: ['Ground Beef', 'Bacon', 'Chicken', 'Cheddar Cheese'], isActive: true },
    { restaurantId: restaurants[0]._id, name: 'Golden Gate Bakery', contactName: 'Michelle Kwon', phone: '+14155552002', email: 'supply@ggbakery.com', address: '1029 Grant Ave, San Francisco, CA 94133', itemsProvided: ['Burger Buns', 'Bread', 'Croutons'], isActive: true },
    { restaurantId: restaurants[0]._id, name: 'Fresh Farm Produce', contactName: 'Daniel Green', phone: '+14155552003', email: 'info@freshfarm.com', address: '100 Alemany Blvd, San Francisco, CA 94110', itemsProvided: ['Potatoes', 'Lettuce', 'Tomatoes', 'Onions', 'Avocados'], isActive: true },
    { restaurantId: restaurants[4]._id, name: 'India Spice Imports', contactName: 'Arjun Mehta', phone: '+14155552010', email: 'bulk@indiaspice.com', address: '2456 Taraval St, San Francisco, CA 94116', itemsProvided: ['Basmati Rice', 'Garam Masala', 'Turmeric', 'Cardamom', 'Saffron'], isActive: true }
  ]);
  logger.info('  ✓ 4 Suppliers created');

  // ════════════════════════════════════════════════════════════════════════════
  // 14. NOTIFICATIONS — sample notifications for customers & merchants
  // ════════════════════════════════════════════════════════════════════════════

  const notifications = [
    { userId: customers[0]._id, title: 'Order Delivered! 🎉', body: 'Your order from Burger Palace has been delivered. Enjoy your meal!', channel: 'push', type: 'order_update', actionUrl: `/customer/orders/${orders[0]._id}`, isRead: true, readAt: new Date(now - 24 * 24 * 60 * 60 * 1000), sentAt: new Date(now - 25 * 24 * 60 * 60 * 1000), metadata: { orderId: orders[0]._id.toString() } },
    { userId: customers[0]._id, title: '20% off your next order!', body: 'Use code WELCOME20 for 20% off. Limited time offer!', channel: 'in_app', type: 'promotion', actionUrl: '/customer', isRead: false, sentAt: new Date(now - 3 * 24 * 60 * 60 * 1000), metadata: { couponCode: 'WELCOME20' } },
    { userId: customers[1]._id, title: 'Your order is being prepared 👨‍🍳', body: 'Burger Palace is preparing your order. Estimated delivery: 20 min.', channel: 'push', type: 'order_update', actionUrl: `/customer/orders/${orders[6]._id}`, isRead: true, readAt: new Date(), sentAt: new Date(), metadata: { orderId: orders[6]._id.toString() } },
    { userId: merchants[0]._id, title: 'New Order Received! 🔔', body: `Order ${orders[6].orderNumber} received from Michael Chen. 3 items, $${orders[6].total.toFixed(2)}.`, channel: 'push', type: 'order_update', actionUrl: '/merchant', isRead: true, readAt: new Date(), sentAt: new Date(), metadata: { orderId: orders[6]._id.toString() } },
    { userId: customers[2]._id, title: 'You earned 100 loyalty points! ⭐', body: 'Welcome to our loyalty program! You\'ve been awarded 100 bonus points.', channel: 'in_app', type: 'loyalty', actionUrl: '/customer/profile', isRead: true, readAt: new Date(now - 28 * 24 * 60 * 60 * 1000), sentAt: new Date(now - 30 * 24 * 60 * 60 * 1000), metadata: { points: 100 } },
    { userId: merchants[4]._id, title: '⭐ New 5-star review!', body: 'Raj Patel left a 5-star review: "Authentic North Indian flavors!"', channel: 'in_app', type: 'review', actionUrl: '/merchant', isRead: false, sentAt: new Date(now - 14 * 24 * 60 * 60 * 1000), metadata: {} },
    { userId: admin._id, title: 'System Update', body: 'Platform update v2.4 deployed successfully. New features: role-based routing, enhanced security.', channel: 'in_app', type: 'system', isRead: true, readAt: new Date(), sentAt: new Date(now - 1 * 24 * 60 * 60 * 1000), metadata: { version: '2.4' } }
  ];
  await Notification.insertMany(notifications);
  logger.info('  ✓ 7 Notifications created');

  // ════════════════════════════════════════════════════════════════════════════
  // 15. SETTLEMENTS — weekly settlement for Burger Palace
  // ════════════════════════════════════════════════════════════════════════════

  const bpOrders = orders.filter(o => o.restaurantId.toString() === restaurants[0]._id.toString() && o.status === 'delivered');
  const bpGross = bpOrders.reduce((s, o) => s + o.subtotal, 0);

  await Settlement.create({
    restaurantId: restaurants[0]._id,
    periodStart: new Date(now - 30 * 24 * 60 * 60 * 1000),
    periodEnd: new Date(now - 23 * 24 * 60 * 60 * 1000),
    totalOrders: bpOrders.length,
    grossSales: bpGross,
    commission: Math.round(bpGross * 0.15 * 100) / 100,
    platformFees: bpOrders.length * 2,
    taxes: Math.round(bpGross * 0.0875 * 100) / 100,
    refunds: 0,
    netPayable: Math.round((bpGross - bpGross * 0.15 - bpOrders.length * 2) * 100) / 100,
    status: 'paid',
    paidAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
    transactionReference: 'TXN-2026-BP-001',
    stripeTransferId: 'tr_demo_bp_001',
    orderIds: bpOrders.map(o => o._id),
    notes: 'Weekly settlement — Week 25, 2026'
  });
  logger.info('  ✓ 1 Settlement created');

  // ════════════════════════════════════════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════════════════════════════════════════

  logger.info('');
  logger.info('🌱 ═══════════════════════════════════════════════════════════');
  logger.info('   SEED COMPLETE — All schemas populated');
  logger.info('   ─────────────────────────────────────────────────────────');
  logger.info('   Login Credentials:');
  logger.info('   ├── Admin:    admin@marketplace.com / adminpassword');
  logger.info('   ├── Merchant: james@burgerpalace.com / merchantpassword');
  logger.info('   ├── Merchant: yuki@wasabizen.com / merchantpassword');
  logger.info('   ├── Merchant: marco@pizzaco.com / merchantpassword');
  logger.info('   ├── Merchant: carlos@tacofiesta.com / merchantpassword');
  logger.info('   ├── Merchant: priya@lassilounge.com / merchantpassword');
  logger.info('   ├── Customer: sarah@gmail.com / password123');
  logger.info('   ├── Customer: michael.chen@yahoo.com / password123');
  logger.info('   ├── Customer: emily.davis@outlook.com / password123');
  logger.info('   ├── Customer: raj.patel@gmail.com / password123');
  logger.info('   ├── Customer: jessica.w@gmail.com / password123');
  logger.info('   └── Driver:   david.driver@gmail.com / driverpassword');
  logger.info('═══════════════════════════════════════════════════════════');
};

export default seedDemoData;
