import mongoose from 'mongoose';
const MONGODB_URI = 'mongodb://Adarsh:adarsh2424@ac-easwkco-shard-00-00.3ynbxui.mongodb.net:27017,ac-easwkco-shard-00-01.3ynbxui.mongodb.net:27017,ac-easwkco-shard-00-02.3ynbxui.mongodb.net:27017/daas_poc?ssl=true&replicaSet=atlas-1270ki-shard-0&authSource=admin';
mongoose.connect(MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('restaurants').updateOne(
    { name: { $regex: /^lassi lounge$/i } },
    { $set: { address: '345 Stockton St, San Francisco, CA 94108' } }
  );
  console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
  mongoose.disconnect();
});
