import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import OrderDelivered from './pages/OrderDelivered'
import Billing from './pages/Billing'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetail from './pages/ProductDetail'
import Trending from './pages/Trending'
import { useAuth } from './state/AuthContext'
import { useCart } from './state/CartContext'
import Footer from './components/Footer'
import ChatBox from './components/ChatBox'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) return savedTheme === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  
  const { user, logout } = useAuth()
  const { items } = useCart()
  const cartItemCount = items.length
  
  // Apply theme class to root element and save preference
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])
  
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode)
  }

  return (
    <div className="app-container">
      <header className="header">
        <Link to="/" className="logo" title="MegaMart">
          MegaMart
        </Link>
        <nav className="nav">
          {user && (
            <div className="nav-logo" aria-label={`Logged in as ${user.name}`}>
              <span className="user-badge">
                {user.name?.trim()?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
          <Link to="/shop">Shop</Link>
          <Link to="/trending">Trending</Link>
          <Link to="/cart">
            Cart
            {/* Display the item count badge */}
            {cartItemCount > 0 && <span className="badge-cart-count">{cartItemCount > 9 ? '9+' : cartItemCount}</span>}
          </Link>
          <button 
            onClick={toggleDarkMode} 
            className="theme-toggle"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          {user ? (
            <>
              <Link to="/orders">Orders</Link>
              <button className="btn" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
          <Route path="/orders/:id/delivered" element={<PrivateRoute><OrderDelivered /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <ChatBox />
      <Footer />
    </div>
  )
}