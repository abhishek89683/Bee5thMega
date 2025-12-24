const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    brand: { type: String },
    category: { type: String, index: true },
    price: { type: Number, required: true },
    countInStock: { type: Number, default: 0 },
    image: { type: String },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
