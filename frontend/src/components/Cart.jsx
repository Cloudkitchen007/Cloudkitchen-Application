// src/components/Cart.jsx

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';

const Cart = ({ onClose }) => {
  const { items, totalAmount, updateQty, removeItem, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [form, setForm]                 = useState({
    customerName:    '',
    customerEmail:   '',
    customerPhone:   '',
    deliveryAddress: '',
    paymentMethod:   'CASH_ON_DELIVERY',
    specialNotes:    '',
  });

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        items: items.map(i => ({ menuItemId: i.id, quantity: i.quantity })),
      };
      const res = await orderAPI.place(payload);
      toast.success(`Order #${res.data.id} placed successfully! 🎉`);
      clearCart();
      setShowCheckout(false);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />

      <div className="cart-sidebar">
        <div className="cart-header">
          <h2>🛒 Your Cart</h2>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty-icon">🍽️</span>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Your cart is empty</p>
              <p style={{ marginTop: 8, fontSize: '0.9rem' }}>
                Add some delicious items from our menu!
              </p>
            </div>
          ) : (
            items.map(item => (
              <div className="cart-item" key={item.id}>
                <img src={item.imageUrl} alt={item.name} className="cart-item-img"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
                  }}
                />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">
                    ₹{(item.price * item.quantity).toFixed(0)}
                  </div>
                </div>
                <div className="qty-controls">
                  <button className="qty-btn"
                    onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                  <span className="qty-num">{item.quantity}</span>
                  <button className="qty-btn"
                    onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total Amount</span>
              <span>₹{totalAmount.toFixed(0)}</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setShowCheckout(true)}>
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>

      {/* ── Checkout Modal ── */}
      {showCheckout && (
        <div className="checkout-overlay">
          <div className="checkout-modal">
            <h2>📋 Checkout</h2>
            <form onSubmit={handlePlaceOrder}>

              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input name="customerName" value={form.customerName}
                    onChange={handleChange} placeholder="John Doe" required />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input name="customerPhone" value={form.customerPhone}
                    onChange={handleChange} placeholder="+91 9999999999" required />
                </div>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="customerEmail" value={form.customerEmail}
                  onChange={handleChange} placeholder="john@example.com" required />
              </div>

              <div className="form-group">
                <label>Delivery Address *</label>
                <textarea name="deliveryAddress" value={form.deliveryAddress}
                  onChange={handleChange} rows={3}
                  placeholder="Full delivery address with landmark" required />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select name="paymentMethod" value={form.paymentMethod}
                  onChange={handleChange}>
                  <option value="CASH_ON_DELIVERY">💵 Cash on Delivery</option>
                  <option value="UPI">📱 UPI</option>
                  <option value="CARD">💳 Card</option>
                </select>
              </div>

              <div className="form-group">
                <label>Special Notes</label>
                <textarea name="specialNotes" value={form.specialNotes}
                  onChange={handleChange} rows={2}
                  placeholder="Any special instructions? (optional)" />
              </div>

              {/* Order Summary */}
              <div style={{
                background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                padding: '16px', marginBottom: '20px'
              }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Order Summary</div>
                {items.map(i => (
                  <div key={i.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.9rem', padding: '4px 0'
                  }}>
                    <span>{i.name} × {i.quantity}</span>
                    <span>₹{(i.price * i.quantity).toFixed(0)}</span>
                  </div>
                ))}
                <div style={{
                  borderTop: '2px solid var(--border)', marginTop: 12, paddingTop: 12,
                  display: 'flex', justifyContent: 'space-between',
                  fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem'
                }}>
                  <span>Total</span>
                  <span>₹{totalAmount.toFixed(0)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-outline"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowCheckout(false)}>
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                  disabled={loading}>
                  {loading ? '⏳ Placing...' : '🎉 Place Order'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;