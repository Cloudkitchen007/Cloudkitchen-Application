// src/pages/AIRecommend.jsx

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import './AIRecommend.css';

const DIETARY_OPTIONS = [
  { key: 'vegetarian',     label: 'Vegetarian',   emoji: '🥦' },
  { key: 'vegan',          label: 'Vegan',         emoji: '🌱' },
  { key: 'gluten_free',    label: 'Gluten-Free',   emoji: '🌾' },
];

const ALLERGY_OPTIONS = [
  { key: 'contains_dairy', label: 'No Dairy',  emoji: '🥛' },
  { key: 'contains_nuts',  label: 'No Nuts',   emoji: '🥜' },
  { key: 'contains_gluten',label: 'No Gluten', emoji: '🚫' },
  { key: 'contains_seafood',label: 'No Seafood',emoji: '🦐' },
];

const TAG_COLORS = {
  vegetarian:      { bg: '#E8F5E9', color: '#2E7D32' },
  vegan:           { bg: '#F1F8E9', color: '#558B2F' },
  gluten_free:     { bg: '#E3F2FD', color: '#1565C0' },
  spicy:           { bg: '#FFF3E0', color: '#E65100' },
  healthy:         { bg: '#E0F7FA', color: '#00695C' },
  high_calorie:    { bg: '#FCE4EC', color: '#880E4F' },
  non_vegetarian:  { bg: '#FFEBEE', color: '#C62828' },
  contains_dairy:  { bg: '#F3E5F5', color: '#6A1B9A' },
  contains_nuts:   { bg: '#FFF8E1', color: '#F57F17' },
};

const AIRecommend = () => {
  const { addItem } = useCart();
  const [query, setQuery]           = useState('');
  const [prefs, setPrefs]           = useState(new Set());
  const [allergies, setAllergies]   = useState(new Set());
  const [topK, setTopK]             = useState(3);
  const [loading, setLoading]       = useState(false);
  const [results, setResults]       = useState([]);
  const [searched, setSearched]     = useState(false);

  const toggle = (setter, key) =>
    setter(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const submit = async (e) => {
    e.preventDefault();
    if (!query.trim()) { toast.error('Tell the AI what you are craving!'); return; }

    setLoading(true);
    setResults([]);
    setSearched(false);

    try {
      const res = await fetch('/api/recommend_quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query:       query.trim(),
          preferences: [...prefs],
          allergies:   [...allergies],
          top_k:       topK,
        }),
      });

      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setResults(data.recommendations || []);
      setSearched(true);

      if ((data.recommendations || []).length > 0) {
        toast.success(`Found ${data.recommendations.length} match${data.recommendations.length > 1 ? 'es' : ''}!`);
      } else {
        toast('No matches found — try relaxing your filters.', { icon: '🤔' });
      }
    } catch {
      toast.error('AI service is warming up — please wait a moment and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (rec) => {
    const food = rec.food_item;
    if (!food.price) { toast.error('Price unavailable for this item.'); return; }
    addItem({ id: food.id, name: food.name, price: food.price });
    toast.success(`${food.name} added to cart!`);
  };

  const visibleTags = (tags) =>
    tags.filter(t => !['non_vegetarian'].includes(t)).slice(0, 4);

  return (
    <div className="ai-page container">

      {/* Header */}
      <div className="ai-header">
        <h1>Ask the AI Chef 🤖</h1>
        <p>Describe your craving, set your dietary needs, and our AI finds your perfect dish.</p>
      </div>

      {/* Form */}
      <form className="ai-form" onSubmit={submit}>

        {/* Query */}
        <div className="form-group">
          <label>What are you craving?</label>
          <div className="query-wrap">
            <input
              type="text"
              placeholder="e.g. something spicy and filling, or a light healthy bowl..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Dietary preferences */}
        <div className="form-group">
          <label>Dietary Preference</label>
          <div className="chip-row">
            {DIETARY_OPTIONS.map(o => (
              <button
                key={o.key} type="button"
                className={`chip ${prefs.has(o.key) ? 'chip-on' : ''}`}
                onClick={() => toggle(setPrefs, o.key)}
              >
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Allergy exclusions */}
        <div className="form-group">
          <label>Exclude Allergens</label>
          <div className="chip-row">
            {ALLERGY_OPTIONS.map(o => (
              <button
                key={o.key} type="button"
                className={`chip chip-allergy ${allergies.has(o.key) ? 'chip-on' : ''}`}
                onClick={() => toggle(setAllergies, o.key)}
              >
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Number of results */}
        <div className="form-group form-row">
          <label>How many options?</label>
          <div className="num-chips">
            {[1, 3, 5].map(n => (
              <button
                key={n} type="button"
                className={`chip ${topK === n ? 'chip-on' : ''}`}
                onClick={() => setTopK(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
          {loading ? '🍳 Consulting the chef...' : '✨ Get AI Recommendations'}
        </button>
      </form>

      {/* Results */}
      {searched && results.length === 0 && (
        <div className="no-results">
          <p>😔 No safe matches found. Try relaxing your dietary filters or changing your query.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="ai-results">
          <h2>Chef's Picks for You</h2>
          <div className="recommendation-list">
            {results.map((rec, idx) => {
              const food = rec.food_item;
              const isVeg = food.dietary_tags.includes('vegetarian') || food.dietary_tags.includes('vegan');
              return (
                <div key={idx} className="recommendation-card">
                  <div className="card-top">
                    <div>
                      <div className="card-title-row">
                        <span className={`veg-dot ${isVeg ? 'veg' : 'nonveg'}`} title={isVeg ? 'Veg' : 'Non-Veg'} />
                        <h3>{food.name}</h3>
                        {food.price && (
                          <span className="price-badge">₹{food.price.toFixed(0)}</span>
                        )}
                      </div>
                      <span className="category-badge">{food.category}</span>
                    </div>
                    <button
                      className="btn btn-primary btn-sm add-cart-btn"
                      onClick={() => handleAddToCart(rec)}
                    >
                      + Cart
                    </button>
                  </div>

                  <p className="desc">{food.description}</p>

                  {/* Tags */}
                  <div className="tag-row">
                    {visibleTags(food.dietary_tags).map(tag => {
                      const style = TAG_COLORS[tag] || { bg: '#f0f0f0', color: '#555' };
                      return (
                        <span key={tag} className="tag" style={{ background: style.bg, color: style.color }}>
                          {tag.replace(/_/g, ' ')}
                        </span>
                      );
                    })}
                  </div>

                  {/* AI reason */}
                  <div className="ai-reason">
                    <strong>🤖 AI says:</strong> {rec.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommend;
