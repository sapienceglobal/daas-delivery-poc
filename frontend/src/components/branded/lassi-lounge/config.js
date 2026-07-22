/**
 * Static copy + content for the Lassi Lounge branded landing page.
 * Section components import from here rather than hardcoding strings, so
 * copy changes never require touching component/markup code.
 */

export const lassiLoungeConfig = {
  restaurantSlug: 'lassi-lounge',
  contactInfo: {
    address: '34 Union Avenue, Patiala, NY 11022',
    phone: '(516) 612-0300',
    email: 'info@lassilounge.com',
    website: 'https://lassilounge.com'
  },
  operatingHours: [
    { day: 'Monday - Thursday', hours: '11:30 AM - 10:00 PM' },
    { day: 'Friday', hours: '11:30 AM - 11:00 PM' },
    { day: 'Saturday', hours: '12:00 PM - 11:30 PM' },
    { day: 'Sunday', hours: '12:00 PM - 10:00 PM' }
  ],
  defaultTestimonials: [
    { name: 'John D.', location: 'New York, USA', rating: 5, comment: 'The best Indian food I have had in New York! The flavors are authentic and the service is exceptional. Highly recommended!' },
    { name: 'Priya S.', location: 'New Jersey, USA', rating: 5, comment: 'Lassi Lounge never disappoints. Butter chicken and garlic naan are our all-time favorites!' },
    { name: 'Michael R.', location: 'New York, USA', rating: 5, comment: 'Amazing ambience, delicious food and great hospitality. Perfect place for family dinner.' }
  ]
};

export const menuCategoryContent = {
  eyebrow: 'Explore Our Menu',
  viewFullMenuCta: { label: 'View Full Menu', href: '/customer/restaurant/lassi-lounge?tab=menu' },
  categories: [
    { id: 'appetizers', label: 'Appetizers', icon: '/images/branded/lassi-lounge/categories/appetizers.jpg' },
    { id: 'main-course', label: 'Main Course', icon: '/images/branded/lassi-lounge/categories/main-course.jpg' },
    { id: 'biryani', label: 'Biryani', icon: '/images/branded/lassi-lounge/categories/biryani.jpg' },
    { id: 'breads', label: 'Breads', icon: '/images/branded/lassi-lounge/categories/breads.jpg' },
    { id: 'beverages', label: 'Beverages', icon: '/images/branded/lassi-lounge/categories/beverages.jpg' },
    { id: 'desserts', label: 'Desserts', icon: '/images/branded/lassi-lounge/categories/desserts.jpg' },
  ],
};

export const deliveryPartnersContent = {
  eyebrow: 'Order Online',
  heading: 'Delicious Food,',
  headingScript: 'Delivered To You!',
  description: 'Enjoy your favorite Indian dishes from the comfort of your home. We deliver across New York.',
  partners: [
    { id: 'ubereats', name: 'Uber Eats', logo: '/images/branded/lassi-lounge/partners/ubereats.svg', href: 'https://www.ubereats.com' },
    { id: 'doordash', name: 'DoorDash', logo: '/images/branded/lassi-lounge/partners/doordash.svg', href: 'https://www.doordash.com' },
    { id: 'grubhub', name: 'Grubhub', logo: '/images/branded/lassi-lounge/partners/grubhub.svg', href: 'https://www.grubhub.com' },
  ],
};

export const signatureDishesContent = {
  eyebrow: 'Our Signature Dishes',
  viewFullMenuCta: { label: 'View Full Menu', href: '/customer/restaurant/lassi-lounge?tab=menu' },
  dishes: [
    {
      id: 'butter-chicken',
      name: 'Butter Chicken',
      description: 'Tender chicken cooked in a rich & creamy tomato sauce.',
      price: 16.99,
      image: '/images/branded/lassi-lounge/dishes/butter-chicken.jpg',
    },
    {
      id: 'lamb-rogan-josh',
      name: 'Lamb Rogan Josh',
      description: 'Slow cooked lamb in aromatic spices & herbs.',
      price: 18.99,
      image: '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg',
    },
    {
      id: 'paneer-tikka',
      name: 'Paneer Tikka',
      description: 'Cottage cheese marinated in spices & grilled to perfection.',
      price: 13.99,
      image: '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg',
    },
    {
      id: 'chicken-biryani',
      name: 'Chicken Biryani',
      description: 'Fragrant basmati rice cooked with chicken & aromatic spices.',
      price: 15.99,
      image: '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg',
    },
    {
      id: 'dal-makhani',
      name: 'Dal Makhani',
      description: 'Creamy black lentils cooked with butter & spices.',
      price: 13.99,
      image: '/images/branded/lassi-lounge/dishes/dal-makhani.jpg',
    },
    {
      id: 'mango-lassi',
      name: 'Mango Lassi',
      description: 'Refreshing yogurt drink blended with mango pulp.',
      price: 4.49,
      image: '/images/branded/lassi-lounge/dishes/mango-lassi.jpg',
    },
  ],
};
export const trustFeaturesContent = {
  features: [
    { id: 'fast-delivery', title: 'Fast Delivery', description: 'Quick & reliable delivery at your doorstep' },
    { id: 'best-offers', title: 'Best Offers', description: 'Exciting deals & exclusive offers' },
    { id: 'secure-payment', title: 'Secure Payment', description: '100% secure payments with multiple options' },
    { id: 'support', title: '24/7 Support', description: 'We are here to help you anytime' },
  ],
};
export const footerContent = {
  description: 'Lassi Lounge brings the authentic taste of India to your table. Good food, good mood!',
  visitUs: {
    address: '34 Union Avenue, Patiala, New York 11022, USA',
    phone: '(516) 612-0300',
    email: 'info@lassilounge.com',
  },
  hours: [
    { day: 'Monday - Thu', time: '11:30 AM - 10:00 PM' },
    { day: 'Friday', time: '11:30 AM - 11:00 PM' },
    { day: 'Saturday', time: '12:00 PM - 11:30 PM' },
    { day: 'Sunday', time: '12:00 PM - 10:00 PM' },
  ],
  viewAllHoursCta: { label: 'View All Hours', href: '/customer/restaurant/lassi-lounge?tab=hours' },
  findUs: {
    address: 'Lassi Lounge, 34 Union Avenue, Patiala, NY 11022',
    mapImage: '/images/branded/lassi-lounge/footer/map-thumbnail.jpg',
    mapLink: 'https://maps.google.com/?q=34+Union+Avenue+Patiala+NY+11022',
  },
  social: [
    { id: 'facebook', href: 'https://facebook.com/lassilounge' },
    { id: 'instagram', href: 'https://instagram.com/lassilounge' },
    { id: 'whatsapp', href: 'https://wa.me/15166120300' },
    { id: 'yelp', href: 'https://yelp.com/biz/lassi-lounge' },
  ],
  legalLinks: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms-conditions' },
  ],
};
export const testimonialsContent = {
  eyebrow: 'What Our Customers Say',
  reviews: [
    {
      id: 'john-d',
      name: 'John D.',
      location: 'New York, USA',
      rating: 5,
      quote: "The best Indian food I've had in New York! The flavors are authentic and the service is exceptional. Highly recommended!",
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      id: 'priya-s',
      name: 'Priya S.',
      location: 'New Jersey, USA',
      rating: 5,
      quote: 'Lassi Lounge never disappoints. Butter chicken and garlic naan are our all-time favorites!',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      id: 'michael-r',
      name: 'Michael R.',
      location: 'New York, USA',
      rating: 5,
      quote: 'Amazing ambience, delicious food and great hospitality. Perfect place for family dinner.',
      avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    },
    {
      id: 'sara-k',
      name: 'Sara K.',
      location: 'Queens, USA',
      rating: 5,
      quote: 'Catered our office party and everyone loved it — the biryani was a huge hit with the whole team.',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    },
    {
      id: 'amit-v',
      name: 'Amit V.',
      location: 'Patiala, NY',
      rating: 4,
      quote: 'Cozy spot with authentic flavors that remind me of home. Mango lassi is a must-try.',
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    },
    {
      id: 'linda-t',
      name: 'Linda T.',
      location: 'Long Island, USA',
      rating: 5,
      quote: 'Booked them for our wedding catering and the guests are still talking about the food.',
      avatar: 'https://randomuser.me/api/portraits/women/8.jpg',
    },
  ],
};

export const navLinks = [
  { label: 'Home', href: '/customer' },
  { label: 'About Us', href: '/customer/about-us' },
  { label: 'Menu', href: '/customer/restaurant/lassi-lounge?tab=menu' },
  { label: 'My Orders', href: '/customer/profile?tab=orders' },
  { label: 'Book a Table', href: '/customer/restaurant/lassi-lounge/book-a-table' },
  { label: 'Catering', href: '/customer/restaurant/lassi-lounge/catering' },
  { label: 'Events', href: '/customer/restaurant/lassi-lounge/events' },
  { label: 'Contact Us', href: '/customer/contact-us' },
];

export const storyContent = {
  eyebrowScript: 'Our Story',
  heading: 'THE ESSENCE OF AUTHENTIC INDIA',
  description:
    'At Lassi Lounge, we bring you the true taste of India with recipes passed down through generations. Every dish is prepared with the freshest ingredients and traditional spices.',
  features: [
    { id: 'authentic-recipes', title: 'Authentic Recipes', description: 'Traditional recipes crafted by experienced chefs.' },
    { id: 'fresh-ingredients', title: 'Fresh Ingredients', description: 'We use the freshest & highest quality ingredients.' },
    { id: 'warm-ambience', title: 'Warm Ambience', description: 'Perfect place for family, friends & special occasions.' },
  ],
  cta: { label: 'Read More About Us', href: '/customer/about-us' },
  image: {
    src: '/images/branded/lassi-lounge/story/restaurant-interior.jpg',
    alt: 'Lassi Lounge restaurant interior with warm ambient lighting',
  },
  badge: { value: '10+', label: 'Years of Excellence' },
};

export const cateringContent = {
  eyebrowScript: 'Make Every Occasion Special',
  heading: 'CATERING & PRIVATE EVENTS',
  description:
    'From small gatherings to grand celebrations, we cater to all your needs with our delicious food and excellent service.',
  cta: { label: 'Book Catering', href: '/customer/restaurant/lassi-lounge/catering' },
  services: [
    { id: 'weddings', label: 'Weddings' },
    { id: 'corporate-events', label: 'Corporate Events' },
    { id: 'private-parties', label: 'Private Parties' },
  ],
  image: {
    src: '/images/branded/lassi-lounge/catering/table-setting.jpg',
    alt: 'Elegant table setting for catering and private events at Lassi Lounge',
  },
};

export const heroContent = {
  eyebrowScript: 'Welcome to',
  headingLine1: 'LASSI',
  headingLine2: 'LOUNGE',
  ribbonText: 'INDIAN RESTAURANT',
  description:
    'Experience the rich and authentic flavors of India. From traditional favorites to modern delights, every dish is made with love.',
  primaryCta: { label: 'Order Online', href: '/customer/restaurant/lassi-lounge?mode=delivery' },
  secondaryCta: { label: 'View Menu', href: '/customer/restaurant/lassi-lounge' },
  heroImage: {
    src: '/images/branded/lassi-lounge/hero-spread.jpg',
    alt: 'Butter chicken, biryani, naan basket and mango lassi spread at Lassi Lounge',
  },
};