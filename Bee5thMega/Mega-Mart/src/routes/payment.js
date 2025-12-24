const express = require('express');
const Razorpay = require('razorpay');
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');

const router = express.Router();

// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Test endpoint to verify Razorpay configuration
router.get('/test-config', (req, res) => {
  res.json({
    key_id: process.env.RAZORPAY_KEY_ID ? 'Found' : 'Missing',
    key_secret: process.env.RAZORPAY_KEY_SECRET ? 'Found' : 'Missing',
    razorpay_initialized: !!razorpay
  });
});

// Create Razorpay order
router.post('/create-order', protect, async (req, res) => {
  try {
    console.log('=== Creating Razorpay Order ===');
    console.log('Request body:', req.body);
    console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID ? 'Found' : 'Missing');
    
    const { amount, orderId } = req.body;
    
    if (!amount || !orderId) {
      console.error('Missing required fields:', { amount, orderId });
      return res.status(400).json({
        success: false,
        message: 'Amount and orderId are required',
        received: { amount, orderId }
      });
    }

    // Convert amount to paise (Razorpay uses the smallest currency unit)
    const amountInPaise = Math.round(amount * 100);
    
    const options = {
      amount: amountInPaise.toString(),
      currency: 'INR',  
      receipt: String(orderId),
      payment_capture: 1 // Auto capture payment
    };

    console.log('Creating Razorpay order with options:', options);
    
    // Test Razorpay instance
    if (!razorpay) {
      console.error('Razorpay instance not properly initialized');
      return res.status(500).json({
        success: false,
        message: 'Payment service configuration error',
        details: 'Razorpay instance not initialized'
      });
    }

    const response = await razorpay.orders.create(options);
    console.log('Razorpay order created successfully:', response);
    try {
      const mongoose = require('mongoose');
      const ourOrderId = orderId;
      let dbOrder = null;

      if (mongoose.Types.ObjectId.isValid(ourOrderId)) {
        dbOrder = await Order.findById(ourOrderId);
      }
      if (!dbOrder) {
        dbOrder = await Order.findOne({ orderId: ourOrderId });
      }

      if (dbOrder) {
        dbOrder.paymentMethod = 'Razorpay';
        dbOrder.paymentResult = {
          ...(dbOrder.paymentResult || {}),
          order_id: response.id,
          status: 'created',
          update_time: new Date().toISOString(),
          email_address: req.user?.email || dbOrder.paymentResult?.email_address,
        };
        await dbOrder.save();
        console.log('Order mapped to Razorpay order id:', {
          local: dbOrder._id,
          localOrderId: dbOrder.orderId,
          razorpay_order_id: response.id,
        });
      } else {
        console.warn('Could not find local order to map Razorpay order id for:', ourOrderId);
      }
    } catch (mapErr) {
      console.error('Failed to map Razorpay order to local order:', mapErr);
    }

    res.json({
      success: true,
      order: response,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('=== ERROR CREATING RAZORPAY ORDER ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      key_id: process.env.RAZORPAY_KEY_ID ? 'Found' : 'Missing',
      key_secret: process.env.RAZORPAY_KEY_SECRET ? 'Found' : 'Missing',
      razorpay_initialized: !!razorpay,
      request_body: req.body
    });
    
    // More specific error handling
    let errorMessage = 'Error creating payment order';
    let statusCode = 500;
    
    if (error.statusCode) {
      // This is a Razorpay error
      errorMessage = error.error?.description || error.message || errorMessage;
      statusCode = error.statusCode;
    } else if (error.isAxiosError) {
      // This is an Axios error
      errorMessage = error.response?.data?.message || error.message || errorMessage;
      statusCode = error.response?.status || statusCode;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      details: error.error?.description || error.error?.error?.description,
      code: error.error?.code || error.code
    });
  }
});

// Update the verify endpoint in payment.js
// --- Robust /verify route ---
router.post('/verify', protect, async (req, res) => {
  try {
    // Accept orderId from body OR query (safer if frontend sends differently)
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId: bodyOrderId
    } = req.body || {};

    const orderId = bodyOrderId || req.query.orderId;

    console.log('=== Payment Verification Request ===');
    console.log('Received payload:', { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature });
    console.log('User (from protect middleware):', req.user ? { id: req.user._id, email: req.user.email } : 'no-user');

    // Validate incoming fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('Missing payment verification data', { body: req.body });
      return res.status(400).json({ success: false, message: 'Missing payment verification data' });
    }

    // Try to find the order in several ways
    let order = null;
    try {
      const mongoose = require('mongoose');

      // 1) If orderId looks like a MongoDB ObjectId, try that first
      if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId);
        if (order) console.log('Found order by _id:', order._id.toString());
      }

      // 2) If not found, try by order.orderId field (if you store a separate orderId)
      if (!order && orderId) {
        order = await Order.findOne({ orderId: orderId });
        if (order) console.log('Found order by orderId field:', order.orderId);
      }

      // 3) Try to find by razorpay_order_id if you stored it when creating the order
      if (!order && razorpay_order_id) {
        order = await Order.findOne({ 'paymentResult.order_id': razorpay_order_id });
        if (order) console.log('Found order by paymentResult.order_id:', razorpay_order_id);
      }

      // 4) Fallback: if orderId looks like "prefix_timestamp" (some frontends generate), try a createdAt window
      if (!order && orderId && typeof orderId === 'string' && orderId.includes('_')) {
        const parts = orderId.split('_');
        const maybeTs = parseInt(parts[parts.length - 1], 10);
        if (!Number.isNaN(maybeTs)) {
          const startTime = new Date(maybeTs - 2000); // 2s buffer
          const endTime = new Date(maybeTs + 2000);
          order = await Order.findOne({ createdAt: { $gte: startTime, $lt: endTime } });
          if (order) console.log('Found order by timestamp fallback, createdAt:', order.createdAt);
        }
      }

      // If still not found, log request for debugging and return 404
      if (!order) {
        console.error('Order not found with any method. Details:', {
          providedOrderId: orderId,
          razorpay_order_id,
          body: req.body
        });
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
    } catch (dbErr) {
      console.error('Database error when finding order:', dbErr);
      return res.status(500).json({ success: false, message: 'Database error while finding order' });
    }

    // verify signature: HMAC SHA256 of (razorpay_order_id + "|" + razorpay_payment_id)
    const crypto = require('crypto');
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('Missing RAZORPAY_KEY_SECRET env var');
      return res.status(500).json({ success: false, message: 'Server misconfiguration' });
    }

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    console.log('Generated Signature:', generatedSignature);
    console.log('Received Signature:', razorpay_signature);

    const isSignatureValid = generatedSignature === razorpay_signature;
    console.log('Signature Valid:', isSignatureValid);

    if (!isSignatureValid) {
      console.error('Invalid payment signature', { generatedSignature, received: razorpay_signature });
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Update order: mark paid, store paymentResult details
    try {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: razorpay_payment_id,
        order_id: razorpay_order_id,
        status: 'completed',
        update_time: new Date().toISOString(),
        email_address: req.user?.email || order?.userEmail || null
      };

      const updatedOrder = await order.save();
      console.log('Order updated successfully:', updatedOrder._id.toString());

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        order: {
          _id: updatedOrder._id,
          orderId: updatedOrder.orderId || null,
          isPaid: updatedOrder.isPaid,
          paidAt: updatedOrder.paidAt
        }
      });
    } catch (saveErr) {
      console.error('Error saving updated order:', saveErr);
      return res.status(500).json({ success: false, message: 'Error saving payment info' });
    }
  } catch (error) {
    console.error('Error in payment verification endpoint:', { message: error.message, stack: error.stack, body: req.body });
    return res.status(500).json({ success: false, message: 'Error verifying payment', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

module.exports = router;
