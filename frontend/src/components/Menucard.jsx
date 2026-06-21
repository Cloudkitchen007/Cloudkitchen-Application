// src/components/MenuCard.jsx

import React from 'react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

const MenuCard = ({ item }) => {
  const { items, addItem, updateQty } = useCart();
  const cartItem = items.find(i => i.id === item.id);

  const handleAdd = () => {
    addItem({
      id:       item.id,
      name:     item.name,
      price:    parseFloat(item.price),
      imageUrl: item.imageUrl,
    });
    toast.success(`${item.name} added to cart! 🛒`);
  };

  return (
    <div className="menu-card">

      <div className="menu-card-img-wrap">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="menu-card-img"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
          }}
        />
      </div>

      <div className="menu-card-body">
        <div className="menu-card-header">
          <span className="menu-card-name">{item.name}</span>
          <span className={item.isVeg ? 'badge-veg' : 'badge-nonveg'}>
            {item.isVeg ? '🟢 VEG' : '🔴 NON-VEG'}
          </span>
        </div>

        <p className="menu-card-desc">{item.description}</p>

        <div className="menu-card-footer">
          <div>
            <div className="menu-card-price">₹{parseFloat(item.price).toFixed(0)}</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <span className="rating">⭐ {item.rating}</span>
              <span className="prep-time">🕐 {item.prepTime} min</span>
            </div>
          </div>

          {cartItem ? (
            <div className="qty-controls">
              <button className="qty-btn"
                onClick={() => updateQty(item.id, cartItem.quantity - 1)}>−</button>
              <span className="qty-num">{cartItem.quantity}</span>
              <button className="qty-btn"
                onClick={() => updateQty(item.id, cartItem.quantity + 1)}>+</button>
            </div>
          ) : (
            <button className="add-btn" onClick={handleAdd}>+ Add</button>
          )}
        </div>
      </div>

    </div>
  );
};

export default MenuCard;