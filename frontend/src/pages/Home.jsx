// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI, menuAPI } from '../services/api';
import MenuCard from '../components/Menucard';
import HeroSection from '../components/Herosection';  // ✅ now actually used

const Home = ({ onCartClick }) => {
  const [categories,    setCategories]    = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, menuRes] = await Promise.all([
          categoryAPI.getAll(),
          menuAPI.getAll(),
        ]);

        setCategories(catRes.data || []);

        // Top 4 highest-rated items as featured
        const sorted = (menuRes.data || [])
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 4);

        setFeaturedItems(sorted);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {/* ── Hero Section ── */}
      {/* ✅ Using HeroSection component instead of manual hero markup */}
      <HeroSection onCartClick={onCartClick} />

      {/* ── Browse by Category ── */}
      <section style={{ padding: '60px 0', background: 'white' }}>
        <div className="container">

          <h2 className="section-title">Browse by Category</h2>
          <p className="section-subtitle">What are you craving today?</p>

          {loading ? (
            <p style={{ color: 'var(--text-light)' }}>Loading categories...</p>
          ) : (
            <div
              style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap:                 '16px',
              }}
            >
              {categories.map(cat => (
                <Link
                  to={`/menu?category=${cat.id}`}
                  key={cat.id}
                  style={{
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    gap:            '10px',
                    padding:        '24px 16px',
                    background:     'var(--bg)',
                    borderRadius:   'var(--radius)',
                    textDecoration: 'none',
                    color:          'var(--text)',
                    transition:     'var(--transition)',
                    border:         '2px solid transparent',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform   = 'translateY(-4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.transform   = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '2.5rem' }}>{cat.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Top Picks / Featured Items ── */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">

          <h2 className="section-title">⭐ Top Picks</h2>
          <p className="section-subtitle">Our highest-rated dishes you must try</p>

          {loading ? (
            <p style={{ color: 'var(--text-light)' }}>Loading items...</p>
          ) : (
            <div className="menu-grid">
              {featuredItems.map(item => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link to="/menu" className="btn btn-primary">
              View Full Menu →
            </Link>
          </div>

        </div>
      </section>

      {/* ── Why CloudKitchen ── */}
      <section style={{ padding: '60px 0', background: 'white' }}>
        <div className="container">

          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Why CloudKitchen?
          </h2>

          <div
            style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap:                 '32px',
              marginTop:           '40px',
            }}
          >
            {[
              {
                icon:  '👨‍🍳',
                title: 'Expert Chefs',
                desc:  'Trained chefs with 10+ years of experience',
              },
              {
                icon:  '🌿',
                title: 'Fresh Ingredients',
                desc:  'Sourced fresh daily from local farms',
              },
              {
                icon:  '⚡',
                title: 'Fast Delivery',
                desc:  'Average delivery time under 30 minutes',
              },
              {
                icon:  '💯',
                title: 'Quality Assured',
                desc:  'Hygienic kitchens with FSSAI certification',
              },
            ].map(feat => (
              <div
                key={feat.title}
                style={{
                  textAlign:    'center',
                  padding:      '32px 20px',
                  borderRadius: 'var(--radius)',
                  background:   'var(--bg)',
                  transition:   'var(--transition)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform  = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow  = 'var(--shadow-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform  = 'translateY(0)';
                  e.currentTarget.style.boxShadow  = 'none';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                  {feat.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '8px' }}>
                  {feat.title}
                </div>
                <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                  {feat.desc}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  );
};

export default Home;