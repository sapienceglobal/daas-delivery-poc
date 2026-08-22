import asyncHandler from '../utils/asyncHandler.js';
import * as res from '../utils/responseFormatter.js';
import { AppError } from '../middleware/errorHandler.js';
import '../models/Cms.js';

// define the default placeholder CMS content
const defaultCmsConfig = {
  heroBanners: {
    home: '/images/branded/lassi-lounge/hero-spread.jpg',
    menu: '/images/branded/lassi-lounge/hero-spread.jpg',
    orderOnline: '/images/branded/lassi-lounge/hero-spread.jpg',
    checkout: '/images/branded/lassi-lounge/hero-spread.jpg',
    catering: '/images/branded/lassi-lounge/catering-hero.webp',
    bookTable: '/images/branded/lassi-lounge/hero-spread.jpg'
  },
  aboutUs: {
    ownerImage: '/images/branded/lassi-lounge/about/resturant-owner.jpeg',
    restaurantImage: '/images/branded/lassi-lounge/about/lassi-lounge-restaurant_image.jpeg',
    galleryImages: [
      { src: '/images/branded/lassi-lounge/about/gallery-1.jpeg', alt: 'Lassi Lounge Restaurant Exterior' },
      { src: '/images/branded/lassi-lounge/about/gallery-2.jpeg', alt: 'Cozy Dining Area' },
      { src: '/images/branded/lassi-lounge/about/gallery-3.jpeg', alt: 'Traditional Indian Art Mural' },
      { src: '/images/branded/lassi-lounge/about/gallery-4.jpeg', alt: 'Bar Counter with Ambient Lighting' },
      { src: '/images/branded/lassi-lounge/about/gallery-5.jpeg', alt: 'Romantic Candlelit Setting' },
      { src: '/images/branded/lassi-lounge/about/gallery-6.jpeg', alt: 'Romantic Candlelit Setting' }
    ]
  },
  cateringOccasions: [
    { icon: 'Heart', title: 'Weddings', image: '/images/branded/lassi-lounge/catering/weddings.webp' },
    { icon: 'Gift', title: 'Birthday Parties', image: '/images/branded/lassi-lounge/catering/Birthday parties.webp' },
    { icon: 'Briefcase', title: 'Corporate Events', image: '/images/branded/lassi-lounge/catering/Corporate Events.webp' },
    { icon: 'Users', title: 'Family Gatherings', image: '/images/branded/lassi-lounge/catering/Family Gatherings.webp' },
    { icon: 'GraduationCap', title: 'School & College Events', image: '/images/branded/lassi-lounge/catering/School & College Events.webp' },
    { icon: 'Music', title: 'Religious & Cultural Events', image: '/images/branded/lassi-lounge/catering/Religious & Cultural Events.webp' }
  ],
  cateringPackages: [
    {
      id: 'basic',
      name: 'Basic Package',
      price: 12.99,
      popular: true,
      image: '/images/branded/lassi-lounge/catering/Basic Packages .webp',
      features: [
        '2 Appetizers',
        '2 Main Course',
        '1 Rice',
        '1 Bread',
        'Salad & Pickle',
        'Disposable Cutlery'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Package',
      price: 18.99,
      popular: false,
      image: '/images/branded/lassi-lounge/catering/Premium Package.webp',
      features: [
        '3 Appetizers',
        '3 Main Course',
        '1 Rice',
        '2 Breads',
        'Salad, Raita & Pickle',
        'Dessert',
        'Disposable Cutlery'
      ]
    },
    {
      id: 'deluxe',
      name: 'Deluxe Package',
      price: 24.99,
      popular: false,
      image: '/images/branded/lassi-lounge/catering/Deluxe Package.webp',
      features: [
        '4 Appetizers',
        '4 Main Course',
        '2 Rice',
        '2 Breads',
        'Salad, Raita, Pickle & Papad',
        'Dessert',
        'Premium Disposable Cutlery'
      ]
    }
  ],
  bookingSettings: [
    { title: 'Romantic Dinner', desc: 'A cozy ambiance for you and your loved one.', image: '/images/branded/lassi-lounge/hero-spread.jpg' },
    { title: 'Family Gathering', desc: 'Spacious seating for memorable family meals.', image: '/images/branded/lassi-lounge/dishes/veg-thali.jpg' },
    { title: 'Celebrations', desc: 'Make birthdays & anniversaries extra special.', image: '/images/branded/lassi-lounge/dishes/samosa-chaat.jpg' },
    { title: 'Business Meetings', desc: 'Professional setting for your important meetings.', image: '/images/branded/lassi-lounge/dishes/mango-lassi.jpg' },
    { title: 'Private Events', desc: 'Customized arrangements for your private parties.', image: '/images/branded/lassi-lounge/dishes/chicken-tikka-masala.jpg' }
  ]
};

/**
 * @desc    get CMS Config for a restaurant
 * @route   GET /api/cms
 * @access  Public
 */
export const getCmsConfig = asyncHandler(async (req, response) => {
  const { restaurantId } = req.query;

  if (!restaurantId) {
    throw new AppError('Restaurant ID is required', 400);
  }

  const CmsModel = req.getModel('Cms');
  let cms = await CmsModel.findOne({ restaurantId });

  // if no CMS document exists yet, return the default mock data
  if (!cms) {
    return res.success(response, { data: defaultCmsConfig });
  }

  res.success(response, { data: cms });
});

/**
 * @desc    update CMS Config
 * @route   PUT /api/cms
 * @access  Private (Admin/Manager)
 */
export const updateCmsConfig = asyncHandler(async (req, response) => {
  const restaurantId = req.user.restaurantId;

  if (!restaurantId) {
    throw new AppError('Restaurant ID is required', 400);
  }

  const { heroBanners, aboutUs, cateringOccasions, cateringPackages, bookingSettings } = req.body;

  const CmsModel = req.getModel('Cms');
  
  let cms = await CmsModel.findOne({ restaurantId });

  if (cms) {
    cms.heroBanners = heroBanners || cms.heroBanners;
    cms.aboutUs = aboutUs || cms.aboutUs;
    cms.cateringOccasions = cateringOccasions || cms.cateringOccasions;
    cms.cateringPackages = cateringPackages || cms.cateringPackages;
    cms.bookingSettings = bookingSettings || cms.bookingSettings;
    await cms.save();
  } else {
    // merge provided fields with default placeholders for missing fields
    cms = await CmsModel.create({
      restaurantId,
      heroBanners: heroBanners || defaultCmsConfig.heroBanners,
      aboutUs: aboutUs || defaultCmsConfig.aboutUs,
      cateringOccasions: cateringOccasions || defaultCmsConfig.cateringOccasions,
      cateringPackages: cateringPackages || defaultCmsConfig.cateringPackages,
      bookingSettings: bookingSettings || defaultCmsConfig.bookingSettings
    });
  }

  res.success(response, { 
    message: 'CMS configuration updated successfully',
    data: cms 
  });
});
