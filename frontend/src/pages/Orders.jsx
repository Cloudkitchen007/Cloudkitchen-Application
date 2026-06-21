// src/pages/Orders.jsx

import React from 'react';
import OrderTracking from '../components/OrderTracking';

// Orders page is clean and simple —
// All the tracking logic lives inside OrderTracking component
// OrderTracking handles: email search, order cards, progress stepper

const Orders = () => {
  return (
    <div style={{ padding: '40px 0 60px' }}>
      <div className="container">

        {/* ── Page Header ── */}
        <h1 className="section-title">My Orders</h1>
        <p className="section-subtitle">
          Track your orders in real-time — enter your email below
        </p>

        {/* ── OrderTracking Component does everything ── */}
        <OrderTracking />

      </div>
    </div>
  );
};

export default Orders;