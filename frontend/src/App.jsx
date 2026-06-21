import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cart from './components/Cart';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import AIRecommend from './pages/AIRecommend';
import AIDashboard from './pages/AIDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';
import Testimonials from './pages/Testimonials';

function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'Poppins, sans-serif',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#FF6B35', secondary: 'white' } },
            }}
          />

          <Navbar onCartClick={() => setCartOpen(true)} />
          {cartOpen && <Cart onClose={() => setCartOpen(false)} />}

          <main>
            <Routes>
              <Route path="/"               element={<Home onCartClick={() => setCartOpen(true)} />} />
              <Route path="/menu"           element={<Menu />} />
              <Route path="/orders"         element={<Orders />} />
              <Route path="/orders/:id"     element={<OrderDetail />} />
              <Route path="/testimonials"   element={<Testimonials />} />
              <Route path="/ai-recommend"   element={<AIRecommend />} />
              <Route path="/admin/forecast" element={<AIDashboard />} />
              <Route path="/login"          element={<Login />} />
              <Route path="/register"       element={<Register />} />
            </Routes>
          </main>

          <Footer />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
