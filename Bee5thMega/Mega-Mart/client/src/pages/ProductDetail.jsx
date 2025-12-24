import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../state/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('') // New state for notification
  const { addToCart } = useCart()

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get(`/products/${id}`)
      setProduct(data)
      setLoading(false)
    })()
  }, [id])

  // Function to handle adding to cart with a success notification
  function handleAddToCart() {
    if (product.countInStock === 0) return 
    addToCart(product, qty)
    setMessage(`Added ${qty} × ${product.name} to cart!`)
    // Clear message after 3 seconds for a smooth, temporary notification
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) return <div className="container"><p>Loading...</p></div>
  if (!product) return <div className="container"><p>Product not found</p></div>

  return (
    <div className="container detail">
      <div className="detail-img">
        <img src={product.image || 'https://via.placeholder.com/800x600?text=No+Image'} alt={product.name} />
      </div>
      <div className="detail-info">
        <div className="row between">
          <div className="muted">Home / {product.category}</div>
          <span className={`badge ${product.countInStock > 0 ? 'success' : 'warning'}`}>
            {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
        <h2 style={{ marginTop: 6 }}>{product.name}</h2>
        <div className="row" style={{ gap: 12 }}>
          <span className="muted">Brand: {product.brand}</span>
          <span className="muted">★ {product.rating?.toFixed?.(1) ?? product.rating} ({product.numReviews} reviews)</span>
        </div>
        <p>{product.description}</p>
        <p className="price large">₹{product.price}</p>
        <div className="row">
          <label>Qty</label>
          <select value={qty} onChange={e => setQty(+e.target.value)}>
            {Array.from({ length: Math.min(product.countInStock || 10, 10) }).map((_, i) => (
              <option key={i+1} value={i+1}>{i+1}</option>
            ))}
          </select>
        </div>
        
        {/* Success Notification - uses the new .alert.success class from styles.css */}
        {message && <div className="alert success">{message}</div>}

        <div className="row" style={{ gap: 10 }}>
          <button className="btn primary" onClick={handleAddToCart} disabled={product.countInStock === 0}>
            {product.countInStock === 0 ? 'Out of stock' : 'Add to Cart'}
          </button>
          <button className="btn" onClick={() => window.history.back()}>Back</button>
        </div>
      </div>
    </div>
  )
}