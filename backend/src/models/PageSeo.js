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
}, { timestamps: true });

const PageSeo = mongoose.model('PageSeo', PageSeoSchema);
export default PageSeo;
