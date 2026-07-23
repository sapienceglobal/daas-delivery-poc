require('dotenv').config();
const mongoose = require('mongoose');

// Connect to daas_poc_lassi_lounge
mongoose.connect(process.env.MONGODB_URI.replace('daas_poc', 'daas_poc_lassi_lounge'))
  .then(async () => {
    const res = await mongoose.connection.collection('restaurants').updateMany(
      {},
      { $set: { address: '345 Stockton St, San Francisco, CA 94108' } }
    );
    console.log('Updated lassi_lounge DB:', res.modifiedCount);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
