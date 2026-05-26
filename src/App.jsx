import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import piSDK from './pi.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ==================== TOAST SYSTEM ====================
const ToastContainer = ({ toasts, removeToast }) => (
  <div style={{
    position: 'fixed', top: '2rem', left: '2rem', zIndex: 2000,
    display: 'flex', flexDirection: 'column', gap: '0.75rem'
  }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', padding: '1rem 1.5rem', display: 'flex',
        alignItems: 'center', gap: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        borderRight: `4px solid ${t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : t.type === 'warning' ? '#f59e0b' : '#6366f1'}`,
        animation: 'slideIn 0.4s ease-out'
      }}>
        <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span>{t.message}</span>
        <button onClick={() => removeToast(t.id)} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:'1.2rem'}}>×</button>
      </div>
    ))}
  </div>
);

// ==================== LAYOUT COMPONENTS ====================
const Sidebar = ({ user, currentPath, navigate, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { page: '/', label: 'الرئيسية', icon: '🏠' },
    { page: '/marketplace', label: 'السوق', icon: '🛒' },
    { page: '/orders', label: 'طلباتي', icon: '📦' },
    { page: '/messages', label: 'الرسائل', icon: '💬' },
  ];

  const freelancerNav = user?.type === 'freelancer' ? [
    { page: '/my-services', label: 'خدماتي', icon: '💼' },
    { page: '/earnings', label: 'الأرباح', icon: '💰' },
  ] : [];

  const adminNav = user?.type === 'admin' ? [
    { page: '/admin', label: 'لوحة التحكم', icon: '🛡️' },
    { page: '/disputes', label: 'النزاعات', icon: '⚖️' },
  ] : [];

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)} style={{
        display: 'none', position: 'fixed', top: '1rem', right: '1rem',
        zIndex: 200, width: '48px', height: '48px', borderRadius: '12px',
        background: '#6366f1', color: 'white', border: 'none', fontSize: '1.5rem',
        cursor: 'pointer'
      }} className="mobile-toggle">☰</button>

      <aside style={{
        width: '280px', background: '#1e293b', borderLeft: '1px solid rgba(255,255,255,0.1)',
        padding: '2rem 1.5rem', position: 'fixed', right: 0, top: 0, height: '100vh',
        overflowY: 'auto', zIndex: 100, transition: 'transform 0.3s',
        transform: mobileOpen ? 'translateX(0)' : undefined
      }}>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={{
          fontSize: '1.8rem', fontWeight: 800, color: 'white', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem'
        }}>
          <span style={{fontSize:'2rem'}}>π</span>
          Work<span style={{color:'#f59e0b'}}>Pi</span>Serv
        </a>

        <div style={{marginBottom:'1.5rem'}}>
          <div style={{fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'1px', color:'#64748b', marginBottom:'0.75rem', paddingRight:'1rem'}}>
            القائمة الرئيسية
          </div>
          {navItems.map(item => (
            <div key={item.page} onClick={() => { navigate(item.page); setMobileOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem',
              borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s',
              color: currentPath === item.page ? 'white' : '#64748b',
              background: currentPath === item.page ? '#6366f1' : 'transparent',
              marginBottom: '0.25rem'
            }}>
              <span>{item.icon}</span>
              <span style={{fontWeight:600}}>{item.label}</span>
            </div>
          ))}
        </div>

        {freelancerNav.length > 0 && (
          <div style={{marginBottom:'1.5rem'}}>
            <div style={{fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'1px', color:'#64748b', marginBottom:'0.75rem', paddingRight:'1rem'}}>
              المستقل
            </div>
            {freelancerNav.map(item => (
              <div key={item.page} onClick={() => { navigate(item.page); setMobileOpen(false); }} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem',
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s',
                color: currentPath === item.page ? 'white' : '#64748b',
                background: currentPath === item.page ? '#6366f1' : 'transparent',
                marginBottom: '0.25rem'
              }}>
                <span>{item.icon}</span>
                <span style={{fontWeight:600}}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {adminNav.length > 0 && (
          <div style={{marginBottom:'1.5rem'}}>
            <div style={{fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'1px', color:'#64748b', marginBottom:'0.75rem', paddingRight:'1rem'}}>
              الإدارة
            </div>
            {adminNav.map(item => (
              <div key={item.page} onClick={() => { navigate(item.page); setMobileOpen(false); }} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem',
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s',
                color: currentPath === item.page ? 'white' : '#64748b',
                background: currentPath === item.page ? '#6366f1' : 'transparent',
                marginBottom: '0.25rem'
              }}>
                <span>{item.icon}</span>
                <span style={{fontWeight:600}}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{marginTop:'auto', paddingTop:'2rem'}}>
          <div onClick={() => navigate('/profile')} style={{
            padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer'
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: 'white'
            }}>{user ? user.avatar : '👤'}</div>
            <div>
              <h4 style={{fontSize:'0.9rem', color:'white'}}>{user ? user.username : 'زائر'}</h4>
              <p style={{fontSize:'0.75rem', color:'#64748b'}}>{user ? (user.type === 'freelancer' ? 'مستقل' : user.type === 'admin' ? 'مدير' : 'عميل') : 'غير مسجل'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ user, onLogin, onLogout, onSearch }) => {
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.get('/api/notifications').then(res => {
        setNotifCount(res.data.filter(n => !n.read).length);
      }).catch(() => {});
    }
  }, [user]);

  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{position:'relative', width:'400px'}}>
        <span style={{position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:'#64748b'}}>🔍</span>
        <input
          type="text"
          placeholder="ابحث عن خدمات، مستقلين..."
          onKeyPress={(e) => e.key === 'Enter' && onSearch(e.target.value)}
          style={{
            width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white',
            fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none'
          }}
        />
      </div>
      <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
        <button onClick={() => {}} style={{
          width: '44px', height: '44px', borderRadius: '12px', background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.25rem',
          position: 'relative'
        }}>
          🔔
          {notifCount > 0 && (
            <span style={{
              position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444',
              color: 'white', fontSize: '0.7rem', padding: '0.15rem 0.4rem',
              borderRadius: '20px', fontWeight: 700
            }}>{notifCount}</span>
          )}
        </button>
        {user ? (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              padding: '0.75rem 1.25rem', borderRadius: '12px', color: 'white',
              fontWeight: 700, animation: 'glow 3s infinite'
            }}>
              <span style={{fontSize:'1.2rem'}}>π</span>
              <span>{user.balance?.toFixed(2) || '0.00'}</span>
            </div>
            <button onClick={onLogout} style={{
              padding: '0.5rem 1rem', borderRadius: '12px', border: 'none',
              fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer',
              background: '#ef4444', color: 'white', fontSize: '0.8rem'
            }}>خروج</button>
          </>
        ) : (
          <button onClick={onLogin} style={{
            padding: '0.5rem 1rem', borderRadius: '12px', border: 'none',
            fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer',
            background: '#6366f1', color: 'white', fontSize: '0.8rem'
          }}>تسجيل الدخول</button>
        )}
      </div>
    </header>
  );
};

// ==================== UI COMPONENTS ====================
const Card = ({ children, style }) => (
  <div style={{
    background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px', padding: '1.5rem', transition: 'all 0.3s',
    ...style
  }}>{children}</div>
);

const Button = ({ children, onClick, variant = 'primary', style, disabled }) => {
  const variants = {
    primary: { background: '#6366f1', color: 'white' },
    secondary: { background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' },
    success: { background: '#10b981', color: 'white' },
    danger: { background: '#ef4444', color: 'white' },
    warning: { background: '#f59e0b', color: '#0f172a' },
    outline: { background: 'transparent', border: '2px solid #6366f1', color: '#6366f1' }
  };

  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '0.875rem 1.5rem', borderRadius: '12px', border: 'none',
      fontFamily: 'inherit', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
      opacity: disabled ? 0.6 : 1,
      ...variants[variant], ...style
    }}>{children}</button>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: { background: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
    active: { background: 'rgba(16,185,129,0.2)', color: '#10b981' },
    delivered: { background: 'rgba(99,102,241,0.2)', color: '#6366f1' },
    completed: { background: 'rgba(99,102,241,0.2)', color: '#6366f1' },
    disputed: { background: 'rgba(239,68,68,0.2)', color: '#ef4444' },
    cancelled: { background: 'rgba(100,116,139,0.2)', color: '#64748b' }
  };
  const labels = {
    pending: '⏳ بانتظار الدفع',
    active: '🛠️ قيد التنفيذ',
    delivered: '📤 تم التسليم',
    completed: '✅ مكتمل',
    disputed: '⚖️ نزاع',
    cancelled: '❌ ملغي'
  };
  return (
    <span style={{
      padding: '0.4rem 0.875rem', borderRadius: '20px', fontSize: '0.8rem',
      fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      ...styles[status]
    }}>{labels[status] || status}</span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px', padding: '2rem', width: '90%', maxWidth: '600px',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
          <h2 style={{fontSize:'1.5rem', fontWeight:800}}>{title}</h2>
          <button onClick={onClose} style={{
            width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.25rem'
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ==================== PAGES ====================

const HomePage = ({ navigate }) => {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ services: 0, freelancers: 0, orders: 0 });

  useEffect(() => {
    api.get('/api/services?limit=4').then(res => setServices(res.data.slice(0, 4)));
    // In production, fetch real stats
    setStats({ services: 500, freelancers: 120, orders: 1200 });
  }, []);

  const categories = [
    { name: 'تصميم', icon: '🎨', count: 120 },
    { name: 'برمجة', icon: '💻', count: 85 },
    { name: 'تسويق', icon: '📢', count: 64 },
    { name: 'كتابة', icon: '✍️', count: 92 },
    { name: 'فيديو', icon: '🎬', count: 45 },
    { name: 'صوتيات', icon: '🎙️', count: 33 },
  ];

  return (
    <div className="animate-fade">
      <div style={{textAlign:'center', padding:'4rem 2rem', maxWidth:'900px', margin:'0 auto'}}>
        <h1 style={{
          fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, white, #6366f1)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2
        }}>أنجز أعمالك بأمان<br/>بعملة <span style={{color:'#6366f1'}}>Pi</span></h1>
        <p style={{fontSize:'1.25rem', color:'#64748b', marginBottom:'2.5rem', lineHeight:1.8}}>
          أول منصة خدمات عربية وعالمية آمنة مدعومة بعملة Pi. نربط المواهب بالفرص عبر نظام الضمان الذكي (Escrow).
        </p>
        <div style={{display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap'}}>
          <Button onClick={() => navigate('/marketplace')} variant="primary" style={{padding:'1rem 2rem', fontSize:'1rem'}}>
            استكشف الخدمات →
          </Button>
          <Button onClick={() => {}} variant="outline" style={{padding:'1rem 2rem', fontSize:'1rem'}}>
            انضم كمستقل
          </Button>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'2rem', marginTop:'4rem'}}>
          <div><h3 style={{fontSize:'2.5rem', fontWeight:800, color:'#6366f1'}}>{stats.services}+</h3><p style={{color:'#64748b'}}>خدمة متاحة</p></div>
          <div><h3 style={{fontSize:'2.5rem', fontWeight:800, color:'#6366f1'}}>{stats.freelancers}+</h3><p style={{color:'#64748b'}}>مستقل نشط</p></div>
          <div><h3 style={{fontSize:'2.5rem', fontWeight:800, color:'#6366f1'}}>{stats.orders}+</h3><p style={{color:'#64748b'}}>صفقة ناجحة</p></div>
        </div>
      </div>

      <h2 style={{textAlign:'center', fontSize:'2.5rem', margin:'3rem 0 2rem', color:'white'}}>الفئات الشائعة</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'1rem', marginBottom:'2rem'}}>
        {categories.map(c => (
          <div key={c.name} onClick={() => navigate('/marketplace')} style={{
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
            padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s'
          }}>
            <div style={{fontSize:'2.5rem', marginBottom:'0.75rem'}}>{c.icon}</div>
            <div style={{fontWeight:700, fontSize:'0.9rem'}}>{c.name}</div>
            <div style={{color:'#64748b', fontSize:'0.8rem'}}>{c.count} خدمة</div>
          </div>
        ))}
      </div>

      <h2 style={{textAlign:'center', fontSize:'2.5rem', marginBottom:'2rem', color:'white'}}>خدمات مميزة</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.5rem'}}>
        {services.map(s => <ServiceCard key={s._id} service={s} onClick={() => navigate(`/service/${s._id}`)} />)}
      </div>
    </div>
  );
};

const ServiceCard = ({ service, onClick }) => (
  <div onClick={onClick} style={{
    background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
    overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s'
  }}>
    <div style={{
      width: '100%', height: '200px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', position: 'relative'
    }}>
      {service.image}
      <span style={{
        position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)', padding: '0.5rem 1rem', borderRadius: '20px',
        fontSize: '0.8rem', fontWeight: 600
      }}>{service.category}</span>
    </div>
    <div style={{padding:'1.5rem'}}>
      <div style={{display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem'}}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #f59e0b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.8rem', color: 'white'
        }}>{service.freelancerId?.avatar || '👤'}</div>
        <div>
          <div style={{fontWeight:600, fontSize:'0.9rem'}}>{service.freelancerId?.username || 'مستقل'}</div>
          <div style={{color:'#f59e0b', fontSize:'0.8rem'}}>{'★'.repeat(Math.floor(service.rating || 0))} {service.rating}</div>
        </div>
      </div>
      <h3 style={{fontSize:'1.1rem', fontWeight:700, marginBottom:'0.5rem', color:'white'}}>{service.title}</h3>
      <p style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'1rem', lineHeight:1.6}}>{service.description?.substring(0, 80)}...</p>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'1rem', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
        <span style={{color:'#64748b', fontSize:'0.8rem'}}>⏱️ {service.deliveryDays} أيام</span>
        <span style={{fontSize:'1.25rem', fontWeight:800, color:'#f59e0b'}}>{service.price} π</span>
      </div>
    </div>
  </div>
);

const MarketplacePage = ({ navigate }) => {
  const [services, setServices] = useState([]);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchServices();
  }, [category, sort, search]);

  const fetchServices = async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (sort) params.append('sort', sort);

      const res = await api.get(`/api/services?${params}`);
      setServices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
        <h2 style={{margin:0, fontSize:'2rem'}}>🛒 سوق الخدمات</h2>
        <div style={{display:'flex', gap:'0.5rem'}}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{
            padding:'0.5rem 1rem', background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'12px', color:'white', fontFamily:'inherit'
          }}>
            <option value="">جميع الفئات</option>
            <option value="تصميم">تصميم</option>
            <option value="برمجة">برمجة</option>
            <option value="تسويق">تسويق</option>
            <option value="كتابة">كتابة</option>
            <option value="فيديو">فيديو</option>
            <option value="صوتيات">صوتيات</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{
            padding:'0.5rem 1rem', background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'12px', color:'white', fontFamily:'inherit'
          }}>
            <option value="newest">الأحدث</option>
            <option value="price-low">السعر: منخفض</option>
            <option value="price-high">السعر: مرتفع</option>
            <option value="rating">الأعلى تقييماً</option>
          </select>
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.5rem'}}>
        {services.length > 0 ? services.map(s => (
          <ServiceCard key={s._id} service={s} onClick={() => navigate(`/service/${s._id}`)} />
        )) : (
          <div style={{gridColumn:'1/-1', textAlign:'center', padding:'4rem 2rem', color:'#64748b'}}>
            <div style={{fontSize:'4rem', marginBottom:'1rem', opacity:0.5}}>🔍</div>
            <h3>لا توجد نتائج</h3>
            <p>جرب بحثاً مختلفاً أو فئة أخرى</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ServiceDetailPage = ({ navigate, user, addToast }) => {
  const { id } = useParamsFromRoute();
  const [service, setService] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [requirements, setRequirements] = useState('');

  useEffect(() => {
    api.get(`/api/services/${id}`).then(res => setService(res.data)).catch(() => {});
  }, [id]);

  const handleOrder = async () => {
    if (!user) { addToast('سجل الدخول أولاً', 'warning'); return; }

    try {
      // For real Pi payments:
      if (window.Pi && import.meta.env.VITE_PI_SANDBOX !== 'true') {
        await piSDK.init();
        const payment = await piSDK.createPayment(
          { amount: service.price, orderId: 'new', serviceId: service._id, memo: service.title },
          {
            onReadyForServerCompletion: async (paymentId, txid) => {
              const res = await api.post('/api/orders', {
                serviceId: service._id,
                requirements,
                piPaymentId: paymentId,
                piTxId: txid
              });
              addToast(`تم إنشاء الطلب #${res.data._id}`, 'success');
              navigate('/orders');
            }
          }
        );
      } else {
        // Demo mode
        const res = await api.post('/api/orders', { serviceId: service._id, requirements });
        addToast(`تم إنشاء الطلب #${res.data._id}`, 'success');
        navigate('/orders');
      }
      setShowOrderModal(false);
    } catch (err) {
      addToast(err.response?.data?.error || 'خطأ في إنشاء الطلب', 'error');
    }
  };

  if (!service) return <div style={{textAlign:'center', padding:'4rem'}}>جاري التحميل...</div>;

  const freelancer = service.freelancerId;

  return (
    <div className="animate-fade">
      <Button onClick={() => navigate('/marketplace')} variant="secondary" style={{marginBottom:'1rem'}}>
        ← رجوع للسوق
      </Button>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem'}}>
        <div>
          <div style={{
            height: '300px', borderRadius: '20px', fontSize: '5rem',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>{service.image}</div>
          <Card style={{marginTop:'1rem'}}>
            <h3 style={{fontSize:'1.2rem', fontWeight:700, marginBottom:'1rem', color:'white'}}>وصف الخدمة</h3>
            <p style={{lineHeight:1.8, color:'#64748b'}}>{service.description}</p>
            <div style={{display:'flex', gap:'1rem', flexWrap:'wrap', marginTop:'1rem'}}>
              <StatusBadge status="completed" />
              <span style={{padding:'0.4rem 0.875rem', borderRadius:'20px', fontSize:'0.8rem', fontWeight:700, background:'rgba(16,185,129,0.2)', color:'#10b981'}}>
                ⏱️ {service.deliveryDays} أيام تسليم
              </span>
              <span style={{padding:'0.4rem 0.875rem', borderRadius:'20px', fontSize:'0.8rem', fontWeight:700, background:'rgba(99,102,241,0.2)', color:'#6366f1'}}>
                🔒 Escrow آمن
              </span>
            </div>
          </Card>
        </div>
        <div>
          <Card style={{position:'sticky', top:'2rem'}}>
            <div style={{display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem'}}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #f59e0b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1.2rem', color: 'white'
              }}>{freelancer?.avatar || '👤'}</div>
              <div>
                <div style={{fontWeight:700, fontSize:'1.1rem'}}>{freelancer?.username || 'مستقل'}</div>
                <div style={{color:'#64748b', fontSize:'0.8rem'}}>مستقل محترف</div>
              </div>
            </div>
            <div style={{fontSize:'2rem', fontWeight:800, color:'#f59e0b', marginBottom:'0.5rem'}}>{service.price} π</div>
            <p style={{color:'#64748b', marginBottom:'1.5rem'}}>السعر الإجمالي شامل العمولة</p>

            {user ? (
              <>
                <Button onClick={() => setShowOrderModal(true)} variant="primary" style={{width:'100%', marginBottom:'0.5rem', padding:'1rem', fontSize:'1rem'}}>
                  اطلب الآن 🔒
                </Button>
                <Button onClick={() => {}} variant="secondary" style={{width:'100%'}}>
                  💬 تواصل مع المستقل
                </Button>
              </>
            ) : (
              <Button onClick={() => {}} variant="primary" style={{width:'100%', padding:'1rem', fontSize:'1rem'}}>
                سجل الدخول للطلب
              </Button>
            )}

            <div style={{marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                <span style={{color:'#64748b'}}>تسليم</span>
                <strong>{service.deliveryDays} أيام</strong>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                <span style={{color:'#64748b'}}>مرات البيع</span>
                <strong>{service.orders}</strong>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{color:'#64748b'}}>نظام الدفع</span>
                <strong style={{color:'#6366f1'}}>Pi + Escrow</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} title="📦 تأكيد الطلب">
        <div style={{marginBottom:'1rem'}}>
          <h3>{service.title}</h3>
          <p style={{color:'#64748b'}}>{freelancer?.username}</p>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
          <span>سعر الخدمة</span><strong>{service.price} π</strong>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
          <span>عمولة المنصة (10%)</span><strong>{(service.price * 0.1).toFixed(2)} π</strong>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', paddingTop:'0.5rem', borderTop:'1px solid rgba(255,255,255,0.1)', marginBottom:'1rem'}}>
          <span style={{color:'#f59e0b'}}>الإجمالي المحتجز</span>
          <strong style={{color:'#f59e0b'}}>{service.price} π</strong>
        </div>
        <textarea
          placeholder="اشرح متطلباتك للمستقل..."
          value={requirements}
          onChange={e => setRequirements(e.target.value)}
          style={{
            width:'100%', padding:'1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'12px', color:'white', fontFamily:'inherit', minHeight:'100px', marginBottom:'1rem'
          }}
        />
        <p style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'1rem'}}>
          🔒 سيتم احتجاز المبلغ في الـ Escrow. لن يتم تحويله للمستقل إلا بعد تأكيد استلامك.
        </p>
        <Button onClick={handleOrder} variant="primary" style={{width:'100%', padding:'1rem', fontSize:'1rem'}}>
          تأكيد ودفع {service.price} π
        </Button>
      </Modal>
    </div>
  );
};

const OrdersPage = ({ navigate, user, addToast }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/orders');
      setOrders(res.data);
    } catch (err) {
      addToast('خطأ في تحميل الطلبات', 'error');
    }
  };

  const handleComplete = async (orderId) => {
    try {
      await api.post(`/api/orders/${orderId}/complete`);
      addToast('تم تأكيد الاستلام!', 'success');
      fetchOrders();
    } catch (err) {
      addToast(err.response?.data?.error || 'خطأ', 'error');
    }
  };

  const handleDeliver = async (orderId) => {
    try {
      await api.post(`/api/orders/${orderId}/deliver`, { message: 'تم تسليم العمل' });
      addToast('تم إرسال التسليم!', 'success');
      fetchOrders();
    } catch (err) {
      addToast(err.response?.data?.error || 'خطأ', 'error');
    }
  };

  if (!user) {
    return (
      <div style={{textAlign:'center', padding:'4rem 2rem', color:'#64748b'}}>
        <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🔒</div>
        <h3>يجب تسجيل الدخول</h3>
        <p>سجل الدخول لعرض طلباتك</p>
        <Button onClick={() => {}} variant="primary" style={{marginTop:'1rem'}}>تسجيل الدخول</Button>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'2rem', marginBottom:'1.5rem'}}>📦 طلباتي</h2>
      <Card>
        {orders.length > 0 ? (
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>الخدمة</th>
                <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>الطرف الآخر</th>
                <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>القيمة</th>
                <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>الحالة</th>
                <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const isClient = o.clientId._id === user._id || o.clientId === user._id;
                const other = isClient ? o.freelancerId : o.clientId;
                return (
                  <tr key={o._id}>
                    <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                      <strong>{o.serviceId?.title?.substring(0, 30) || 'خدمة'}...</strong>
                    </td>
                    <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>{other?.username || 'مستخدم'}</td>
                    <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)', color:'#f59e0b'}}>{o.price} π</td>
                    <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}><StatusBadge status={o.status} /></td>
                    <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                      {o.status === 'active' && isClient && (
                        <Button onClick={() => handleComplete(o._id)} variant="success" style={{fontSize:'0.75rem', padding:'0.5rem'}}>✅ تأكيد</Button>
                      )}
                      {o.status === 'active' && !isClient && (
                        <Button onClick={() => handleDeliver(o._id)} variant="primary" style={{fontSize:'0.75rem', padding:'0.5rem'}}>📤 تسليم</Button>
                      )}
                      <Button onClick={() => navigate(`/order/${o._id}`)} variant="secondary" style={{fontSize:'0.75rem', padding:'0.5rem', marginRight:'0.5rem'}}>التفاصيل</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{textAlign:'center', padding:'4rem 2rem', color:'#64748b'}}>
            <div style={{fontSize:'4rem', marginBottom:'1rem', opacity:0.5}}>📭</div>
            <h3>لا توجد طلبات</h3>
            <p>ابدأ باستكشاف الخدمات وطلب الأولى</p>
            <Button onClick={() => navigate('/marketplace')} variant="primary" style={{marginTop:'1rem'}}>استكشف الخدمات</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

const OrderDetailPage = ({ user, addToast }) => {
  const { id } = useParamsFromRoute();
  const [order, setOrder] = useState(null);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');

  useEffect(() => {
    api.get(`/api/orders/${id}`).then(res => setOrder(res.data)).catch(() => {});
  }, [id]);

  const handleDispute = async () => {
    try {
      await api.post('/api/disputes', { orderId: id, reason: disputeReason, details: disputeDetails });
      addToast('تم فتح النزاع', 'warning');
      setShowDispute(false);
      const res = await api.get(`/api/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'خطأ', 'error');
    }
  };

  if (!order) return <div style={{textAlign:'center', padding:'4rem'}}>جاري التحميل...</div>;

  const isClient = order.clientId._id === user?._id || order.clientId === user?._id;
  const steps = ['pending', 'active', 'completed'];
  const currentStep = steps.indexOf(order.status === 'disputed' ? 'active' : order.status);

  return (
    <div className="animate-fade">
      <Button onClick={() => window.history.back()} variant="secondary" style={{marginBottom:'1rem'}}>
        ← رجوع
      </Button>
      <Card>
        <h2 style={{fontSize:'1.5rem', fontWeight:700, marginBottom:'1.5rem'}}>📦 تفاصيل الطلب #{order._id?.toString().slice(-4)}</h2>

        <div style={{display:'flex', justifyContent:'space-between', margin:'2rem 0', position:'relative'}}>
          <div style={{position:'absolute', top:'20px', left:'10%', right:'10%', height:'4px', background:'rgba(255,255,255,0.1)', zIndex:0}} />
          {['الدفع', 'التنفيذ', 'الاستلام'].map((label, i) => (
            <div key={label} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', zIndex:1, position:'relative'}}>
              <div style={{
                width:'44px', height:'44px', borderRadius:'50%',
                background: i <= currentStep ? (i < currentStep ? '#10b981' : '#6366f1') : '#1e293b',
                border: `3px solid ${i <= currentStep ? (i < currentStep ? '#10b981' : '#6366f1') : 'rgba(255,255,255,0.1)'}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem',
                boxShadow: i === currentStep ? '0 0 20px rgba(99,102,241,0.4)' : 'none'
              }}>{i === 0 ? '💳' : i === 1 ? '🛠️' : '✅'}</div>
              <span style={{fontSize:'0.8rem', fontWeight:600, color: i <= currentStep ? (i < currentStep ? '#10b981' : '#6366f1') : '#64748b'}}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
          <div><p style={{color:'#64748b', marginBottom:'0.5rem'}}>الخدمة</p><p style={{fontWeight:700}}>{order.serviceId?.title || 'خدمة'}</p></div>
          <div><p style={{color:'#64748b', marginBottom:'0.5rem'}}>القيمة المحتجزة</p><p style={{fontWeight:700, color:'#f59e0b'}}>{order.escrowAmount} π</p></div>
          <div><p style={{color:'#64748b', marginBottom:'0.5rem'}}>العميل</p><p>{order.clientId?.username || 'عميل'}</p></div>
          <div><p style={{color:'#64748b', marginBottom:'0.5rem'}}>المستقل</p><p>{order.freelancerId?.username || 'مستقل'}</p></div>
        </div>

        <div style={{marginBottom:'1rem'}}>
          <p style={{color:'#64748b', marginBottom:'0.5rem'}}>الحالة الحالية</p>
          <StatusBadge status={order.status} />
        </div>

        {order.status === 'active' && isClient && (
          <div style={{maxWidth:'400px'}}>
            <Button onClick={async () => {
              await api.post(`/api/orders/${id}/complete`);
              addToast('تم تأكيد الاستلام!', 'success');
              const res = await api.get(`/api/orders/${id}`);
              setOrder(res.data);
            }} variant="success" style={{width:'100%', marginBottom:'0.5rem'}}>
              ✅ تأكيد استلام العمل
            </Button>
            <Button onClick={() => setShowDispute(true)} variant="danger" style={{width:'100%'}}>
              ⚖️ فتح نزاع
            </Button>
          </div>
        )}

        {order.status === 'active' && !isClient && (
          <Button onClick={async () => {
            await api.post(`/api/orders/${id}/deliver`, { message: 'تم التسليم' });
            addToast('تم التسليم!', 'success');
            const res = await api.get(`/api/orders/${id}`);
            setOrder(res.data);
          }} variant="primary" style={{width:'100%', maxWidth:'400px'}}>
            📤 تسليم العمل للعميل
          </Button>
        )}
      </Card>

      <Modal isOpen={showDispute} onClose={() => setShowDispute(false)} title="⚖️ فتح نزاع">
        <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} style={{
          width:'100%', padding:'0.875rem 1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:'12px', color:'white', fontFamily:'inherit', marginBottom:'1rem'
        }}>
          <option value="">اختر السبب</option>
          <option value="not_delivered">لم يتم تسليم العمل</option>
          <option value="poor_quality">جودة غير مقبولة</option>
          <option value="late">تأخير كبير</option>
          <option value="other">سبب آخر</option>
        </select>
        <textarea
          placeholder="اشرح المشكلة بالتفصيل..."
          value={disputeDetails}
          onChange={e => setDisputeDetails(e.target.value)}
          style={{
            width:'100%', padding:'1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'12px', color:'white', fontFamily:'inherit', minHeight:'120px', marginBottom:'1rem'
          }}
        />
        <Button onClick={handleDispute} variant="danger" style={{width:'100%'}}>
          إرسال النزاع
        </Button>
      </Modal>
    </div>
  );
};

const MessagesPage = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/messages/conversations');
      setConversations(res.data);
    } catch (err) {}
  };

  const openChat = async (partnerId) => {
    setSelectedChat(partnerId);
    try {
      const res = await api.get(`/api/messages/${partnerId}`);
      setMessages(res.data);
    } catch (err) {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    try {
      await api.post('/api/messages', { receiverId: selectedChat, text: newMessage });
      setNewMessage('');
      const res = await api.get(`/api/messages/${selectedChat}`);
      setMessages(res.data);
    } catch (err) {}
  };

  if (!user) {
    return (
      <div style={{textAlign:'center', padding:'4rem', color:'#64748b'}}>
        <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🔒</div>
        <h3>يجب تسجيل الدخول</h3>
      </div>
    );
  }

  const partner = conversations.find(c => c.partnerId === selectedChat)?.partner;

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'2rem', marginBottom:'1.5rem'}}>💬 الرسائل</h2>
      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'1.5rem'}}>
        <Card style={{maxHeight:'600px', overflowY:'auto'}}>
          <h3 style={{marginBottom:'1rem', fontSize:'1.1rem'}}>المحادثات</h3>
          {conversations.length > 0 ? conversations.map(c => (
            <div key={c.partnerId} onClick={() => openChat(c.partnerId)} style={{
              display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.875rem',
              borderRadius:'12px', cursor:'pointer', marginBottom:'0.5rem',
              background: selectedChat === c.partnerId ? '#6366f1' : 'transparent'
            }}>
              <div style={{
                width:'36px', height:'36px', borderRadius:'50%',
                background:'linear-gradient(135deg, #6366f1, #f59e0b)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:700, fontSize:'0.8rem', color:'white'
              }}>{c.partner?.avatar || '👤'}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600, fontSize:'0.9rem'}}>{c.partner?.username || 'مستخدم'}</div>
                <div style={{color:'#64748b', fontSize:'0.75rem'}}>{c.lastMessage?.text?.substring(0, 25)}...</div>
              </div>
              {c.unread > 0 && (
                <span style={{background:'#ef4444', color:'white', fontSize:'0.7rem', padding:'0.15rem 0.4rem', borderRadius:'20px'}}>{c.unread}</span>
              )}
            </div>
          )) : (
            <p style={{color:'#64748b', textAlign:'center', padding:'2rem'}}>لا توجد محادثات</p>
          )}
        </Card>

        <div style={{
          display:'flex', flexDirection:'column', height:'500px', background:'#0f172a',
          borderRadius:'20px', border:'1px solid rgba(255,255,255,0.1)', overflow:'hidden'
        }}>
          <div style={{padding:'1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', gap:'1rem'}}>
            <div style={{
              width:'40px', height:'40px', borderRadius:'50%',
              background:'linear-gradient(135deg, #6366f1, #f59e0b)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, color:'white'
            }}>{partner?.avatar || '💬'}</div>
            <div>
              <h4>{partner?.username || 'اختر محادثة'}</h4>
              <p style={{color:'#64748b', fontSize:'0.8rem'}}>{partner ? 'متصل' : 'اختر محادثة من القائمة'}</p>
            </div>
          </div>
          <div style={{flex:1, overflowY:'auto', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
            {messages.length > 0 ? messages.map(m => (
              <div key={m._id} style={{
                maxWidth:'70%', padding:'1rem', borderRadius:'16px', fontSize:'0.9rem',
                alignSelf: m.senderId === user._id || m.senderId === user._id ? 'flex-start' : 'flex-end',
                background: m.senderId === user._id || m.senderId === user._id ? '#6366f1' : '#1e293b',
                color: m.senderId === user._id || m.senderId === user._id ? 'white' : 'var(--light)',
                borderBottomRightRadius: m.senderId === user._id || m.senderId === user._id ? '4px' : '16px',
                borderBottomLeftRadius: m.senderId === user._id || m.senderId === user._id ? '16px' : '4px'
              }}>
                {m.text}
                <div style={{fontSize:'0.7rem', opacity:0.7, marginTop:'0.5rem'}}>
                  {new Date(m.createdAt).toLocaleTimeString('ar', {hour:'2-digit', minute:'2-digit'})}
                </div>
              </div>
            )) : (
              <div style={{textAlign:'center', padding:'4rem', color:'#64748b'}}>
                <div style={{fontSize:'4rem', marginBottom:'1rem', opacity:0.5}}>💬</div>
                <p>اختر محادثة لبدء التواصل</p>
              </div>
            )}
          </div>
          <div style={{display:'flex', gap:'0.75rem', padding:'1rem 1.5rem', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
            <input
              type="text"
              placeholder="اكتب رسالتك..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              disabled={!selectedChat}
              style={{
                flex:1, padding:'0.875rem 1rem', background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'12px', color:'white', fontFamily:'inherit', outline:'none'
              }}
            />
            <Button onClick={sendMessage} disabled={!selectedChat}>إرسال</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyServicesPage = ({ user, addToast, navigate }) => {
  const [services, setServices] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title:'', category:'تصميم', description:'', price:'', deliveryDays:3 });

  useEffect(() => {
    if (user?.type === 'freelancer') fetchServices();
  }, [user]);

  const fetchServices = async () => {
    try {
      const res = await api.get('/api/services/my/list');
      setServices(res.data);
    } catch (err) {}
  };

  const handleCreate = async () => {
    try {
      await api.post('/api/services', form);
      addToast('تم نشر الخدمة!', 'success');
      setShowCreate(false);
      fetchServices();
    } catch (err) {
      addToast(err.response?.data?.error || 'خطأ', 'error');
    }
  };

  if (!user || user.type !== 'freelancer') {
    return (
      <div style={{textAlign:'center', padding:'4rem', color:'#64748b'}}>
        <div style={{fontSize:'4rem', marginBottom:'1rem'}}>💼</div>
        <h3>غير مصرح</h3>
        <p>هذه الصفحة للمستقلين فقط</p>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
        <h2 style={{margin:0, fontSize:'2rem'}}>💼 خدماتي</h2>
        <Button onClick={() => setShowCreate(true)} variant="primary">+ خدمة جديدة</Button>
      </div>
      {services.length > 0 ? (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.5rem'}}>
          {services.map(s => <ServiceCard key={s._id} service={s} onClick={() => {}} />)}
        </div>
      ) : (
        <div style={{textAlign:'center', padding:'4rem', color:'#64748b'}}>
          <div style={{fontSize:'4rem', marginBottom:'1rem', opacity:0.5}}>💼</div>
          <h3>لا توجد خدمات</h3>
          <p>أضف خدمتك الأولى وابدأ بالربح</p>
          <Button onClick={() => setShowCreate(true)} variant="primary" style={{marginTop:'1rem'}}>إضافة خدمة</Button>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="💼 خدمة جديدة">
        <input placeholder="عنوان الخدمة" value={form.title} onChange={e => setForm({...form, title:e.target.value})}
          style={{width:'100%', padding:'0.875rem 1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'white', fontFamily:'inherit', marginBottom:'1rem'}} />
        <select value={form.category} onChange={e => setForm({...form, category:e.target.value})}
          style={{width:'100%', padding:'0.875rem 1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'white', fontFamily:'inherit', marginBottom:'1rem'}}>
          <option value="تصميم">تصميم</option>
          <option value="برمجة">برمجة</option>
          <option value="تسويق">تسويق</option>
          <option value="كتابة">كتابة</option>
          <option value="فيديو">فيديو</option>
          <option value="صوتيات">صوتيات</option>
        </select>
        <textarea placeholder="الوصف" value={form.description} onChange={e => setForm({...form, description:e.target.value})}
          style={{width:'100%', padding:'1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'white', fontFamily:'inherit', minHeight:'100px', marginBottom:'1rem', resize:'vertical'}} />
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
          <input type="number" placeholder="السعر (π)" value={form.price} onChange={e => setForm({...form, price:e.target.value})}
            style={{width:'100%', padding:'0.875rem 1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'white', fontFamily:'inherit'}} />
          <input type="number" placeholder="مدة التسليم (أيام)" value={form.deliveryDays} onChange={e => setForm({...form, deliveryDays:e.target.value})}
            style={{width:'100%', padding:'0.875rem 1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'white', fontFamily:'inherit'}} />
        </div>
        <Button onClick={handleCreate} variant="primary" style={{width:'100%'}}>نشر الخدمة</Button>
      </Modal>
    </div>
  );
};

const EarningsPage = ({ user }) => {
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    if (user?.type === 'freelancer') {
      api.get('/api/earnings').then(res => setEarnings(res.data)).catch(() => {});
    }
  }, [user]);

  if (!user || user.type !== 'freelancer') {
    return (
      <div style={{textAlign:'center', padding:'4rem', color:'#64748b'}}>
        <div style={{fontSize:'4rem', marginBottom:'1rem'}}>💰</div>
        <h3>غير مصرح</h3>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'2rem', marginBottom:'1.5rem'}}>💰 الأرباح</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1.5rem', marginBottom:'2rem'}}>
        <Card>
          <div style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'0.5rem'}}>رصيد متاح</div>
          <div style={{fontSize:'2rem', fontWeight:800, color:'#10b981'}}>{earnings?.available || '0.00'} π</div>
          <div style={{fontSize:'0.875rem', color:'#10b981', marginTop:'0.5rem'}}>↑ جاهز للسحب</div>
        </Card>
        <Card>
          <div style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'0.5rem'}}>قيد الانتظار</div>
          <div style={{fontSize:'2rem', fontWeight:800, color:'#f59e0b'}}>{earnings?.pending || '0.00'} π</div>
          <div style={{fontSize:'0.875rem', color:'#64748b', marginTop:'0.5rem'}}>في الـ Escrow</div>
        </Card>
        <Card>
          <div style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'0.5rem'}}>إجمالي الأرباح</div>
          <div style={{fontSize:'2rem', fontWeight:800, color:'white'}}>{earnings?.total || '0.00'} π</div>
          <div style={{fontSize:'0.875rem', color:'#10b981', marginTop:'0.5rem'}}>↑ منذ البداية</div>
        </Card>
        <Card>
          <div style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'0.5rem'}}>العمولات المدفوعة</div>
          <div style={{fontSize:'2rem', fontWeight:800, color:'#64748b'}}>{earnings?.fees || '0.00'} π</div>
        </Card>
      </div>
      <Card>
        <h3 style={{marginBottom:'1rem', fontSize:'1.1rem'}}>سجل المعاملات</h3>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>التاريخ</th>
              <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>المبلغ</th>
              <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {earnings?.transactions?.map((t, i) => (
              <tr key={i}>
                <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>{new Date(t.date).toLocaleDateString('ar')}</td>
                <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)', color:'#10b981'}}>+{t.amount} π</td>
                <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}><StatusBadge status={t.status} /></td>
              </tr>
            )) || (
              <tr><td colSpan={3} style={{textAlign:'center', padding:'2rem', color:'#64748b'}}>لا توجد معاملات</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const ProfilePage = ({ user }) => {
  if (!user) {
    return (
      <div style={{textAlign:'center', padding:'4rem', color:'#64748b'}}>
        <div style={{fontSize:'4rem', marginBottom:'1rem'}}>👤</div>
        <h3>غير مسجل</h3>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'2rem', marginBottom:'1.5rem'}}>👤 الملف الشخصي</h2>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem'}}>
        <Card style={{textAlign:'center'}}>
          <div style={{
            width:'100px', height:'100px', borderRadius:'50%', margin:'0 auto 1rem',
            background:'linear-gradient(135deg, #6366f1, #f59e0b)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'2.5rem', fontWeight:700, color:'white'
          }}>{user.avatar}</div>
          <h3>{user.username}</h3>
          <p style={{color:'#64748b'}}>{user.type === 'freelancer' ? 'مستقل محترف' : user.type === 'admin' ? 'مدير' : 'عميل'}</p>
          <div style={{display:'flex', gap:'0.25rem', color:'#f59e0b', fontSize:'1.25rem', justifyContent:'center', marginTop:'0.5rem'}}>
            {'★'.repeat(Math.floor(user.rating || 0))}{'☆'.repeat(5 - Math.floor(user.rating || 0))}
          </div>
          <p style={{color:'#64748b', marginTop:'0.5rem'}}>{user.reviews || 0} تقييم</p>
        </Card>
        <div>
          <Card style={{marginBottom:'1rem'}}>
            <h3 style={{marginBottom:'1rem', fontSize:'1.1rem'}}>المعلومات</h3>
            <div style={{marginBottom:'1rem'}}>
              <label style={{display:'block', marginBottom:'0.5rem', fontWeight:600, fontSize:'0.9rem'}}>الاسم</label>
              <input type="text" value={user.username} readOnly style={{
                width:'100%', padding:'0.875rem 1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'12px', color:'white', fontFamily:'inherit'
              }} />
            </div>
            <div style={{marginBottom:'1rem'}}>
              <label style={{display:'block', marginBottom:'0.5rem', fontWeight:600, fontSize:'0.9rem'}}>البريد</label>
              <input type="email" value={user.email || ''} readOnly style={{
                width:'100%', padding:'0.875rem 1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'12px', color:'white', fontFamily:'inherit'
              }} />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'0.5rem', fontWeight:600, fontSize:'0.9rem'}}>نوع الحساب</label>
              <input type="text" value={user.type} readOnly style={{
                width:'100%', padding:'0.875rem 1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'12px', color:'white', fontFamily:'inherit'
              }} />
            </div>
          </Card>
          <Card>
            <h3 style={{marginBottom:'1rem', fontSize:'1.1rem'}}>إحصائيات</h3>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
              <span style={{color:'#64748b'}}>الخدمات المباعة</span><strong>{user.sales || 0}</strong>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
              <span style={{color:'#64748b'}}>الطلبات المنفذة</span><strong>{user.completed || 0}</strong>
            </div>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <span style={{color:'#64748b'}}>معدل الإكمال</span>
              <strong style={{color:'#10b981'}}>{user.sales > 0 ? Math.round((user.completed / user.sales) * 100) : 0}%</strong>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AdminPage = ({ user, addToast }) => {
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user?.type === 'admin') {
      fetchStats();
      fetchAdminOrders();
      fetchAdminUsers();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {}
  };

  const fetchAdminOrders = async () => {
    try {
      const res = await api.get('/api/admin/orders');
      setOrders(res.data);
    } catch (err) {}
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {}
  };

  if (!user || user.type !== 'admin') {
    return (
      <div style={{textAlign:'center', padding:'4rem', color:'#64748b'}}>
        <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🛡️</div>
        <h3>غير مصرح</h3>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'2rem', marginBottom:'1.5rem'}}>🛡️ لوحة الإدارة</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1.5rem', marginBottom:'2rem'}}>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>المستخدمين</div><div style={{fontSize:'2rem', fontWeight:800, color:'white'}}>{stats.users || 0}</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>الخدمات</div><div style={{fontSize:'2rem', fontWeight:800, color:'white'}}>{stats.services || 0}</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>الطلبات النشطة</div><div style={{fontSize:'2rem', fontWeight:800, color:'#6366f1'}}>{stats.orders || 0}</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>النزاعات</div><div style={{fontSize:'2rem', fontWeight:800, color:'#ef4444'}}>{stats.disputes || 0}</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>العمولات</div><div style={{fontSize:'2rem', fontWeight:800, color:'#10b981'}}>{stats.fees || 0} π</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>حجم التداول</div><div style={{fontSize:'2rem', fontWeight:800, color:'#f59e0b'}}>{stats.volume || 0} π</div></Card>
      </div>

      <Card style={{marginBottom:'1.5rem'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
          <h3 style={{fontSize:'1.1rem'}}>أحدث الطلبات</h3>
          <Button onClick={() => { fetchStats(); fetchAdminOrders(); addToast('تم التحديث', 'success'); }} variant="secondary" style={{fontSize:'0.75rem'}}>🔄 تحديث</Button>
        </div>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>#</th>
              <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>الخدمة</th>
              <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>القيمة</th>
              <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id}>
                <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>#{o._id?.toString().slice(-4)}</td>
                <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>{o.serviceId?.title?.substring(0, 25)}...</td>
                <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>{o.price} π</td>
                <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h3 style={{marginBottom:'1rem', fontSize:'1.1rem'}}>المستخدمون</h3>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>المعرف</th>
              <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>الاسم</th>
              <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>النوع</th>
              <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>{u._id?.toString().slice(-6)}</td>
                <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>{u.username}</td>
                <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>{u.type}</td>
                <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>{u.balance} π</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const DisputesPage = ({ user, addToast }) => {
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    if (user?.type === 'admin') fetchDisputes();
  }, [user]);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/api/disputes');
      setDisputes(res.data);
    } catch (err) {}
  };

  const resolve = async (id, resolution) => {
    try {
      await api.post(`/api/disputes/${id}/resolve`, { resolution });
      addToast(`تم حل النزاع لصالح ${resolution === 'freelancer' ? 'المستقل' : 'العميل'}`, 'success');
      fetchDisputes();
    } catch (err) {
      addToast('خطأ', 'error');
    }
  };

  if (!user || user.type !== 'admin') {
    return (
      <div style={{textAlign:'center', padding:'4rem', color:'#64748b'}}>
        <div style={{fontSize:'4rem', marginBottom:'1rem'}}>⚖️</div>
        <h3>غير مصرح</h3>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'2rem', marginBottom:'1.5rem'}}>⚖️ إدارة النزاعات</h2>
      <Card>
        {disputes.length > 0 ? (
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>الطلب</th>
                <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>السبب</th>
                <th style={{textAlign:'right', padding:'1rem', color:'#64748b', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map(d => (
                <tr key={d._id}>
                  <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>#{d.orderId?._id?.toString().slice(-4) || d.orderId}</td>
                  <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>{d.reason}</td>
                  <td style={{padding:'1rem', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                    <Button onClick={() => resolve(d._id, 'client')} variant="success" style={{fontSize:'0.75rem', padding:'0.5rem', marginLeft:'0.5rem'}}>صالح العميل</Button>
                    <Button onClick={() => resolve(d._id, 'freelancer')} variant="primary" style={{fontSize:'0.75rem', padding:'0.5rem'}}>صالح المستقل</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{textAlign:'center', padding:'4rem', color:'#64748b'}}>
            <div style={{fontSize:'4rem', marginBottom:'1rem', opacity:0.5}}>⚖️</div>
            <h3>لا توجد نزاعات</h3>
            <p>جميع المعاملات تسير بسلاسة</p>
          </div>
        )}
      </Card>
    </div>
  );
};

// ==================== LOGIN MODAL ====================
const LoginModal = ({ isOpen, onClose, onLogin, onPiLogin }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('client');

  if (!isOpen) return null;

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px', padding: '2rem', width: '90%', maxWidth: '450px', textAlign: 'center'
      }}>
        <h2 style={{fontSize:'1.5rem', fontWeight:800, marginBottom:'1rem'}}>تسجيل الدخول</h2>
        <p style={{color:'#64748b', marginBottom:'1.5rem'}}>اختر طريقة الدخول إلى المنصة</p>

        <button onClick={onPiLogin} style={{
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white',
          padding: '1rem 2rem', borderRadius: '16px', border: 'none', fontFamily: 'inherit',
          fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: '0.75rem', margin: '0 auto 1.5rem', width: '100%',
          justifyContent: 'center', boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
        }}>
          <span style={{fontSize:'1.5rem', fontWeight:800}}>π</span>
          <span>الدخول عبر Pi Network</span>
        </button>

        <div style={{margin:'1.5rem 0', position:'relative'}}>
          <hr style={{borderColor:'rgba(255,255,255,0.1)'}} />
          <span style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', background:'#1e293b', padding:'0 1rem', color:'#64748b', fontSize:'0.875rem'}}>أو</span>
        </div>

        <div style={{textAlign:'right', marginBottom:'1rem'}}>
          <label style={{display:'block', marginBottom:'0.5rem', fontWeight:600, fontSize:'0.9rem'}}>الاسم</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسمك"
            style={{width:'100%', padding:'0.875rem 1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'white', fontFamily:'inherit'}} />
        </div>
        <div style={{textAlign:'right', marginBottom:'1.5rem'}}>
          <label style={{display:'block', marginBottom:'0.5rem', fontWeight:600, fontSize:'0.9rem'}}>نوع الحساب</label>
          <select value={type} onChange={e => setType(e.target.value)}
            style={{width:'100%', padding:'0.875rem 1rem', background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'white', fontFamily:'inherit'}}>
            <option value="client">عميل (أطلب خدمات)</option>
            <option value="freelancer">مستقل (أعرض خدمات)</option>
            <option value="admin">مدير (للاختبار)</option>
          </select>
        </div>
        <Button onClick={() => onLogin(name, type)} variant="primary" style={{width:'100%'}}>
          دخول تجريبي
        </Button>
        <p style={{color:'#64748b', fontSize:'0.8rem', marginTop:'1rem'}}>
          في النسخة الحقيقية، سيتم استبدال هذا بـ Pi Authentication SDK
        </p>
      </div>
    </div>
  );
};

// ==================== ROUTER HELPER ====================
function useParamsFromRoute() {
  const location = useLocation();
  const path = location.pathname;
  const parts = path.split('/');
  return { id: parts[parts.length - 1] };
}

// ==================== MAIN APP ====================
function App() {
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token
      api.get('/api/auth/me').then(res => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }).catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
    }
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogin = async (name, type) => {
    try {
      const res = await api.post('/api/auth/demo', { name, type });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setShowLogin(false);
      addToast(`أهلاً ${res.data.user.username}!`, 'success');
    } catch (err) {
      addToast('خطأ في تسجيل الدخول', 'error');
    }
  };

  const handlePiLogin = async () => {
    try {
      const result = await piSDK.authenticate();
      if (result) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        setShowLogin(false);
        addToast('تم الدخول عبر Pi بنجاح!', 'success');
      }
    } catch (err) {
      addToast('خطأ في Pi Login', 'error');
    }
  };

  const handleLogout = () => {
    piSDK.logout();
    setUser(null);
    addToast('تم تسجيل الخروج', 'info');
    navigate('/');
  };

  const handleSearch = (query) => {
    navigate('/marketplace');
    // In a real app, pass query to marketplace via state or context
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Sidebar user={user} currentPath={location.pathname} navigate={navigate} onLogout={handleLogout} />
      <main style={{ flex: 1, marginRight: '280px', padding: '2rem', minHeight: '100vh' }}>
        <Header user={user} onLogin={() => setShowLogin(true)} onLogout={handleLogout} onSearch={handleSearch} />
        <Routes>
          <Route path="/" element={<HomePage navigate={navigate} />} />
          <Route path="/marketplace" element={<MarketplacePage navigate={navigate} />} />
          <Route path="/service/:id" element={<ServiceDetailPage navigate={navigate} user={user} addToast={addToast} />} />
          <Route path="/orders" element={<OrdersPage navigate={navigate} user={user} addToast={addToast} />} />
          <Route path="/order/:id" element={<OrderDetailPage user={user} addToast={addToast} />} />
          <Route path="/messages" element={<MessagesPage user={user} />} />
          <Route path="/my-services" element={<MyServicesPage user={user} addToast={addToast} navigate={navigate} />} />
          <Route path="/earnings" element={<EarningsPage user={user} />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
          <Route path="/admin" element={<AdminPage user={user} addToast={addToast} />} />
          <Route path="/disputes" element={<DisputesPage user={user} addToast={addToast} />} />
        </Routes>
      </main>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin} onPiLogin={handlePiLogin} />
    </div>
  );
}

export default App;
