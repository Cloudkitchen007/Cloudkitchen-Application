import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';

const ORDER_STEPS = [
  { key: 'PLACED',           icon: '📋', label: 'Order Placed',    time: '0 min'  },
  { key: 'CONFIRMED',        icon: '✅', label: 'Confirmed',        time: '2 min'  },
  { key: 'PREPARING',        icon: '👨‍🍳', label: 'Preparing',        time: '15 min' },
  { key: 'OUT_FOR_DELIVERY', icon: '🚴', label: 'Out for Delivery', time: '25 min' },
  { key: 'DELIVERED',        icon: '🎉', label: 'Delivered',        time: '35 min' },
];

// ── Skeleton Loader ───────────────────────────────────────────
const Skeleton = ({ height = '20px', width = '100%', radius = '8px' }) => (
  <div
    style={{
      height,
      width,
      borderRadius:    radius,
      background:      'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize:  '200% 100%',
      animation:       'shimmer 1.5s infinite',
    }}
  />
);

const OrderDetail = () => {
  const { id }                  = useParams();
  const navigate                = useNavigate();
  const [order,   setOrder]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderAPI.getById(id);
        setOrder(res.data);
      } catch (err) {
        setError(err.message || 'Order not found');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Auto-refresh every 30 seconds for live status updates
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [id]);

  // ── Loading State ──
  if (loading) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <Skeleton height="32px" width="200px" />
          <div style={{ height: '24px' }} />
          <Skeleton height="200px" />
          <div style={{ height: '16px' }} />
          <Skeleton height="300px" />
          <style>{`
            @keyframes shimmer {
              0%   { background-position:  200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>❌</div>
        <h2 style={{ marginBottom: '8px' }}>Order Not Found</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>{error}</p>
        <Link to="/orders" className="btn btn-primary">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const currentStepIdx = ORDER_STEPS.findIndex(s => s.key === order.status);
  const isDelivered    = order.status === 'DELIVERED';

  const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
  });

  return (
    <div style={{ padding: '40px 0 60px', background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '760px' }}>

        {/* ── Back Button ── */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background:   'none',
            border:       'none',
            cursor:       'pointer',
            color:        'var(--primary)',
            fontWeight:   600,
            fontSize:     '0.95rem',
            marginBottom: '24px',
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      0,
          }}
        >
          ← Back
        </button>

        {/* ── Page Header ── */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'flex-start',
            marginBottom:   '28px',
            flexWrap:       'wrap',
            gap:            '12px',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily:  'Playfair Display, serif',
                fontSize:    '2rem',
                marginBottom:'4px',
              }}
            >
              Order #{order.id}
            </h1>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              {orderDate}
            </p>
          </div>

          {/* Live refresh indicator */}
          {!isDelivered && (
            <div
              style={{
                display:     'flex',
                alignItems:  'center',
                gap:         '8px',
                background:  '#E8F5E9',
                padding:     '8px 16px',
                borderRadius:'50px',
                fontSize:    '0.8rem',
                fontWeight:  600,
                color:       '#2E7D32',
              }}
            >
              <span
                style={{
                  width:        '8px',
                  height:       '8px',
                  background:   '#4caf50',
                  borderRadius: '50%',
                  animation:    'pulse 1.5s infinite',
                  display:      'inline-block',
                }}
              />
              Live Tracking
            </div>
          )}
        </div>

        {/* ── Status Card ── */}
        <div
          style={{
            background:   'white',
            borderRadius: 'var(--radius)',
            padding:      '28px',
            boxShadow:    'var(--shadow)',
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              fontWeight:    700,
              marginBottom:  '20px',
              color:         'var(--secondary)',
              display:       'flex',
              alignItems:    'center',
              gap:           '8px',
            }}
          >
            📍 Order Status
          </h3>

          {/* Stepper */}
          <div style={{ position: 'relative' }}>
            {/* Background line */}
            <div
              style={{
                position:   'absolute',
                left:       '21px',
                top:        '21px',
                bottom:     '21px',
                width:      '3px',
                background: 'var(--border)',
              }}
            />
            {/* Progress line */}
            <div
              style={{
                position:   'absolute',
                left:       '21px',
                top:        '21px',
                width:      '3px',
                height:     `${(currentStepIdx / (ORDER_STEPS.length - 1)) * 100}%`,
                background: 'linear-gradient(to bottom, var(--success), var(--primary))',
                transition: 'height 0.8s ease',
              }}
            />

            {ORDER_STEPS.map((step, idx) => {
              const isDone   = idx < currentStepIdx;
              const isActive = idx === currentStepIdx;

              return (
                <div
                  key={step.key}
                  style={{
                    display:      'flex',
                    alignItems:   'flex-start',
                    gap:          '16px',
                    marginBottom: idx < ORDER_STEPS.length - 1 ? '24px' : '0',
                    position:     'relative',
                  }}
                >
                  {/* Step dot */}
                  <div
                    style={{
                      width:           '44px',
                      height:          '44px',
                      borderRadius:    '50%',
                      flexShrink:      0,
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      fontSize:        '1.2rem',
                      background:      isDone
                        ? 'var(--success)'
                        : isActive
                          ? 'var(--primary)'
                          : 'white',
                      border:          isDone || isActive
                        ? 'none'
                        : '2px solid var(--border)',
                      color:           isDone || isActive ? 'white' : 'var(--text-light)',
                      boxShadow:       isActive
                        ? '0 0 0 6px rgba(255,107,53,0.2)'
                        : isDone
                          ? '0 0 0 4px rgba(39,174,96,0.15)'
                          : 'none',
                      zIndex:          1,
                      transition:      'all 0.4s ease',
                      animation:       isActive ? 'pulse 1.5s infinite' : 'none',
                    }}
                  >
                    {isDone ? '✓' : step.icon}
                  </div>

                  {/* Step info */}
                  <div style={{ paddingTop: '10px' }}>
                    <div
                      style={{
                        fontWeight: isDone || isActive ? 700 : 500,
                        color:      isDone
                          ? 'var(--success)'
                          : isActive
                            ? 'var(--primary)'
                            : 'var(--text-light)',
                        fontSize:   '0.95rem',
                      }}
                    >
                      {step.label}
                    </div>
                    {isActive && (
                      <div
                        style={{
                          fontSize:    '0.82rem',
                          color:       'var(--text-light)',
                          marginTop:   '3px',
                        }}
                      >
                        Est. time: ~{step.time}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Order Items Card ── */}
        <div
          style={{
            background:   'white',
            borderRadius: 'var(--radius)',
            padding:      '28px',
            boxShadow:    'var(--shadow)',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: '20px', color: 'var(--secondary)' }}>
            🛍️ Items Ordered
          </h3>

          {order.orderItems?.map(item => (
            <div
              key={item.id}
              style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                padding:        '14px 0',
                borderBottom:   '1px dashed var(--border)',
                gap:            '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={item.menuItem?.imageUrl}
                  alt={item.menuItem?.name}
                  style={{
                    width:        '56px',
                    height:       '56px',
                    borderRadius: '10px',
                    objectFit:    'cover',
                    flexShrink:   0,
                  }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '3px' }}>
                    {item.menuItem?.name}
                  </div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>
                    ₹{parseFloat(item.unitPrice).toFixed(0)} per item
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  × {item.quantity}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  ₹{parseFloat(item.subtotal).toFixed(0)}
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div
            style={{
              display:        'flex',
              justifyContent: 'space-between',
              marginTop:      '16px',
              padding:        '16px',
              background:     'var(--bg)',
              borderRadius:   'var(--radius-sm)',
              fontWeight:     800,
              fontSize:       '1.1rem',
            }}
          >
            <span>Total Paid</span>
            <span style={{ color: 'var(--primary)' }}>
              ₹{parseFloat(order.totalAmount).toFixed(0)}
            </span>
          </div>
        </div>

        {/* ── Delivery Info Card ── */}
        <div
          style={{
            background:          'white',
            borderRadius:        'var(--radius)',
            padding:             '28px',
            boxShadow:           'var(--shadow)',
            marginBottom:        '20px',
            display:             'grid',
            gridTemplateColumns: '1fr 1fr',
            gap:                 '20px',
          }}
        >
          {[
            { icon: '👤', label: 'Customer',        value: order.customerName    },
            { icon: '📞', label: 'Phone',            value: order.customerPhone   },
            { icon: '✉️', label: 'Email',            value: order.customerEmail   },
            { icon: '💳', label: 'Payment Method',   value: order.paymentMethod?.replace(/_/g, ' ') },
          ].map(info => (
            <div key={info.label}>
              <div
                style={{
                  fontSize:     '0.78rem',
                  color:        'var(--text-light)',
                  marginBottom: '4px',
                  fontWeight:   600,
                  textTransform:'uppercase',
                  letterSpacing:'0.5px',
                }}
              >
                {info.icon} {info.label}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{info.value}</div>
            </div>
          ))}

          {/* Full-width delivery address */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div
              style={{
                fontSize:     '0.78rem',
                color:        'var(--text-light)',
                marginBottom: '4px',
                fontWeight:   600,
                textTransform:'uppercase',
                letterSpacing:'0.5px',
              }}
            >
              📍 Delivery Address
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {order.deliveryAddress}
            </div>
          </div>

          {/* Special Notes (conditional) */}
          {order.specialNotes && (
            <div
              style={{
                gridColumn:   '1 / -1',
                background:   '#FFF8E1',
                borderRadius: 'var(--radius-sm)',
                padding:      '12px 16px',
                borderLeft:   '3px solid var(--warning)',
              }}
            >
              <div
                style={{
                  fontSize:     '0.78rem',
                  color:        '#b8860b',
                  marginBottom: '4px',
                  fontWeight:   600,
                }}
              >
                📝 SPECIAL NOTES
              </div>
              <div style={{ fontSize: '0.9rem' }}>{order.specialNotes}</div>
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/menu" className="btn btn-primary">
            🍽️ Order Again
          </Link>
          <Link to="/orders" className="btn btn-outline">
            ← All Orders
          </Link>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(255,107,53,0.2); }
          50%      { box-shadow: 0 0 0 8px rgba(255,107,53,0.1); }
        }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderDetail;