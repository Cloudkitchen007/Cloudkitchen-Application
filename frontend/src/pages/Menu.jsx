// src/pages/Menu.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { menuAPI, categoryAPI } from '../services/api';
import MenuCard from '../components/Menucard';

const Menu = () => {
  const [searchParams]              = useSearchParams();
  const [menuItems,   setMenuItems] = useState([]);
  const [categories,  setCategories]= useState([]);
  const [loading,     setLoading]   = useState(true);
  const [searchTerm,  setSearchTerm]= useState('');
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get('category') ? parseInt(searchParams.get('category')) : null
  );
  const [vegOnly, setVegOnly] = useState(false);

  // Load categories once
  useEffect(() => {
    categoryAPI.getAll()
      .then(res => setCategories(res.data || []))
      .catch(console.error);
  }, []);

  // Load menu items when filters change
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (searchTerm.trim()) {
        res = await menuAPI.search(searchTerm.trim());
      } else if (vegOnly) {
        res = await menuAPI.getVegItems();
      } else if (activeCategory) {
        res = await menuAPI.getByCategory(activeCategory);
      } else {
        res = await menuAPI.getAll();
      }
      setMenuItems(res.data || []);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeCategory, vegOnly]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId === activeCategory ? null : catId);
    setVegOnly(false);
    setSearchTerm('');
  };

  return (
    <div style={{ padding: '40px 0 60px' }}>
      <div className="container">

        <h1 className="section-title">Our Menu</h1>
        <p className="section-subtitle">
          {menuItems.length} delicious dishes available
        </p>

        {/* ── Search + Filters ── */}
        <div className="filter-bar">

          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setActiveCategory(null); setVegOnly(false); }}
            />
            {searchTerm && (
              <button style={{ background: 'none', border: 'none', cursor: 'pointer',
                               color: 'var(--text-light)', fontSize: '1.1rem' }}
                onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>

          {/* All */}
          <button
            className={`filter-chip ${!activeCategory && !vegOnly ? 'active' : ''}`}
            onClick={() => { setActiveCategory(null); setVegOnly(false); setSearchTerm(''); }}>
            🍽️ All
          </button>

          {/* Veg Only */}
          <button
            className={`filter-chip ${vegOnly ? 'active' : ''}`}
            onClick={() => { setVegOnly(!vegOnly); setActiveCategory(null); }}>
            🟢 Veg Only
          </button>

          {/* Categories */}
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}>
              {cat.icon} {cat.name}
            </button>
          ))}

        </div>

        {/* ── Menu Grid ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0',
                        color: 'var(--text-light)', fontSize: '1.1rem' }}>
            ⏳ Loading delicious items...
          </div>
        ) : menuItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔍</div>
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
              No items found. Try a different search or filter.
            </p>
          </div>
        ) : (
          <div className="menu-grid">
            {menuItems.map(item => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Menu;