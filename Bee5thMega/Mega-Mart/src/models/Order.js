const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    qty: Number,
    price: Number,
    image: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      default: () => `order_${Date.now()}`
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [orderItemSchema],
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    paymentMethod: { type: String, default: 'COD' },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
      order_id: String  // Added order_id to store Razorpay order ID
    },
    itemsPrice: Number,
    taxPrice: Number,
    shippingPrice: Number,
    totalPrice: Number,
    isPaid: { 
      type: Boolean, 
      default: false 
    },
    paidAt: Date,
    isDelivered: { 
      type: Boolean, 
      default: false 
    },
    deliveredAt: Date,
    isReturned: {
      type: Boolean,
      default: false
    },
    returnedAt: Date,
  },
  { 
    timestamps: true 
  }
);

// Add a compound index for better query performance
orderSchema.index({ orderId: 1, user: 1 });

module.exports = mongoose.model('Order', orderSchema);