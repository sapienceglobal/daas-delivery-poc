import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const Review = mongoose.model('Review', new mongoose.Schema({}, { strict: false, collection: 'reviews' }));
  const MenuItem = mongoose.model('MenuItem', new mongoose.Schema({}, { strict: false, collection: 'menuitems' }));
  
  const stats = await Review.aggregate([
    { $match: { isVisible: true } },
    { $group: { _id: '$itemId', avg: { $avg: '$overallRating' }, count: { $sum: 1 } } }
  ]);
  
  console.log('Reviews stats:', stats);
  
  const itemIds = stats.map(s => s._id).filter(id => id);
  for (const stat of stats) {
    if(!stat._id) continue;
    await MenuItem.updateOne(
      { _id: new mongoose.Types.ObjectId(stat._id) },
      { $set: { averageRating: Math.round(stat.avg * 10) / 10, reviewCount: stat.count } }
    );
  }
  
  const items = await MenuItem.find({ _id: { $in: itemIds.map(id => new mongoose.Types.ObjectId(id)) } });
  console.log('Updated items:', items.map(i => ({ id: i._id, name: i.name, avg: i.averageRating, cnt: i.reviewCount })));
  
  process.exit(0);
}

run();
