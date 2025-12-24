import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

function formatDateTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleString()
  } catch (e) {
    return '—'
  }
}

export default function OrderDelivered() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const seededOrder = location.state?.order || null
  const [order, setOrder] = useState(seededOrder)
  const [loading, setLoading] = useState(!seededOrder)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (order || !id) return
    ;(async () => {
      try {
        const { data } = await api.get(`/orders/${id}`)
        setOrder(data)
      } catch (err) {
        console.error('Failed to fetch delivered order', err)
        setError('Unable to load order details. Please return to Orders.')
      } finally {
        setLoading(false)
      }
    })()
  }, [order, id])

  const itemsSummary = useMemo(() => {
    if (!order) return []
    return order.orderItems?.map(item => ({
      id: `${item.product}-${item.qty}`,
      name: item.name,
      qty: item.qty,
      total: (item.price * item.qty).toFixed(2)
    })) || []
  }, [order])

  if (!id) {
    navigate('/orders', { replace: true })
    return null
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 24 }}>
          <p>Finalizing your delivery details…</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 24 }}>
          <p>{error || 'Order details unavailable.'}</p>
          <Link className="btn" to="/orders">Back to Orders</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="delivered-card card">
        <div className="delivered-hero">
          <div className="delivered-icon" aria-hidden="true">✓</div>
          <div>
            <p className="eyebrow">Delivered in under 10 minutes</p>
            <h2>Order #{order._id.slice(-6).toUpperCase()} is here</h2>
            <p className="muted">Completed at {formatDateTime(order.deliveredAt || order.updatedAt)}</p>
          </div>
        </div>
        <div className="delivered-grid">
          <div>
            <span className="delivered-label">Payment status</span>
            <strong>{order.isPaid ? 'Paid' : 'Cash on Delivery'}</strong>
          </div>
          <div>
            <span className="delivered-label">Total amount</span>
            <strong>₹{order.totalPrice?.toFixed(2)}</strong>
          </div>
          <div>
            <span className="delivered-label">Items</span>
            <strong>{order.orderItems?.length || 0}</strong>
          </div>
        </div>
        <div className="delivered-items">
          {itemsSummary.map(item => (
            <div key={item.id} className="delivered-item-row">
              <span>{item.name} × {item.qty}</span>
              <span>₹{item.total}</span>
            </div>
          ))}
        </div>
        <div className="delivered-actions">
          <Link to="/orders" className="btn">Back to Orders</Link>
          <Link to="/shop" className="btn btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  )
}
