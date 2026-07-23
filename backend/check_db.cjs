require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const restaurants = await mongoose.connection.collection('restaurants').find({}).toArray();
    console.log(JSON.stringify(restaurants.map(r => ({ id: r._id, name: r.name, address: r.address })), null, 2));
    process.exit(0);
  });
