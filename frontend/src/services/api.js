// src/services/api.js

import axios from 'axios';

const API_BASE = '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong!';
    return Promise.reject(new Error(message));
  }
);

// Auth service uses /auth/* base (separate microservice)
const authApi = axios.create({
  baseURL: '/auth',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

authApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Authentication failed';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  userRegister:         (data) => authApi.post('/user/register', data),
  userLogin:            (data) => authApi.post('/user/login', data),
  restaurantRegister:   (data) => authApi.post('/restaurant/register', data),
  restaurantLogin:      (data) => authApi.post('/restaurant/login', data),
};

// ── Menu APIs ──────────────────────────────────────────────
export const menuAPI = {
  getAll:          ()         => api.get('/menu'),
  getById:         (id)       => api.get(`/menu/${id}`),
  getByCategory:   (catId)    => api.get(`/menu/category/${catId}`),
  search:          (keyword)  => api.get(`/menu/search?keyword=${keyword}`),
  getVegItems:     ()         => api.get('/menu/veg'),
};

// ── Category APIs ──────────────────────────────────────────
export const categoryAPI = {
  getAll: () => api.get('/categories'),
};

// ── Order APIs ─────────────────────────────────────────────
export const orderAPI = {
  place:        (orderData) => api.post('/orders', orderData),
  getById:      (id)        => api.get(`/orders/${id}`),
  trackByEmail: (email)     => api.get(`/orders/track?email=${email}`),
};

export default api;
