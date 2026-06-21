// src/components/Footer.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">

        <div>
          <div className="footer-brand">🍳 CloudKitchen</div>
          <p className="footer-desc">
            Bringing restaurant-quality food straight to your doorstep.
            Fresh ingredients, expert chefs, unforgettable flavors.
          </p>
        </div>

        <div>
          <div className="footer-title">Quick Links</div>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/menu">Our Menu</Link></li>
            <li><Link to="/orders">Track Order</Link></li>
          </ul>
        </div>

        <div>
          <div className="footer-title">Contact</div>
          <ul className="footer-links">
            <li><a href="tel:+911234567890">📞 +91 12345 67890</a></li>
            <li><a href="mailto:hello@cloudkitchen.com">✉️ hello@cloudkitchen.com</a></li>
            <li><span style={{ opacity: 0.7 }}>📍 Mumbai, India</span></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} CloudKitchen. Built with ❤️ for food lovers.</p>
      </div>
    </div>
  </footer>
);

export default Footer;