import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost:27017/daas-delivery').then(async () => {
  const db = mongoose.connection.db;
  await db.collection('restaurants').updateOne({ name: 'Lassi Lounge' }, { $set: { address: '345 Stockton St, San Francisco, CA 94108' } });
  console.log('Updated Lassi Lounge Address');
  mongoose.disconnect();
});
