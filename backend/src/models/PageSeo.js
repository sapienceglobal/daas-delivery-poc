import mongoose from 'mongoose';

const PageSeoSchema = new mongoose.Schema({
  path: {
    type: String,
    required: [true, 'Page path is required (e.g. /about-us)'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  title: {
    type: String,
    trim: true,
    maxlength: [70, 'SEO title cannot exceed 70 characters'],
    default: '',
  },
  description: {
    type: String,
    trim: true,
    maxlength: [160, 'SEO description cannot exceed 160 characters'],
    default: '',
  },
  ogImage: {
    type: String,
    trim: true,
    default: '',
  },
  keywords: [{
    type: String,
    trim: true,
  }],
  headerScripts: {
    type: String,
    default: '',
  },
  footerScripts: {
    type: String,
    default: '',
  },
  gtmId: {
    type: String,
    trim: true,
    default: '',
  },
  googleAdsId: {
    type: String,
    trim: true,
    default: '',
  },
  metaPixelId: {
    type: String,
    trim: true,
    default: '',
  },
}, { timestamps: true });

const PageSeo = mongoose.model('PageSeo', PageSeoSchema);
export default PageSeo;
