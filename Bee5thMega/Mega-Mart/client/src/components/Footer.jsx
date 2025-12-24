import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-glow" aria-hidden="true" />
      <div className="footer-shell">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="logo">MegaMart</Link>
            <p className="muted">Your one‑stop shop for electronics, fashion, and home essentials. Great deals. Fast delivery.</p>
            <div className="footer-pill-row">
              <span className="footer-pill">Same-day dispatch</span>
              <span className="footer-pill">24/7 concierge</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop?category=Mobiles">Mobiles</Link></li>
              <li><Link to="/shop?category=Laptops">Laptops</Link></li>
              <li><Link to="/shop?category=Audio">Audio</Link></li>
              <li><Link to="/shop?category=Home%20%26%20Kitchen">Home & Kitchen</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><Link to="/orders">My Orders</Link></li>
              <li><a href="#" onClick={e => e.preventDefault()}>Returns & Refunds</a></li>
              <li><a href="#" onClick={e => e.preventDefault()}>Shipping Info</a></li>
              <li><a href="#" onClick={e => e.preventDefault()}>Help Center</a></li>
            </ul>
          </div>

          <div className="footer-news">
            <h4>Stay updated</h4>
            <p className="muted">Subscribe to our newsletter for latest offers.</p>
            <form className="footer-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="you@example.com" aria-label="Email" />
              <button className="btn primary" type="submit">Subscribe</button>
            </form>
            <div className="footer-social">
              <a href="#" onClick={e => e.preventDefault()} aria-label="Twitter" title="Twitter">𝕏</a>
              <a href="#" onClick={e => e.preventDefault()} aria-label="Instagram" title="Instagram">IG</a>
              <a href="#" onClick={e => e.preventDefault()} aria-label="Facebook" title="Facebook">fb</a>
            </div>
          </div>
        </div>

        <div className="footer-divider" aria-hidden="true" />

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} MegaMart • All rights reserved</p>
          <div className="footer-links">
            <a href="#" onClick={e => e.preventDefault()}>Privacy</a>
            <a href="#" onClick={e => e.preventDefault()}>Terms</a>
            <a href="#" onClick={e => e.preventDefault()}>Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
