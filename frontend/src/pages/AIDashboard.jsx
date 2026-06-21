// src/pages/AIDashboard.jsx
// Demand Forecasting Dashboard
// Fetches live menu items from /api/menu and applies demand forecasting on top.
// Falls back to syntheticDemand.json when the API is unavailable.

import React, { useState, useEffect, useCallback } from 'react';
import fallbackData from '../data/syntheticDemand.json';
import './AIDashboard.css';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Enrich a real API menu item with deterministic demand parameters ──────────
// Deterministic (no Math.random) so values stay stable across page refreshes.
const enrichWithDemand = (apiItem) => {
  const id       = typeof apiItem.id === 'number' ? apiItem.id : 0;
  const nameHash = (apiItem.name || '').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1000, 0);
  const seed     = id * 17 + nameHash;

  const catName  = (apiItem.category?.name || apiItem.category || '').toLowerCase();
  const itemName = (apiItem.name || '').toLowerCase();

  const isMain      = /main|curry|biryani|rice|pasta|noodle|bowl|wrap/i.test(catName + ' ' + itemName);
  const isBreakfast = /breakfast|dosa|idli|paratha|toast|coffee|tea|smoothie/i.test(catName + ' ' + itemName);
  const isDessert   = /dessert|sweet|ice cream|gulab|kheer|cake/i.test(catName + ' ' + itemName);

  return {
    id:                 String(apiItem.id),
    name:               apiItem.name,
    category:           apiItem.category?.name || apiItem.category || 'Uncategorized',
    baseDemand:         15 + (seed % 36),
    inventory:          20 + ((seed * 13) % 51),
    weekendMultiplier:  1.3,
    lunchFactor:        isMain ? 1.45 : isBreakfast ? 0.5 : 1.1,
    dinnerFactor:       isMain ? 1.6  : isDessert   ? 1.4 : 1.1,
    trend:              seed % 3 === 0 ? 'rising' : seed % 3 === 1 ? 'falling' : 'stable',
    perishabilityHours: isBreakfast ? 2 : isDessert ? 3 : 6,
  };
};

// ── Demand prediction ─────────────────────────────────────────────────────────
const predictDemand = (item) => {
  const now       = new Date();
  const day       = now.getDay();
  const hour      = now.getHours();
  const isWeekend = day === 0 || day === 6;

  let period, timeFactor;
  if      (hour >= 7  && hour < 11)  { period = 'Morning Prep';    timeFactor = 0.55; }
  else if (hour >= 11 && hour <= 14) { period = 'Lunch Rush';      timeFactor = item.lunchFactor ?? 1.3; }
  else if (hour >= 15 && hour <= 17) { period = 'Afternoon Lull';  timeFactor = 0.65; }
  else if (hour >= 18 && hour <= 21) { period = 'Dinner Service';  timeFactor = item.dinnerFactor ?? 1.5; }
  else                               { period = 'Off-Peak';        timeFactor = 0.25; }

  const trendMultiplier = item.trend === 'rising' ? 1.12 : item.trend === 'falling' ? 0.88 : 1.0;
  const hash     = [...String(item.id)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100, 0);
  const variance = Math.floor(hash * 0.08) - 4;

  let demand = item.baseDemand;
  if (isWeekend) demand = Math.round(demand * item.weekendMultiplier);
  demand = Math.round(demand * timeFactor * trendMultiplier) + variance;

  return { demand: Math.max(1, demand), isWeekend, dayName: DAY_NAMES[day], period, trend: item.trend ?? 'stable' };
};

// ── Risk computation ──────────────────────────────────────────────────────────
const computeRisk = (inventory, demand, item) => {
  const gap    = demand - inventory;
  const excess = inventory - demand;
  if (gap > 10) {
    return { risk: 'UNDERSTOCK', action: `Demand ${gap > 25 ? 'critically' : 'significantly'} exceeds stock by ${gap} units — prep immediately.` };
  }
  if (excess > 20) {
    const perishSoon = (item?.perishabilityHours ?? 24) <= 3;
    return { risk: 'OVERSTOCK',  action: perishSoon
      ? `${excess} excess units spoil in ${item.perishabilityHours}h — run flash deal NOW.`
      : `${excess} surplus units — offer 15% discount to clear before close.` };
  }
  return { risk: 'OPTIMAL', action: 'Inventory well-matched to expected demand.' };
};

const TREND_ICON  = { rising: '↑', stable: '→', falling: '↓' };
const TREND_COLOR = { rising: '#27AE60', stable: '#7F8C8D', falling: '#E74C3C' };


// ── Component ─────────────────────────────────────────────────────────────────
const AIDashboard = () => {
  const [allItems,         setAllItems]         = useState([]);
  const [dataSource,       setDataSource]       = useState('loading'); // 'api' | 'synthetic' | 'loading'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [rows,             setRows]             = useState([]);
  const [aiLoading,        setAiLoading]        = useState(false);
  const [aiOnline,         setAiOnline]         = useState(null);
  const [realDemand,       setRealDemand]       = useState({}); // { itemNameLower: unitsOrdered } from real orders
  const [realOrders,       setRealOrders]       = useState(0);  // total real orders processed by this app

  // Pull accumulated REAL order counts from the AI service's SQS-fed demand tracker.
  // Returns empty when the AI service is offline or no orders exist yet.
  const loadRealDemand = useCallback(async () => {
    try {
      const r = await fetch('/api/demand/realtime');
      if (!r.ok) throw new Error('offline');
      const d = await r.json();
      setRealDemand(d.demand || {});
      setRealOrders(d.total_orders_processed || 0);
    } catch {
      setRealDemand({});
      setRealOrders(0);
    }
  }, []);

  // ── Step 1: load menu items (+ real demand), fallback to syntheticDemand.json ──
  useEffect(() => {
    fetch('/api/menu')
      .then(r => r.ok ? r.json() : Promise.reject('not ok'))
      .then(items => {
        const arr = Array.isArray(items) ? items : [];
        if (arr.length === 0) throw new Error('empty');
        setAllItems(arr.map(enrichWithDemand));
        setDataSource('api');
      })
      .catch(() => {
        setAllItems(fallbackData);
        setDataSource('synthetic');
      });
    loadRealDemand();
  }, [loadRealDemand]);

  // ── Step 2: build rows whenever items or category filter changes ─────────────
  const fetchInsights = useCallback(async (currentRows) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/recommend_forecast', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          items: currentRows.map(r => ({
            id: r.id, name: r.name, kitchen: r.category || 'CloudKitchen',
            inventory: r.inventory, predicted_demand: r.demand,
          })),
        }),
      });
      if (!res.ok) throw new Error('offline');
      const data = await res.json();
      setAiOnline(true);
      setRows(prev =>
        prev.map(row => {
          const hit = (data.insights || []).find(i => i.id === row.id);
          return hit ? { ...row, insight: hit.insight } : row;
        })
      );
    } catch {
      setAiOnline(false);
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!allItems.length) return;
    const filtered = selectedCategory === 'All'
      ? allItems
      : allItems.filter(i => i.category === selectedCategory);
    const fresh = filtered.map(item => {
      const pred = predictDemand(item);
      // Prefer the REAL number of units ordered for this item (from actual orders);
      // fall back to the time-of-day estimate when this item has no orders yet.
      const realCount = realDemand[(item.name || '').trim().toLowerCase()];
      const usingReal = realCount != null;
      const demand    = usingReal ? realCount : pred.demand;
      const { risk, action } = computeRisk(item.inventory, demand, item);
      return {
        ...item, demand,
        demandSource: usingReal ? 'real' : 'estimate',
        isWeekend: pred.isWeekend, dayName: pred.dayName, period: pred.period, trend: pred.trend,
        risk, action, insight: null,
      };
    });
    setRows(fresh);
    if (fresh.length > 0) fetchInsights(fresh);
  }, [allItems, selectedCategory, realDemand, fetchInsights]);

  const categories = ['All', ...new Set(allItems.map(i => i.category))].sort((a, b) =>
    a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)
  );

  const today = rows[0];

  return (
    <div className="dash-container">

      {/* Header */}
      <div className="dash-header">
        <div>
          <h1>AI Demand Forecaster 📊</h1>
          <p>
            Real-time inventory risk · Today is&nbsp;<strong>{today?.dayName}</strong>
            {today?.isWeekend && <span className="weekend-badge">Weekend Surge</span>}
            &nbsp;·&nbsp;<span className="period-badge">{today?.period}</span>
            &nbsp;·&nbsp;
            <span style={{ fontSize: '0.78rem', color: dataSource === 'api' ? '#27AE60' : '#F39C12' }}>
              {dataSource === 'api' ? '🟢 Live menu data' : dataSource === 'synthetic' ? '🟡 Demo data (API offline)' : '…'}
            </span>
            &nbsp;·&nbsp;
            <span style={{ fontSize: '0.78rem', color: realOrders > 0 ? '#27AE60' : '#7F8C8D' }}>
              {realOrders > 0
                ? `📊 Demand from ${realOrders} real order${realOrders === 1 ? '' : 's'}`
                : '🟡 No orders yet — demand estimated'}
            </span>
          </p>
        </div>
        <div className="dash-controls">
          <select
            className="kitchen-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-outline" onClick={() => {
            setAllItems([]);
            setDataSource('loading');
            fetch('/api/menu')
              .then(r => r.ok ? r.json() : Promise.reject())
              .then(items => { setAllItems((items || []).map(enrichWithDemand)); setDataSource('api'); })
              .catch(() => { setAllItems(fallbackData); setDataSource('synthetic'); });
            loadRealDemand();
          }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* AI status bar */}
      <div className={`ai-status-bar ${aiOnline === false ? 'offline' : aiOnline ? 'online' : 'loading'}`}>
        {aiLoading && '⏳ Fetching AI insights…'}
        {!aiLoading && aiOnline === true  && '✅ AI insights powered by open-source LLM via LangChain + HuggingFace'}
        {!aiLoading && aiOnline === false && '⚠️ AI service warming up — rule-based insights shown. Retry in ~15 min after deploy.'}
      </div>

      {/* Summary cards */}
      <div className="summary-strip">
        {['UNDERSTOCK', 'OPTIMAL', 'OVERSTOCK'].map(level => {
          const count = rows.filter(r => r.risk === level).length;
          return (
            <div key={level} className={`summary-card summary-${level.toLowerCase()}`}>
              <span className="summary-count">{count}</span>
              <span className="summary-label">{level}</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      {dataSource === 'loading' ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-light)' }}>
          ⏳ Loading menu data…
        </div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Menu Item</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Predicted Orders</th>
                <th>Demand Bar</th>
                <th>Trend</th>
                <th>Risk</th>
                <th>Action</th>
                <th>AI Insight</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const pct      = Math.min(100, Math.round((row.demand / (row.inventory || 1)) * 100));
                const barColor = row.risk === 'UNDERSTOCK' ? '#E74C3C' : row.risk === 'OVERSTOCK' ? '#F39C12' : '#27AE60';
                const trendColor = TREND_COLOR[row.trend] || '#7F8C8D';
                const trendIcon  = TREND_ICON[row.trend]  || '→';

                return (
                  <tr key={row.id} className={`risk-row risk-${row.risk.toLowerCase()}`}>
                    <td className="item-name">{row.name}</td>
                    <td className="category-cell">{row.category}</td>
                    <td className="metric">{row.inventory}</td>
                    <td className="metric highlight">
                      {row.demand}
                      <span style={{ display: 'block', fontSize: '0.62rem', fontWeight: 400,
                                     color: row.demandSource === 'real' ? '#27AE60' : '#95A5A6' }}>
                        {row.demandSource === 'real' ? '📊 real orders' : 'estimated'}
                      </span>
                    </td>
                    <td className="bar-cell">
                      <div className="demand-bar-bg">
                        <div className="demand-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                      <span className="bar-pct" style={{ color: barColor }}>{pct}%</span>
                    </td>
                    <td className="trend-cell">
                      <span style={{ color: trendColor, fontWeight: 600, fontSize: '1.1rem' }}>{trendIcon}</span>
                      &nbsp;
                      <span style={{ color: trendColor, fontSize: '0.78rem' }}>{row.trend}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${row.risk.toLowerCase()}`}>{row.risk}</span>
                    </td>
                    <td className="action-cell">{row.action}</td>
                    <td className="insight-cell">
                      {row.insight
                        ? row.insight
                        : aiLoading
                          ? <span className="pulsing">Generating…</span>
                          : <span className="rule-insight">{row.action}</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="dash-footnote">
        {realOrders > 0
          ? `Demand = actual units ordered in your kitchen (${realOrders} order${realOrders === 1 ? '' : 's'} so far). `
          : 'Demand = time-of-day estimate until real orders arrive (day-of-week × time-of-day × trend). '}
        Items with no orders yet fall back to an estimate ·
        {dataSource === 'api' ? ' Live CloudKitchen menu' : ' API offline — demo data'}
      </p>
    </div>
  );
};

export default AIDashboard;
