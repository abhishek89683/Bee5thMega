import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

const DELIVERY_WINDOW_MS = 15 * 1000

function formatCountdown(ms) {
  const safeMs = Math.max(0, ms)
  const minutes = String(Math.floor(safeMs / 60000)).padStart(2, '0')
  const seconds = String(Math.floor((safeMs % 60000) / 1000)).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const initialOrder = location.state?.order || null

  const [order, setOrder] = useState(initialOrder)
  const [loading, setLoading] = useState(!initialOrder)
  const [error, setError] = useState(null)
  const [now, setNow] = useState(Date.now())
  const autoDeliveredRef = useRef(false)

  useEffect(() => {
    if (order || !id) return
    ;(async () => {
      try {
        const { data } = await api.get(`/orders/${id}`)
        setOrder(data)
      } catch (err) {
        console.error('Failed to fetch order detail', err)
        setError('Unable to load this order. Please return to Orders.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, order])

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(ticker)
  }, [])

  const countdown = useMemo(() => {
    if (!order) return { active: false, label: '--:--' }
    const createdAtMs = new Date(order.createdAt).getTime()
    const elapsed = now - createdAtMs
    const remaining = Math.max(0, DELIVERY_WINDOW_MS - elapsed)
    const active = !order.isDelivered && remaining > 0
    return { active, label: formatCountdown(remaining) }
  }, [order, now])

  useEffect(() => {
    if (!order || countdown.active || order.isDelivered || autoDeliveredRef.current) return
    if (countdown.label !== '00:00') return
    autoDeliveredRef.current = true
    const deliveredAt = new Date().toISOString()
    const deliveredOrder = { ...order, isDelivered: true, deliveredAt }
    setOrder(deliveredOrder)
    navigate(`/orders/${order._id}/delivered`, {
      replace: true,
      state: { order: deliveredOrder }
    })
  }, [countdown, navigate, order])

  if (!id) {
    navigate('/orders', { replace: true })
    return null
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 24 }}>
          <p>Loading order…</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 24 }}>
          <p>{error || 'Order unavailable.'}</p>
          <Link to="/orders" className="btn">Back to Orders</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container order-detail-page">
      <div className="row between" style={{ marginBottom: 18 }}>
        <div className="muted">Home / Orders / Detail</div>
        <Link to="/orders" className="btn btn-secondary">Back to Orders</Link>
      </div>
      <div className="card order-detail-card">
        <div className="order-detail-header">
          <div>
            <p className="eyebrow">Order overview</p>
            <h2>Order #{order._id.slice(-6).toUpperCase()}</h2>
            <p className="muted">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="order-status-block">
            <span className={`badge ${order.isDelivered ? 'success' : 'warning'}`}>
              {order.isDelivered ? 'Delivered' : 'Processing'}
            </span>
            {!order.isDelivered && (
              <span className={`countdown-pill ${countdown.active ? '' : 'countdown-pill--done'}`}>
                <span className="countdown-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img" focusable="false">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" fill="none" />
                    <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </span>
                <div className="countdown-copy">
                  <span className="countdown-text">Delivery in {countdown.label}</span>
                  <small className="countdown-subtext">10-min express window</small>
                </div>
              </span>
            )}
          </div>
        </div>
        <div className="order-meta-grid">
          <div className="order-meta-card">
            <span className="delivered-label">Payment method</span>
            <strong>{order.paymentMethod}</strong>
          </div>
          <div className="order-meta-card">
            <span className="delivered-label">Total amount</span>
            <strong>₹{order.totalPrice.toFixed(2)}</strong>
          </div>
          <div className="order-meta-card">
            <span className="delivered-label">Status</span>
            <strong>{order.isDelivered ? 'Delivered' : 'Preparing'}</strong>
          </div>
          <div className="order-meta-card">
            <span className="delivered-label">ETA</span>
            <strong>{countdown.label}</strong>
          </div>
        </div>
        <div className="order-items">
          <h3>Items in this order</h3>
          <div className="order-items-list">
            {order.orderItems.map(item => (
              <div key={`${item.product}-${item.qty}`} className="order-item-row">
                <div>
                  <p style={{ margin: '0 0 4px' }}>{item.name}</p>
                  <span className="muted">Qty: {item.qty}</span>
                </div>
                <strong>₹{(item.price * item.qty).toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
