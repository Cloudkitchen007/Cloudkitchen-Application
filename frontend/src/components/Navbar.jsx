// src/components/Navbar.jsx

import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onCartClick }) => {
  const { totalItems, totalAmount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">

        <Link to="/" className="navbar-brand">
          🍳 Cloud<span>Kitchen</span>
        </Link>

        <ul className="navbar-links">
          <li><NavLink to="/"               end>Home</NavLink></li>
          <li><NavLink to="/menu"              >Menu</NavLink></li>
          <li><NavLink to="/orders"            >My Orders</NavLink></li>
          <li><NavLink to="/testimonials"      >Testimonials</NavLink></li>
          <li><NavLink to="/ai-recommend"      className="ai-nav-btn">🤖 Ask AI</NavLink></li>
          <li><NavLink to="/admin/forecast"    className="admin-nav-btn">📊 AI Dashboard</NavLink></li>
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500 }}>
                {user.role === 'restaurant' ? '🏪' : '👤'} {user.name}
              </span>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login"    className="btn btn-outline btn-sm">Sign In</NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">Register</NavLink>
            </>
          )}

          <button className="cart-btn" onClick={onCartClick}>
            🛒 Cart
            {totalItems > 0 && (
              <>
                <span className="cart-badge">{totalItems}</span>
                <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  ₹{totalAmount.toFixed(0)}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;