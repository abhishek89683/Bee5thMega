import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const heroSlides = [
  {
    id: 'future-tech',
    eyebrow: 'New this week',
    title: 'Unbox the future today',
    description: 'Shop curated tech drops, limited collabs, and elevated essentials with same-day dispatch.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    stats: [
      { value: '120+', label: 'fresh arrivals' },
      { value: '4hr', label: 'express slots' },
      { value: '4.9★', label: 'customer love' }
    ]
  },
  {
    id: 'home-refresh',
    eyebrow: 'Mega home refresh',
    title: 'Design-forward living & kitchen',
    description: 'Bundle smart appliances with décor upgrades and unlock layered savings across categories.',
    image: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80',
    stats: [
      { value: '30%', label: 'bundle off' },
      { value: '48h', label: 'priority ship' },
      { value: '24/7', label: 'expert chat' }
    ]
  },
  {
    id: 'fashion-drop',
    eyebrow: 'Limited drop',
    title: 'Street meets studio fashion',
    description: 'Elevate your fits with athleisure, luxe basics, and accessories styled by top creators.',
    image: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80',
    stats: [
      { value: '70+', label: 'labels' },
      { value: 'Free', label: 'stylist tips' },
      { value: 'Easy', label: 'returns' }
    ]
  }
]

const categories = [
  { name: 'Mobiles', img: 'https://soum.sa/en/blog/wp-content/uploads/2025/05/Mobile-Phones-2.webp' },
  { name: 'Laptops', img: 'https://hips.hearstapps.com/hmg-prod/images/ipad-vs-laptop-668d1cee7fa81.jpeg' },
  { name: 'Audio', img: 'https://swarajya.gumlet.io/swarajya/2021-09/06416474-8c7f-46e2-a48a-e98e191fc9b1/Product_image.png?w=610&q=50&compress=true&format=auto' },
  { name: 'Appliances', img: 'https://cdn.firstcry.com/education/2023/01/13101355/Names-Of-Household-Appliances-In-English.jpg' },
  { name: 'Fashion', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQb4ZdFt3hPal9jsZIlFBPkCMCaFOS5sWGaSQ&s' },
  { name: 'Home & Kitchen', img: 'https://www.hunarcourses.com/blog/wp-content/uploads/2021/04/home-interior-design-ideas.jpg' }
]

const promoOffers = [
  {
    title: 'Creator-approved tech bundles',
    copy: 'Stack accessories, cases, and wearables for an additional 12% cart boost.',
    img: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'Weekend flash prices',
    copy: 'Beat the timer to grab kitchen must-haves and smart cleaners with VIP credits.',
    img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'Looks for every layer',
    copy: 'Mix-and-match fashion capsules curated by stylists for every climate.',
    img: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80'
  }
]

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0)
  const categoryTrackRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const goToSlide = (idx) => setActiveSlide(idx)
  const nextSlide = () => setActiveSlide(prev => (prev + 1) % heroSlides.length)
  const prevSlide = () => setActiveSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length)
  const scrollCategories = (direction) => {
    const track = categoryTrackRef.current
    if (!track) return
    const amount = track.clientWidth * 0.8
    track.scrollBy({ left: direction === 'next' ? amount : -amount, behavior: 'smooth' })
  }

  return (
    <div className="container home">
      <section className="hero hero-slider" data-animate="fade-up">
        <div className="hero-slider-inner" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
          {heroSlides.map(slide => (
            <article className="hero-slide" key={slide.id}>
              <div className="hero-copy">
                <span className="eyebrow">{slide.eyebrow}</span>
                <h1>{slide.title}</h1>
                <p>{slide.description}</p>
                <div className="hero-ctas">
                  <Link to="/shop" className="btn primary">Shop the drop</Link>
                  <Link to="/trending" className="btn ghost">Trending now</Link>
                </div>
                <div className="stat-group">
                  {slide.stats.map(stat => (
                    <div className="stat-pill" key={stat.label}>
                      <span className="stat-value">{stat.value}</span>
                      <span className="stat-label">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hero-visual">
                <div className="hero-glow" aria-hidden="true" />
                <img src={slide.image} alt={slide.title} loading="lazy" />
              </div>
            </article>
          ))}
        </div>
        <div className="hero-controls">
          <button type="button" onClick={prevSlide} aria-label="Previous slide">‹</button>
          <div className="dots" role="tablist">
            {heroSlides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-label={`Go to ${slide.eyebrow}`}
                aria-selected={activeSlide === idx}
                className={activeSlide === idx ? 'dot active' : 'dot'}
                onClick={() => goToSlide(idx)}
              />
            ))}
          </div>
          <button type="button" onClick={nextSlide} aria-label="Next slide">›</button>
        </div>
      </section>

      <section className="section categories" data-animate="fade-up">
        <div className="section-header">
          <div>
            <span className="eyebrow">Explore categories</span>
            <h2>Shop by lifestyle</h2>
            <p className="muted">Browse curated collections spanning smart tech, home refresh, audio upgrades, and more.</p>
          </div>
          <Link to="/shop" className="btn ghost">View all deals</Link>
        </div>
        <p className="muted">Slide through trending categories tailored to how you live.</p>
        <div className="category-slider-wrapper">
          <button
            type="button"
            className="slider-btn prev"
            aria-label="Scroll categories left"
            onClick={() => scrollCategories('prev')}
          >
            ‹
          </button>
          <div className="category-slider" ref={categoryTrackRef} role="list">
            {categories.map(category => (
              <Link
                key={category.name}
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className="category-card"
                role="listitem"
              >
                <div className="category-media">
                  <img src={category.img} alt={category.name} loading="lazy" />
                  <span className="category-chip">Tap to explore</span>
                </div>
                <div className="category-copy">
                  <h3>{category.name}</h3>
                  <p>Curated picks across budgets with community ratings.</p>
                </div>
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="slider-btn next"
            aria-label="Scroll categories right"
            onClick={() => scrollCategories('next')}
          >
            ›
          </button>
        </div>
      </section>

      <section className="section promos" data-animate="fade-up">
        <div className="section-header">
          <div>
            <span className="eyebrow">Weekly spotlight</span>
            <h2>Designer bundles & timed drops</h2>
          </div>
        </div>
        <div className="promo-carousel">
          {promoOffers.map(promo => (
            <article key={promo.title} className="promo-card">
              <div className="promo-copy">
                <h3>{promo.title}</h3>
                <p>{promo.copy}</p>
                <Link to="/shop" className="btn primary">Shop drop</Link>
              </div>
              <div className="promo-media">
                <img src={promo.img} alt={promo.title} loading="lazy" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section cta" data-animate="fade-up">
        <div className="cta-banner">
          <div>
            <span className="eyebrow">Member exclusives</span>
            <h2>Unlock tiered cashback & priority concierge</h2>
            <p>Join MegaClub for launch-day alerts, price-drop texts, and extended warranty perks.</p>
          </div>
          <div className="cta-actions">
            <Link to="/register" className="btn primary">Join free</Link>
            <Link to="/orders" className="btn ghost">Track an order</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
