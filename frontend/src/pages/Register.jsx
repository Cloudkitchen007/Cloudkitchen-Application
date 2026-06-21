// src/pages/Register.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const Register = () => {
  const [tab, setTab] = useState('user');
  const [form, setForm] = useState({ email: '', password: '', name: '', restaurantName: '', ownerName: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'user') {
        await authAPI.userRegister({ email: form.email, password: form.password, name: form.name });
      } else {
        await authAPI.restaurantRegister({
          email: form.email, password: form.password,
          restaurantName: form.restaurantName, ownerName: form.ownerName,
        });
      }
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 440, background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '40px 36px' }}>

        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: 'var(--secondary)', marginBottom: 6 }}>
          Create Account
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: 28, fontSize: '0.95rem' }}>
          Join CloudKitchen today
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: 50, padding: 4, marginBottom: 28 }}>
          {['user', 'restaurant'].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: 50, cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.85rem',
              background: tab === t ? 'var(--primary)' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-light)',
              transition: 'var(--transition)',
            }}>
              {t === 'user' ? '🍽️ Customer' : '🏪 Restaurant'}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          {tab === 'user' ? (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" name="name" required value={form.name} onChange={handle}
                placeholder="John Doe" style={inputStyle} />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Restaurant Name</label>
                <input type="text" name="restaurantName" required value={form.restaurantName} onChange={handle}
                  placeholder="Spice Garden" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Owner Name</label>
                <input type="text" name="ownerName" required value={form.ownerName} onChange={handle}
                  placeholder="Rahul Sharma" style={inputStyle} />
              </div>
            </>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" name="email" required value={form.email} onChange={handle}
              placeholder="you@example.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Password</label>
            <input type="password" name="password" required minLength={8} value={form.password} onChange={handle}
              placeholder="Min 8 characters" style={inputStyle} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '13px 0' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--text-light)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--text)' };
const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', fontFamily: 'Poppins, sans-serif',
  fontSize: '0.95rem', color: 'var(--text)', background: 'var(--bg)',
  outline: 'none', transition: 'border-color 0.2s',
};

export default Register;
