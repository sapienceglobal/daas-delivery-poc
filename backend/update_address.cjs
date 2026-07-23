require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const res = await mongoose.connection.collection('restaurants').updateMany(
      {},
      { $set: { address: '345 Stockton St, San Francisco, CA 94108' } }
    );
    console.log('Updated:', res.modifiedCount);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
