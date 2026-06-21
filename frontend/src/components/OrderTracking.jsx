import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { orderAPI } from '../services/api';

// All possible order statuses in sequence
const ORDER_STEPS = [
  { key: 'PLACED',           icon: '📋', label: 'Order Placed',    desc: 'We received your order'         },
  { key: 'CONFIRMED',        icon: '✅', label: 'Confirmed',        desc: 'Restaurant confirmed your order' },
  { key: 'PREPARING',        icon: '👨‍🍳', label: 'Preparing',        desc: 'Chef is cooking your food'       },
  { key: 'OUT_FOR_DELIVERY', icon: '🚴', label: 'Out for Delivery', desc: 'Rider is on the way'             },
  { key: 'DELIVERED',        icon: '🎉', label: 'Delivered',        desc: 'Enjoy your meal!'               },
];

// ── Sub-component: Progress Stepper ───────────────────────────
const ProgressStepper = ({ currentStatus }) => {
  const currentIndex = ORDER_STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div style={{ margin: '24px 0' }}>

      {/* Horizontal step line */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
          position:       'relative',
          marginBottom:   '8px',
        }}
      >
        {/* Background track line */}
        <div
          style={{
            position:   'absolute',
            top:        '20px',
            left:       '10%',
            right:      '10%',
            height:     '3px',
            background: 'var(--border)',
            zIndex:     0,
          }}
        />

        {/* Filled progress line */}
        <div
          style={{
            position:   'absolute',
            top:        '20px',
            left:       '10%',
            width:      `${(currentIndex / (ORDER_STEPS.length - 1)) * 80}%`,
            height:     '3px',
            background: 'linear-gradient(to right, var(--success), var(--primary))',
            zIndex:     1,
            transition: 'width 0.8s ease',
          }}
        />

        {ORDER_STEPS.map((step, idx) => {
          const isDone   = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div
              key={step.key}
              style={{
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                gap:           '8px',
                zIndex:        2,
                flex:          1,
              }}
            >
              {/* Step Dot */}
              <div
                style={{
                  width:        '42px',
                  height:       '42px',
                  borderRadius: '50%',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent:'center',
                  fontSize:     '1.2rem',
                  background:   isDone
                    ? 'var(--success)'
                    : isActive
                      ? 'var(--primary)'
                      : 'var(--border)',
                  color:        isDone || isActive ? 'white' : 'var(--text-light)',
                  boxShadow:    isActive
                    ? '0 0 0 6px rgba(255,107,53,0.2)'
                    : isDone
                      ? '0 0 0 4px rgba(39,174,96,0.15)'
                      : 'none',
                  transition:   'all 0.4s ease',
                  animation:    isActive ? 'pulse 1.5s infinite' : 'none',
                }}
              >
                {isDone ? '✓' : step.icon}
              </div>

              {/* Step Label */}
              <span
                style={{
                  fontSize:   '0.75rem',
                  fontWeight: isDone || isActive ? 700 : 500,
                  color:      isDone
                    ? 'var(--success)'
                    : isActive
                      ? 'var(--primary)'
                      : 'var(--text-light)',
                  textAlign:  'center',
                  maxWidth:   '80px',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current step description */}
      <div
        style={{
          textAlign:   'center',
          marginTop:   '16px',
          padding:     '12px',
          background:  'var(--bg)',
          borderRadius:'var(--radius-sm)',
          fontSize:    '0.9rem',
          color:       'var(--text-light)',
        }}
      >
        <strong style={{ color: 'var(--primary)' }}>
          {ORDER_STEPS[currentIndex]?.icon}{' '}
          {ORDER_STEPS[currentIndex]?.label}:
        </strong>{' '}
        {ORDER_STEPS[currentIndex]?.desc}
      </div>
    </div>
  );
};

// ── Sub-component: Single Order Card ─────────────────────────
const TrackingCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });

  const statusColor = {
    PLACED:            '#E65100',
    CONFIRMED:         '#1565C0',
    PREPARING:         '#F57F17',
    OUT_FOR_DELIVERY:  '#6A1B9A',
    DELIVERED:         '#2E7D32',
  }[order.status] || 'var(--text)';

  return (
    <div
      style={{
        background:   'white',
        borderRadius: 'var(--radius)',
        padding:      '24px',
        boxShadow:    'var(--shadow)',
        marginBottom: '20px',
        borderLeft:   `4px solid ${statusColor}`,
        transition:   'var(--transition)',
      }}
    >
      {/* ── Card Header ── */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
          marginBottom:   '4px',
          flexWrap:       'wrap',
          gap:            '12px',
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--secondary)' }}>
            Order #{order.id}
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '2px' }}>
            📅 {orderDate}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              padding:      '6px 16px',
              borderRadius: '50px',
              fontSize:     '0.8rem',
              fontWeight:   700,
              background:   `${statusColor}18`,
              color:        statusColor,
              border:       `1.5px solid ${statusColor}40`,
            }}
          >
            {ORDER_STEPS.find(s => s.key === order.status)?.icon}{' '}
            {order.status.replace(/_/g, ' ')}
          </span>

          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background:   'var(--bg)',
              border:       '2px solid var(--border)',
              borderRadius: '8px',
              padding:      '6px 14px',
              cursor:       'pointer',
              fontSize:     '0.85rem',
              fontWeight:   600,
              color:        'var(--text)',
              transition:   'var(--transition)',
            }}
          >
            {expanded ? '▲ Less' : '▼ Details'}
          </button>
        </div>
      </div>

      {/* ── Progress Stepper ── */}
      <ProgressStepper currentStatus={order.status} />

      {/* ── Expandable Details ── */}
      {expanded && (
        <div
          style={{
            borderTop:  '2px dashed var(--border)',
            paddingTop: '20px',
            marginTop:  '8px',
            animation:  'fadeIn 0.3s ease',
          }}
        >
          {/* Order Items Table */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontWeight:    700,
                marginBottom:  '12px',
                color:         'var(--secondary)',
              }}
            >
              🛍️ Items Ordered
            </div>

            {order.orderItems?.map(item => (
              <div
                key={item.id}
                style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'center',
                  padding:        '10px 0',
                  borderBottom:   '1px dashed var(--border)',
                  fontSize:       '0.9rem',
                  gap:            '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.menuItem?.imageUrl && (
                    <img
                      src={item.menuItem.imageUrl}
                      alt={item.menuItem?.name}
                      style={{
                        width:        '42px',
                        height:       '42px',
                        borderRadius: '8px',
                        objectFit:    'cover',
                      }}
                      onError={e => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.menuItem?.name}</div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                      ₹{parseFloat(item.unitPrice).toFixed(0)} × {item.quantity}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                  ₹{parseFloat(item.subtotal).toFixed(0)}
                </div>
              </div>
            ))}
          </div>

          {/* Order Meta */}
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: '1fr 1fr',
              gap:                 '12px',
              marginBottom:        '16px',
            }}
          >
            {[
              { label: '👤 Customer',  value: order.customerName    },
              { label: '📞 Phone',     value: order.customerPhone   },
              { label: '💳 Payment',   value: order.paymentMethod?.replace(/_/g, ' ') },
              { label: '📍 Address',   value: order.deliveryAddress },
            ].map(meta => (
              <div
                key={meta.label}
                style={{
                  background:   'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  padding:      '10px 14px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '2px' }}>
                  {meta.label}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {meta.value}
                </div>
              </div>
            ))}
          </div>

          {/* Special Notes */}
          {order.specialNotes && (
            <div
              style={{
                background:   '#FFF8E1',
                borderRadius: 'var(--radius-sm)',
                padding:      '12px 16px',
                marginBottom: '16px',
                fontSize:     '0.9rem',
                borderLeft:   '3px solid var(--warning)',
              }}
            >
              <strong>📝 Special Notes:</strong> {order.specialNotes}
            </div>
          )}

          {/* Total */}
          <div
            style={{
              display:        'flex',
              justifyContent: 'space-between',
              padding:        '14px 0 0',
              fontWeight:     800,
              fontSize:       '1.1rem',
              borderTop:      '2px solid var(--border)',
              color:          'var(--primary)',
            }}
          >
            <span>💰 Total Paid</span>
            <span>₹{parseFloat(order.totalAmount).toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* FadeIn style */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
};

// ── Main Component: OrderTracking ─────────────────────────────
const OrderTracking = () => {
  const [email,    setEmail]    = useState('');
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await orderAPI.trackByEmail(email.trim());
      setOrders(res.data || []);
      setSearched(true);

      if ((res.data || []).length === 0) {
        toast('No orders found for this email.', { icon: '📭' });
      } else {
        toast.success(`Found ${res.data.length} order(s)! 🎉`);
      }
    } catch (err) {
      toast.error(err.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ── Search Box ── */}
      <div
        style={{
          background:   'white',
          borderRadius: 'var(--radius)',
          padding:      '32px',
          boxShadow:    'var(--shadow)',
          marginBottom: '40px',
          maxWidth:     '560px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width:        '48px',
              height:       '48px',
              background:   'linear-gradient(135deg, var(--primary), var(--primary-light))',
              borderRadius: '12px',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
              fontSize:     '1.5rem',
            }}
          >
            🔍
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Track Your Order</div>
            <div style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
              Enter the email used while ordering
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              required
              style={{
                flex:         1,
                padding:      '12px 16px',
                border:       '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontFamily:   'Poppins, sans-serif',
                fontSize:     '0.9rem',
                outline:      'none',
                transition:   'var(--transition)',
              }}
              onFocus={e  => { e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={e   => { e.target.style.borderColor = 'var(--border)';  }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {loading ? '⏳' : '🔍 Track'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Results ── */}
      {searched && (
        orders.length === 0 ? (
          <div
            style={{
              textAlign:    'center',
              padding:      '60px 20px',
              background:   'white',
              borderRadius: 'var(--radius)',
              boxShadow:    'var(--shadow)',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
              No orders found
            </p>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              No orders linked to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <div>
            <div
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '10px',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                {orders.length} Order{orders.length !== 1 ? 's' : ''} Found
              </h3>
              <span
                style={{
                  background:   'var(--primary)',
                  color:        'white',
                  borderRadius: '50px',
                  padding:      '2px 12px',
                  fontSize:     '0.8rem',
                  fontWeight:   700,
                }}
              >
                {email}
              </span>
            </div>

            {orders.map(order => (
              <TrackingCard key={order.id} order={order} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default OrderTracking;