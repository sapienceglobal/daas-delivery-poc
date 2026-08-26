import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config already picked from your .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Yahan apni download ki hui image ka naam/path daliye (e.g., 'cancel_order.png')
const IMAGE_PATH_TO_UPLOAD = 'cancel_order.png';

async function uploadImage() {
  try {
    console.log(`Uploading ${IMAGE_PATH_TO_UPLOAD} to Cloudinary...`);
    const result = await cloudinary.uploader.upload(IMAGE_PATH_TO_UPLOAD, {
      folder: 'restaurant-platform/notifications', // Is folder me save hogi
    });
    
    console.log('\n✅ Upload Successful!');
    console.log('🎉 Yahan hai apka Secure HTTPS URL:');
    console.log('----------------------------------------------------');
    console.log(result.secure_url);
    console.log('----------------------------------------------------\n');
    console.log('Is URL ko copy karke orderController.js (line 742) me paste kar dijiye!');
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.log('Please check if the file exists and .env has Cloudinary keys.');
  }
}

uploadImage();
