import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import ProductSkeleton from '../components/ProductSkeleton'

const fallbackImages = {
  mobiles: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80',
  laptops: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=80',
  audio: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
  appliances: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80',
  fashion: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'home & kitchen': 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80',
  default: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80'
}


export default function Shop() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  const searchParams = new URLSearchParams(location.search)
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [searchHistory, setSearchHistory] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('searchHistory') || '[]')
  } catch {
    return []
  }
})
const [showSuggestions, setShowSuggestions] = useState(false)
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [page, setPage] = useState(Number(searchParams.get('page') || 1))
  const [limit, setLimit] = useState(Number(searchParams.get('limit') || 12))

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, page, limit])

  async function fetchCategories() {
    try {
      const { data } = await api.get('/products/categories/list')
      setCategories(data)
    } catch { }
  }

  async function fetchProducts(customPage = page) {
    setLoading(true)
    const params = new URLSearchParams({
      keyword,
      category,
      sort,
      page: String(customPage),
      limit: String(limit)
    })
    // keep URL in sync
    navigate({ pathname: '/shop', search: params.toString() }, { replace: true })
    const { data } = await api.get(`/products?${params.toString()}`)
    setProducts(data.items)
    setTotal(data.total)
    setPages(data.pages)
    setPage(data.page)
    setLoading(false)
  }

  function submitSearch(e) {
  e?.preventDefault()
  setPage(1)
  
  // Save to search history
  if (keyword.trim()) {
    const newHistory = [keyword, ...searchHistory.filter(h => h !== keyword)].slice(0, 5)
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }
  
  setShowSuggestions(false)
  fetchProducts(1)
}
  const showingText = useMemo(() => {
    const start = (page - 1) * limit + 1
    const end = Math.min(page * limit, total)
    if (total === 0) return 'No products found'
    return `Showing ${start}-${end} of ${total}`
  }, [page, limit, total])

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <form className="toolbar" onSubmit={submitSearch}>
          <div style={{ position: 'relative', flex: 1 }}>
  <input 
    value={keyword} 
    onChange={e => setKeyword(e.target.value)} 
    onFocus={() => setShowSuggestions(true)}
    placeholder="Search products..." 
  />
  {showSuggestions && searchHistory.length > 0 && (
    <div className="search-suggestions">
      <div className="suggestions-header">Recent Searches</div>
      {searchHistory.map((term, i) => (
        <button
          key={i}
          className="suggestion-item"
          onClick={() => {
            setKeyword(term)
            setShowSuggestions(false)
            submitSearch()
          }}
        >
          <span>🔍</span> {term}
        </button>
      ))}
    </div>
  )}
</div>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Top Rated</option>
          </select>
          <button className="btn" type="submit">Search</button>
        </form>
        <div className="row between" style={{ marginTop: 8 }}>
          <span className="muted">{showingText}</span>
          <div className="row">
            <span className="muted">Per page</span>
            <select value={limit} onChange={e => { setLimit(+e.target.value); setPage(1) }}>
              {[12, 24, 36].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : (
        products.length === 0 ? (
          <div className="card" style={{ padding: 16 }}>
            <p>No products found. Try adjusting filters.</p>
          </div>
        ) : (
          <>
            <div className="grid">
              {products.map(p => {
                const categoryKey = p.category?.toLowerCase?.() || 'default'
                const fallback = fallbackImages[categoryKey] || fallbackImages.default
                const hasCustomImage = Boolean(p.image)
                const imageSrc = hasCustomImage
                  ? (p.image.startsWith('http') ? p.image : `/uploads/${p.image}`)
                  : fallback

                return (
                  <div key={p._id} className="card">
                    <Link to={`/product/${p._id}`}>
                      <img
                        src={imageSrc}
                        alt={p.name}
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = fallback
                        }}
                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                      />
                      <h3>{p.name}</h3>
                    </Link>
                    <p className="muted">{p.brand} • {p.category}</p>
                    <p className="price">₹{p.price}</p>
                    <div className="row between">
                      <span className="muted">★ {p.rating?.toFixed?.(1) ?? p.rating}</span>
                      <Link to={`/product/${p._id}`} className="btn primary">View</Link>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="row" style={{ justifyContent: 'center', marginTop: 16, gap: 8 }}>
              <button className="btn" disabled={page <= 1} onClick={() => fetchProducts(page - 1)}>Prev</button>
              <span className="muted">Page {page} of {pages}</span>
              <button className="btn" disabled={page >= pages} onClick={() => fetchProducts(page + 1)}>Next</button>
            </div>
          </>
        )
      )}
    </div>
  )
}
