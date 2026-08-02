import mongoose from 'mongoose';
import Coupon from './src/models/Coupon.js';

const uri = 'mongodb://Adarsh:adarsh2424@ac-easwkco-shard-00-00.3ynbxui.mongodb.net:27017,ac-easwkco-shard-00-01.3ynbxui.mongodb.net:27017,ac-easwkco-shard-00-02.3ynbxui.mongodb.net:27017/daas_poc?ssl=true&replicaSet=atlas-1270ki-shard-0&authSource=admin';

const run = async () => {
    try {
        await mongoose.connect(uri);
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
        console.log('Test coupon created in Atlas');
    } catch(e) {
        console.log(e);
    } finally {
        mongoose.disconnect();
    }
};
run();
