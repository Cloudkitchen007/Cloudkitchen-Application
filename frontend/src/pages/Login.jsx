// src/pages/Login.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [tab, setTab] = useState('user');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fn = tab === 'user' ? authAPI.userLogin : authAPI.restaurantLogin;
      const res = await fn(form);
      const data = res.data || res;
      login(
        { email: form.email, role: tab, name: form.email.split('@')[0] },
        data.accessToken || data.token
      );
      toast.success(`Welcome back!`);
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '40px 36px' }}>

        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: 'var(--secondary)', marginBottom: 6 }}>
          Welcome Back
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: 28, fontSize: '0.95rem' }}>
          Sign in to continue to CloudKitchen
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
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--text)' }}>
              Email
            </label>
            <input
              type="email" name="email" required
              value={form.email} onChange={handle}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--text)' }}>
              Password
            </label>
            <input
              type="password" name="password" required
              value={form.password} onChange={handle}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '13px 0' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--text-light)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', fontFamily: 'Poppins, sans-serif',
  fontSize: '0.95rem', color: 'var(--text)', background: 'var(--bg)',
  outline: 'none', transition: 'border-color 0.2s',
};

export default Login;
