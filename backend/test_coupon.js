import mongoose from 'mongoose';
import Coupon from './src/models/Coupon.js';

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/lassi_lounge');
        await Coupon.deleteMany({});
        await Coupon.create({
            code: 'LASSI20',
            description: '20% off on your first order',
            type: 'percentage',
            value: 20,
            maxDiscount: 10,
            minCartValue: 18,
            firstOrderOnly: true,
            endDate: new Date('2026-12-31')
        });
        console.log('Test coupon created');
    } catch(e) {
        console.log(e);
    } finally {
        mongoose.disconnect();
    }
};
run();
