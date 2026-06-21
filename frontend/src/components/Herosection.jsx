import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Rotating food taglines for the hero
const TAGLINES = [
  'Biryani that warms your soul 🍚',
  'Butter Chicken like never before 🍗',
  'Fresh desserts every single day 🍮',
  'From our kitchen to your doorstep 🚴',
];

// Stats displayed below hero text
const STATS = [
  { number: '50+',  label: 'Menu Items'      },
  { number: '4.8★', label: 'Avg Rating'      },
  { number: '30min',label: 'Avg Delivery'    },
  { number: '10K+', label: 'Happy Customers' },
];

const HeroSection = ({ onCartClick }) => {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [fade,         setFade]         = useState(true);

  // Rotate taglines every 3 seconds with fade animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTaglineIndex(prev => (prev + 1) % TAGLINES.length);
        setFade(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">

          {/* ── Badge ── */}
          <div
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '8px',
              background:     'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              border:         '1px solid rgba(255,255,255,0.3)',
              borderRadius:   '50px',
              padding:        '8px 20px',
              marginBottom:   '24px',
              fontSize:       '0.85rem',
              fontWeight:     600,
            }}
          >
            <span
              style={{
                width:        '8px',
                height:       '8px',
                background:   '#4ade80',
                borderRadius: '50%',
                display:      'inline-block',
                animation:    'pulse 1.5s infinite',
              }}
            />
            Now Accepting Orders • Free Delivery Above ₹499
          </div>

          {/* ── Main Heading ── */}
          <h1 className="hero-title">
            Delicious Food,
            <br />
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>
              Delivered Fast
            </span>{' '}
            🚀
          </h1>

          {/* ── Rotating Tagline ── */}
          <p
            className="hero-subtitle"
            style={{
              opacity:    fade ? 1 : 0,
              transform:  fade ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.4s ease',
              minHeight:  '28px',
            }}
          >
            {TAGLINES[taglineIndex]}
          </p>

          {/* ── CTA Buttons ── */}
          <div className="hero-actions">
            <Link
              to="/menu"
              className="btn"
              style={{
                background:   'white',
                color:        'var(--primary)',
                fontWeight:   700,
                fontSize:     '1rem',
                padding:      '14px 32px',
                boxShadow:    '0 4px 20px rgba(0,0,0,0.15)',
              }}
            >
              🍽️ Explore Menu
            </Link>

            <button
              className="btn"
              style={{
                background:   'rgba(255,255,255,0.15)',
                color:        'white',
                border:       '2px solid rgba(255,255,255,0.5)',
                backdropFilter: 'blur(8px)',
                fontSize:     '1rem',
                padding:      '14px 32px',
              }}
              onClick={onCartClick}
            >
              🛒 View Cart
            </button>
          </div>

          {/* ── Stats Row ── */}
          <div className="hero-stats">
            {STATS.map((stat, idx) => (
              <div className="stat-item" key={stat.label}>
                {/* Divider between stats */}
                {idx > 0 && (
                  <div
                    style={{
                      position:   'absolute',
                      left:       0,
                      top:        '20%',
                      height:     '60%',
                      width:      '1px',
                      background: 'rgba(255,255,255,0.3)',
                    }}
                  />
                )}
                <span className="stat-number">{stat.number}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Decorative Floating Emoji ── */}
        <div className="hero-emoji" aria-hidden="true">
          🍛
        </div>

        {/* ── Floating Food Cards (decorative) ── */}
        <div
          style={{
            position:    'absolute',
            right:       '5%',
            top:         '15%',
            display:     'flex',
            flexDirection:'column',
            gap:         '16px',
            opacity:     0.9,
          }}
          className="hero-float-cards"
        >
          {[
            { emoji: '🍗', name: 'Butter Chicken', price: '₹399', rating: '4.8' },
            { emoji: '🍚', name: 'Chicken Biryani', price: '₹449', rating: '4.9' },
            { emoji: '🍮', name: 'Gulab Jamun',     price: '₹149', rating: '4.7' },
          ].map(card => (
            <div
              key={card.name}
              style={{
                background:    'rgba(255,255,255,0.15)',
                backdropFilter:'blur(12px)',
                border:        '1px solid rgba(255,255,255,0.3)',
                borderRadius:  '16px',
                padding:       '12px 20px',
                display:       'flex',
                alignItems:    'center',
                gap:           '12px',
                color:         'white',
                minWidth:      '200px',
                animation:     `float ${2.5 + Math.random()}s ease-in-out infinite alternate`,
              }}
            >
              <span style={{ fontSize: '2rem' }}>{card.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {card.name}
                </div>
                <div
                  style={{
                    display:  'flex',
                    gap:      '8px',
                    fontSize: '0.8rem',
                    opacity:  0.85,
                  }}
                >
                  <span>{card.price}</span>
                  <span>⭐ {card.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Wave SVG at bottom ── */}
      <div
        style={{
          position: 'absolute',
          bottom:   0,
          left:     0,
          right:    0,
          lineHeight: 0,
        }}
      >
        <svg
          viewBox="0 0 1440 60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '60px' }}
        >
          <path
            d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
            fill="#FFF9F5"
          />
        </svg>
      </div>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float {
          from { transform: translateY(0px);  }
          to   { transform: translateY(-10px); }
        }
        @media (max-width: 900px) {
          .hero-float-cards { display: none !important; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;