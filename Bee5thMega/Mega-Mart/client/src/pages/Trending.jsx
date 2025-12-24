import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Trending() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        // Fetch top rated products as "trending"
        const { data } = await api.get('/products?sort=rating_desc&limit=12')
        setProducts(data.items || [])
      } catch (err) {
        console.error('Failed to fetch trending products', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="container"><p>Loading trending products...</p></div>

  return (
    <div className="container">
      <div className="row between" style={{ marginBottom: 24, marginTop: 8 }}>
        <div>
          <div className="muted">Home / Trending</div>
          <h2 style={{ margin: '8px 0 0' }}>Trending Now</h2>
        </div>
      </div>
      
      {products.length === 0 ? (
        <div className="card" style={{ padding: 16 }}>
          <p>No trending products found right now.</p>
          <Link to="/shop" className="btn">Go to Shop</Link>
        </div>
      ) : (
        <div className="grid">
          {products.map(p => (
            <div key={p._id} className="card product-card">
              <Link to={`/product/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <img src={p.image || 'https://via.placeholder.com/400x300?text=Product'} alt={p.name} />
                <h3>{p.name}</h3>
              </Link>
              <p className="muted">{p.brand} • {p.category}</p>
              <p className="price">₹{p.price}</p>
              <div className="row between">
                <span className="muted">★ {p.rating?.toFixed?.(1) ?? p.rating}</span>
                <Link to={`/product/${p._id}`} className="btn primary">View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}