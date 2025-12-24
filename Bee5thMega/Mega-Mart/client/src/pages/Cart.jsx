import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../state/CartContext'
import { useToast } from '../state/ToastContext'

export default function Cart() {
  const { items, removeFromCart, updateQty, summary } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <h2>Your cart is empty</h2>
          <p className="muted">Discover products you’ll love in the shop.</p>
          <Link to="/shop" className="btn">Go shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="muted">Home / Cart</div>
        <h2 style={{ margin: 0 }}>Your Cart</h2>
      </div>
      <div className="cart-grid">
        <div>
          {items.map(i => (
            <div key={i.product} className="cart-row">
              <img src={i.image || 'https://via.placeholder.com/80?text=Item'} alt={i.name} />
              <div className="grow">
                <h4>{i.name}</h4>
                <p className="muted">₹{i.price}</p>
              </div>
              <select value={i.qty} onChange={e => updateQty(i.product, +e.target.value)}>
                {Array.from({ length: 10 }).map((_, idx) => (
                  <option key={idx + 1} value={idx + 1}>{idx + 1}</option>
                ))}
              </select>
              <button className="btn danger" onClick={() => {
                removeFromCart(i.product)
                showToast('Item removed from cart', 'success')
              }}>Remove</button>
              
            </div>
          ))}
        </div>
        <div className="card summary" style={{ height: 'fit-content', position: 'sticky', top: 88 }}>
          <h3>Summary</h3>
          <p>Items: ₹{summary.itemsPrice.toFixed(2)}</p>
          <p>Tax (10%): ₹{summary.taxPrice.toFixed(2)}</p>
          <p>Shipping: ₹{summary.shippingPrice.toFixed(2)}</p>
          <hr />
          <p className="price large">Total: ₹{summary.totalPrice.toFixed(2)}</p>
          <button className="btn primary" onClick={() => navigate('/billing')}>Proceed to Billing</button>
        </div>
      </div>
    </div>
  )
}
