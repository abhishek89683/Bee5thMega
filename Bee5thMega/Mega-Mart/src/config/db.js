const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: true,
  });
  console.log('MongoDB connected');
}

module.exports = { connectDB };
