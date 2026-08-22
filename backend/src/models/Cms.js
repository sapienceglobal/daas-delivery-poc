import mongoose from 'mongoose';

const cmsSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      unique: true
    },
    heroBanners: {
      home: { type: String, default: '' },
      menu: { type: String, default: '' },
      orderOnline: { type: String, default: '' },
      checkout: { type: String, default: '' },
      catering: { type: String, default: '' },
      bookTable: { type: String, default: '' }
    },
    aboutUs: {
      ownerImage: { type: String, default: '' },
      restaurantImage: { type: String, default: '' },
      galleryImages: [
        {
          src: { type: String, required: true },
          alt: { type: String, default: '' }
        }
      ]
    },
    cateringOccasions: [
      {
        icon: { type: String, required: true },
        title: { type: String, required: true },
        image: { type: String, required: true }
      }
    ],
    cateringPackages: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        popular: { type: Boolean, default: false },
        image: { type: String, required: true },
        features: [{ type: String }]
      }
    ],
    bookingSettings: [
      {
        title: { type: String, required: true },
        desc: { type: String, required: true },
        image: { type: String, required: true }
      }
    ],
    promotions: {
      menuPage: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
      mobileHome: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null }
    }
  },
  { timestamps: true }
);

const Cms = mongoose.model('Cms', cmsSchema);

export default Cms;
