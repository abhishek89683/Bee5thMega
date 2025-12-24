import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { returnOrder } from '../services/api'

const DELIVERY_WINDOW_MS = 60 * 1000 // 1 minute countdown
const ORDER_FILTERS = ['all', 'processing', 'delivered']

function formatCurrency(value = 0) {
  const amount = Number(value) || 0
  return `₹${amount.toFixed(2)}`
}

function formatCountdown(ms) {
  const safeMs = Math.max(0, ms)
  const minutes = String(Math.floor(safeMs / 60000)).padStart(2, '0')
  const seconds = String(Math.floor((safeMs % 60000) / 1000)).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [activeOrderId, setActiveOrderId] = useState(null)
  const [isReturning, setIsReturning] = useState({})
  const navigate = useNavigate()
  const autoDeliveredRef = useRef(new Set())

  const handleReturnOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to return this order? This action cannot be undone.')) {
      try {
        setIsReturning(prev => ({ ...prev, [orderId]: true }));
        
        // Update local state optimistically
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, isReturned: true, returnedAt: new Date().toISOString() }
              : order
          )
        );
        
        // Make the API call
        const response = await returnOrder(orderId);
        
        // If API call fails, revert the optimistic update
        if (!response || !response.data) {
          throw new Error('Failed to return order');
        }
        
        // Update with server data to ensure consistency
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, ...response.data.order, isReturned: true }
              : order
          )
        );
        
        toast.success('Order returned successfully!');
      } catch (error) {
        console.error('Error returning order:', error);
        // Revert optimistic update on error
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, isReturned: false, returnedAt: undefined }
              : order
          )
        );
        toast.error(error.response?.data?.message || 'Failed to return order');
      } finally {
        setIsReturning(prev => ({ ...prev, [orderId]: false }));
      }
    }
  };

  const downloadInvoice = (order) => {
    // Create a simple invoice HTML
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order._id.slice(-6).toUpperCase()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; }
          .order-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Invoice</h1>
          <p>Order #${order._id.slice(-6).toUpperCase()}</p>
          <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
          <p>Status: ${order.isDelivered ? 'Delivered' : 'Processing'}</p>
        </div>
        
        <div class="order-info">
          <h3>Order Details</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.qty}</td>
                  <td>₹${item.price.toFixed(2)}</td>
                  <td>₹${(item.price * item.qty).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Total: ₹${order.totalPrice.toFixed(2)}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create a Blob with the HTML content
    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order._id.slice(-6).toUpperCase()}.html`;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchOrders = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      const { data } = await api.get('/orders/my')
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders', error)
    } finally {
      if (showLoader) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(ticker)
  }, [])

  // Automatically mark orders as delivered when countdown completes
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders(currentOrders => {
        const now = Date.now()
        const updatedOrders = currentOrders.map(order => {
          if (order.isDelivered) return order
          
          const createdAtMs = new Date(order.createdAt).getTime()
          const elapsed = now - createdAtMs
          const remaining = DELIVERY_WINDOW_MS - elapsed
          
          if (remaining <= 0) {
            return { ...order, isDelivered: true, deliveredAt: new Date().toISOString() }
          }
          return order
        })
        
        // Only update if something changed
        if (JSON.stringify(updatedOrders) !== JSON.stringify(currentOrders)) {
          return updatedOrders
        }
        return currentOrders
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const ordersWithCountdown = useMemo(() => {
    return orders.map(order => {
      if (order.isDelivered) {
        return {
          ...order,
          countdownActive: false,
          countdownLabel: 'Delivered'
        }
      }
      
      const createdAtMs = new Date(order.createdAt).getTime()
      const elapsed = now - createdAtMs
      const remaining = DELIVERY_WINDOW_MS - elapsed
      const countdownActive = remaining > 0
      const displayMs = Math.max(0, remaining)
      
      return {
        ...order,
        countdownActive,
        countdownLabel: countdownActive ? formatCountdown(displayMs) : 'Preparing...',
        timeRemaining: displayMs
      }
    })
  }, [orders, now])

  const stats = useMemo(() => {
    const nonReturnedOrders = orders.filter(order => !order.isReturned);
    const totalSpent = nonReturnedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
    const processing = nonReturnedOrders.filter(order => !order.isDelivered).length
    const delivered = nonReturnedOrders.filter(order => order.isDelivered).length
    return { totalSpent, processing, delivered }
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (filter === 'processing') return ordersWithCountdown.filter(order => !order.isDelivered && !order.isReturned)
    if (filter === 'delivered') return ordersWithCountdown.filter(order => order.isDelivered && !order.isReturned)
    return ordersWithCountdown.filter(order => !order.isReturned)
  }, [ordersWithCountdown, filter])

  const emptyCopy = useMemo(() => {
    if (filter === 'processing') return 'No orders are currently being prepared.'
    if (filter === 'delivered') return 'No delivered orders yet. Complete an order to see it here.'
    if (orders.length > 0) return 'All your orders have been returned.'
    return 'You have no orders yet. Start shopping to place your first order!'
  }, [filter, orders.length])


  useEffect(() => {
  const completedOrders = ordersWithCountdown.filter(
    order =>
      !order.isDelivered &&
      !order.countdownActive &&
      order.countdownLabel === '00:00'
  )

  if (completedOrders.length === 0) return

  setOrders(prev =>
    prev.map(o =>
      completedOrders.some(co => co._id === o._id)
        ? { ...o, isDelivered: true, deliveredAt: new Date().toISOString() }
        : o
    )
  )
}, [ordersWithCountdown])


  if (loading) return <div className="container"><p>Loading...</p></div>

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <div>
        <div className="row between" style={{ marginBottom: 12 }}>
          <div className="muted">Home / Orders</div>
          <h2 style={{ margin: 0 }}>My Orders</h2>
        </div>
        <div className="order-toolbar">
          <div className="order-filter-group">
            {ORDER_FILTERS.map(option => (
              <button
                key={option}
                type="button"
                className={`chip ${filter === option ? 'chip--active' : ''}`}
                onClick={() => setFilter(option)}
              >
                {option === 'all' && 'All'}
                {option === 'processing' && 'Processing'}
                {option === 'delivered' && 'Delivered'}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchOrders(false)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh list'}
          </button>
        </div>

        <div className="order-meta-bar">
          <div className="meta-card">
            <span className="muted">Total spent</span>
            <strong>{formatCurrency(stats.totalSpent)}</strong>
          </div>
          <div className="meta-card">
            <span className="muted">Processing</span>
            <strong>{stats.processing}</strong>
          </div>
          <div className="meta-card">
            <span className="muted">Delivered</span>
            <strong>{stats.delivered}</strong>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
        {filteredOrders.length === 0 ? (
          <div className="card" style={{ padding: 16 }}>
            <p>{emptyCopy}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            {filteredOrders.map(order => (
              <article key={order._id} className="card" style={{ padding: '20px' }}>
                <div className="row between order-head">
                  <div>
                    <h4 style={{ marginBottom: 4 }}>Order #{order._id.slice(-6).toUpperCase()}</h4>
                    <p className="muted" style={{ margin: 0 }}>Placed on {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="order-status">
                    <span className={`badge ${order.isReturned ? 'danger' : order.isDelivered ? 'success' : 'warning'}`}>
                      {order.isReturned ? 'Returned' : order.isDelivered ? 'Delivered' : 'Processing'}
                    </span>
                    {!order.isDelivered && !order.isReturned && (
                      <span className={`countdown-pill ${order.countdownActive ? '' : 'countdown-pill--done'}`}>
                        <span className="countdown-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" role="img" focusable="false">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" fill="none" />
                            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        </span>
                        <div className="countdown-copy">
                          <span className="countdown-text">
                            {order.isDelivered ? 'Order Delivered' : `Delivering in ${order.countdownLabel}`}
                          </span>
                          <small className="countdown-subtext">
                            {order.isDelivered ? 'Your order has been delivered' : '1-min express delivery'}
                          </small>
                        </div>
                      </span>
                    )}
                  </div>
                </div>
                <div className="order-items-scroll">
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <div>
                        <p className="order-item-name">{item.name}</p>
                        <span className="muted">Qty: {item.qty}</span>
                      </div>
                      <strong>{formatCurrency(item.price * item.qty)}</strong>
                    </div>
                  ))}
                </div>
                <hr />
                <div className="row between order-card-footer">
                  <div>
                    <span className="muted">Total</span>
                    <strong style={{ display: 'block' }}>₹{order.totalPrice.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {order.isDelivered && !order.isReturned && (
                      <button 
                        onClick={() => handleReturnOrder(order._id)}
                        disabled={isReturning[order._id]}
                        className="btn btn-outline"
                        style={{ 
                          padding: '8px 12px',
                          fontSize: '14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#dc3545',
                          borderColor: '#dc3545'
                        }}
                      >
                        {isReturning[order._id] ? (
                          'Returning...'
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Return Order
                          </>
                        )}
                      </button>
                    )}
                    <button 
                      onClick={() => downloadInvoice(order)}
                      className="btn btn-outline"
                      style={{ 
                        padding: '8px 12px',
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Invoice
                    </button>
                    <Link
                      to={`/orders/${order._id}`}
                      state={{ order }}
                      className="btn btn-link"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
