import mongoose from 'mongoose';
import Coupon from './backend/src/models/Coupon.js';

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/lassi_lounge');
        const coupons = await Coupon.find({});
        console.log(coupons);
    } catch(e) {
        console.log(e);
    } finally {
        mongoose.disconnect();
    }
};
run();
