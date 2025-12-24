// Update the Payment.jsx component with this code
import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Debug environment variables
console.log('Environment Variables:', {
  VITE_RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || 'Not set',
  REACT_APP_RAZORPAY_KEY_ID: import.meta.env.REACT_APP_RAZORPAY_KEY_ID || 'Not set',
  VITE_API_URL: import.meta.env.VITE_API_URL || 'Not set',
  REACT_APP_API_URL: import.meta.env.REACT_APP_API_URL || 'Not set',
  NODE_ENV: import.meta.env.MODE
});

// Utility function to load Razorpay script
export const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay SDK loaded successfully');
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export default function Payment({ order, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Razorpay script when component mounts
  useEffect(() => {
    const initializeRazorpay = async () => {
      try {
        const loaded = await loadRazorpay();
        setIsScriptLoaded(loaded);
        if (!loaded) {
          setError('Failed to load payment service. Please refresh the page or try again later.');
        }
      } catch (err) {
        console.error('Error loading Razorpay:', err);
        setError('Failed to initialize payment service.');
      }
    };

    initializeRazorpay();
  }, []);

const processPayment = async (paymentResponse) => {
  try {
    console.log('Processing payment response:', paymentResponse);
    
    const { data } = await api.post('/payment/verify', {
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      orderId: order?.orderId || order?._id,
    });

    console.log('Payment verification response:', data);
    
    if (data.success) {
      setError('');
      toast.success('Payment successful! Your order has been placed.');
      if (onSuccess) {
        onSuccess(data.order); // Pass the updated order data to the parent
      }
    } else {
      throw new Error(data.message || 'Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    
    const errorMsg = error.response?.data?.message || 
                   error.message || 
                   'Failed to verify payment. Please contact support.';
    
    toast.error(errorMsg);
    setError(errorMsg);
  }
};

  const displayRazorpay = async () => {
    console.log('Display Razorpay called');
    
    if (!isScriptLoaded) {
      const errorMsg = 'Payment service is still initializing. Please wait...';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Creating order with amount:', order.totalPrice);
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || import.meta.env.REACT_APP_RAZORPAY_KEY_ID;
      
      if (!razorpayKeyId) {
        throw new Error('Razorpay key ID is not configured. Please check your environment variables.');
      }
      console.log('Razorpay Key ID:', razorpayKeyId);
      
      // 1. Create order on your server (api has baseURL '/api')
      console.log('Sending amount to server (in rupees):', order.totalPrice);
      const response = await api.post('/payment/create-order', {
        amount: order.totalPrice, // Send amount in rupees, let backend handle paise conversion
        orderId: order?.orderId || order?._id,
      });
      
      console.log('Server response:', response);
      const { data } = response;

      if (!data || !data.success) {
        const errorMsg = data?.message || 'Failed to create payment order';
        console.error('Server error:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!data.order || !data.order.id) {
        console.error('Invalid order data from server:', data);
        throw new Error('Invalid response from payment server');
      }

      console.log('Order created, opening Razorpay popup...');
      
      // 2. Open Razorpay payment popup
      const options = {
        key: razorpayKeyId,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',  
        name: 'Mega Mart',
        description: `Order #${order?.orderId || order?._id}`,
        order_id: data.order.id,
        handler: processPayment,
        prefill: {
          name: order.user?.name || 'Customer',
          email: order.user?.email || 'customer@example.com',
          contact: order.shippingAddress?.phone || '9999999999',
        },
        notes: {
          address: order.shippingAddress?.line1 || '',
          orderId: order?.orderId || order?._id,
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            if (onClose) onClose();
          },
        },
      };

      console.log('Razorpay options:', {
        ...options,
        key: razorpayKeyId ? 'Key is set' : 'Key is missing'
      });

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded properly');
      }

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', (response) => {
        const errorMessage = response.error?.description || 'Payment failed. Please try again.';
        console.error('Payment failed:', response.error);
        toast.error(errorMessage);
        setError(errorMessage);
        if (onClose) onClose();
      });

      paymentObject.on('payment.error', (error) => {
        console.error('Payment error:', error);
        const errorMsg = error.error?.description || 'An error occurred during payment';
        toast.error(errorMsg);
        setError(errorMsg);
        if (onClose) onClose();
      });

      paymentObject.open();
      console.log('Razorpay popup should be open now');
      
    } catch (err) {
      console.error('Payment initialization error:', {
        message: err.message,
        response: err.response?.data,
        stack: err.stack
      });
      
      let errorMsg = 'Failed to process payment';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        errorMsg = err.response.data?.message || 
                  err.response.statusText || 
                  `Server responded with ${err.response.status}`;
      } else if (err.request) {
        // The request was made but no response was received
        errorMsg = 'No response from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMsg = err.message || 'Error setting up payment';
      }
      
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container" style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div className="payment-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Complete Your Payment</h3>
        <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#333' }}>
          Order Total: ₹{order.totalPrice.toFixed(2)}
        </p>
        <p style={{ color: '#666', marginBottom: '20px' }}>Order ID: {order?.orderId || order?._id}</p>
      </div>
      
      {error && (
        <div className="alert error" style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '10px 15px',
          borderRadius: '4px',
          marginBottom: '20px',
          borderLeft: '4px solid #c62828'
        }}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      
      <div className="payment-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={displayRazorpay} 
          disabled={loading || !isScriptLoaded}
          style={{
            backgroundColor: loading ? '#ccc' : '#3399cc',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                borderTopColor: '#fff',
                animation: 'spin 1s ease-in-out infinite'
              }}></span>
              Processing...
            </>
          ) : (
            <>
              <i className="fas fa-credit-card"></i>
              Pay with Razorpay
            </>
          )}
        </button>
        
        <button 
          onClick={onClose} 
          style={{
            backgroundColor: '#f5f5f5',
            color: '#333',
            border: '1px solid #ddd',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
          disabled={loading}
        >
          <i className="fas fa-times"></i> Cancel
        </button>
      </div>
      
      <div className="payment-security" style={{
        marginTop: '30px',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        <div className="security-badge" style={{ marginBottom: '10px' }}>
          <i className="fas fa-lock" style={{ marginRight: '5px' }}></i>
          <span>Secure Payment</span>
        </div>
        <div className="razorpay-logo" style={{ marginTop: '10px' }}>
          <span style={{ display: 'block', marginBottom: '5px' }}>Powered by</span>
          <img 
            src="https://razorpay.com/payment-button.svg" 
            alt="Razorpay" 
            style={{ height: '25px' }}
          />
        </div>
      </div>

      <style jsx="true">{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}