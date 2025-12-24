import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../state/CartContext'
import Payment from '../components/Payment'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function Billing() {
  const { items, summary, clearCart } = useCart()
  const navigate = useNavigate()

  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  })
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [showRazorpay, setShowRazorpay] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderData, setOrderData] = useState(null)

  const handlePaymentSuccess = () => {
    // This will be called when Razorpay payment is successful
    toast.success('Payment successful! Your order has been placed.');
    setShowRazorpay(false);
    clearCart();
    navigate('/orders');
  };

  const handleRazorpayClose = () => {
    setShowRazorpay(false);
    setPaymentMethod('COD'); // Reset to COD if Razorpay is closed
  };

  const buildOrderPayload = (paymentType) => {
    const orderItems = items.map(i => ({
      product: i.product,
      name: i.name,
      qty: i.qty,
      price: i.price,
      image: i.image,
    }));

    return {
      orderItems,
      shippingAddress: address,
      paymentMethod: paymentType,
    }
  }

  async function createOrder(paymentType) {
    const payload = buildOrderPayload(paymentType)
    const { data } = await api.post('/orders', payload)
    setOrderData(data)
    return data
  }

  async function placeOrder(e) {
    e.preventDefault();
    setError('');
    
    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === 'Razorpay') {
        const created = await createOrder('Razorpay')
        toast.info('Order created. Complete payment to confirm.');
        if (created) setShowRazorpay(true);
        return;
      }

      await createOrder(paymentMethod)
      toast.success('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to place order';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="muted">Home / Checkout</div>
        <h2 style={{ margin: 0 }}>Billing & Shipping</h2>
      </div>
      <div className="checkout-grid">
        <form onSubmit={placeOrder} className="form card" style={{ padding: 16 }}>
          {error && <div className="alert">{error}</div>}
          <h3>Shipping Address</h3>
          <label>Address Line 1</label>
          <input value={address.line1} onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))} required placeholder="House / Flat / Street" />
          <label>Address Line 2</label>
          <input value={address.line2} onChange={e => setAddress(a => ({ ...a, line2: e.target.value }))} placeholder="Landmark (optional)" />
          <div className="row">
            <div className="col">
              <label>City</label>
              <input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} required />
            </div>
            <div className="col">
              <label>State</label>
              <input value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} required />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label>Postal Code</label>
              <input value={address.postalCode} onChange={e => setAddress(a => ({ ...a, postalCode: e.target.value }))} required />
            </div>
            <div className="col">
              <label>Country</label>
              <input value={address.country} onChange={e => setAddress(a => ({ ...a, country: e.target.value }))} required />
            </div>
          </div>

          <h3>Payment</h3>
          <label>Payment Method</label>
          <select 
            value={paymentMethod} 
            onChange={e => setPaymentMethod(e.target.value)}
            className="form-select"
          >
            <option value="COD">Cash on Delivery</option>
            <option value="Razorpay">Pay with Razorpay</option>
            <option value="Card" disabled>Card (coming soon)</option>
            <option value="UPI" disabled>UPI (coming soon)</option>
          </select>
          
          {paymentMethod === 'Razorpay' && (
            <div className="payment-note" style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>
              <p>You'll be redirected to Razorpay's secure payment page to complete your purchase.</p>
            </div>
          )}

          <button 
            className="btn primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Processing...' : paymentMethod === 'Razorpay' ? 'Proceed to Payment' : 'Place Order'}
          </button>
          
          {showRazorpay && orderData && (
            <Payment
              order={orderData}
              onSuccess={handlePaymentSuccess}
              onClose={handleRazorpayClose}
            />
          )}
        </form>

        <div className="card summary" style={{ height: 'fit-content', padding: 16 }}>
          <h3>Order Summary</h3>
          <ul>
            {items.map(i => (
              <li key={i.product} className="row between">
                <span>{i.name} × {i.qty}</span>
                <span>₹{(i.price * i.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <hr />
          <p>Items: ₹{summary.itemsPrice.toFixed(2)}</p>
          <p>Tax (10%): ₹{summary.taxPrice.toFixed(2)}</p>
          <p>Shipping: ₹{summary.shippingPrice.toFixed(2)}</p>
          <p className="price large">Total: ₹{summary.totalPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
