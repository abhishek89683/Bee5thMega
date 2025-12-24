const mongoose = require('mongoose');
require('dotenv').config();

async function listProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');
    
    const Product = require('./src/models/Product');
    const products = await Product.find({});
    
    console.log(`\nFound ${products.length} products:`);
    products.forEach((p, i) => {
      console.log(`\n[${i + 1}] ${p.name}`);
      console.log(`   Price: ₹${p.price}`);
      console.log(`   Category: ${p.category}`);
      console.log(`   Image: ${p.image}`);
    });
    
    if (products.length === 0) {
      console.log('No products found in the database.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listProducts();
