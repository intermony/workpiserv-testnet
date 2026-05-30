import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import piSDK from './pi.js';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ==================== TOAST ====================
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span style={{flex:1}}>{t.message}</span>
        <button onClick={() => removeToast(t.id)} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:'1.2rem'}}>×</button>
      </div>
    ))}
  </div>
);

// ==================== SIDEBAR ====================
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

  const handleNav = (page) => {
    navigate(page);
    setMobileOpen(false);
  };

  return (
    <>
      {/* زر البرغر - يظهر فقط على الموبايل */}
      <button
        className="mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="قائمة"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Overlay خلفية معتمة عند فتح السايدبار */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* السايدبار */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <a href="/" onClick={(e) => { e.preventDefault(); handleNav('/'); }} className="sidebar-logo">
          <span>π</span>
          Work<span className="highlight">Pi</span>Serv
        </a>

        <div className="sidebar-section">
          <div className="sidebar-section-title">القائمة الرئيسية</div>
          {navItems.map(item => (
            <div
              key={item.page}
              onClick={() => handleNav(item.page)}
              className={`sidebar-nav-item ${currentPath === item.page ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {freelancerNav.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">المستقل</div>
            {freelancerNav.map(item => (
              <div
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`sidebar-nav-item ${currentPath === item.page ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {adminNav.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">الإدارة</div>
            {adminNav.map(item => (
              <div
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`sidebar-nav-item ${currentPath === item.page ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="sidebar-user">
          <div className="sidebar-user-card" onClick={() => handleNav('/profile')}>
            <div className="user-avatar">{user ? user.avatar : '👤'}</div>
            <div className="user-info">
              <h4>{user ? user.username : 'زائر'}</h4>
              <p>{user ? (user.type === 'freelancer' ? 'مستقل' : user.type === 'admin' ? 'مدير' : 'عميل') : 'غير مسجل'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// ==================== HEADER ====================
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
    <header className="header">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="ابحث عن خدمات، مستقلين..."
          onKeyPress={(e) => e.key === 'Enter' && onSearch(e.target.value)}
        />
      </div>
      <div className="header-actions">
        <button className="btn-icon">
          🔔
          {notifCount > 0 && <span className="badge">{notifCount}</span>}
        </button>
        {user ? (
          <>
            <div className="balance-pill">
              <span style={{fontSize:'1.2rem'}}>π</span>
              <span>{user.balance?.toFixed(2) || '0.00'}</span>
            </div>
            <button
              onClick={onLogout}
              className="btn btn-danger"
              style={{fontSize:'0.8rem', padding:'0.5rem 1rem'}}
            >خروج</button>
          </>
        ) : (
          <button onClick={onLogin} className="btn btn-primary" style={{fontSize:'0.8rem'}}>
            تسجيل الدخول
          </button>
        )}
      </div>
    </header>
  );
};

// ==================== UI COMPONENTS ====================
const Card = ({ children, style }) => (
  <div className="card" style={style}>{children}</div>
);

const Button = ({ children, onClick, variant = 'primary', style, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`btn btn-${variant}`}
    style={style}
  >{children}</button>
);

const StatusBadge = ({ status }) => {
  const labels = {
    pending: '⏳ بانتظار الدفع',
    active: '🛠️ قيد التنفيذ',
    delivered: '📤 تم التسليم',
    completed: '✅ مكتمل',
    disputed: '⚖️ نزاع',
    cancelled: '❌ ملغي'
  };
  return (
    <span className={`status-badge status-${status}`}>
      {labels[status] || status}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ==================== SERVICE CARD ====================
const ServiceCard = ({ service, onClick }) => (
  <div className="service-card" onClick={onClick}>
    <div className="service-image">
      {service.image}
      <span className="service-category">{service.category}</span>
    </div>
    <div className="service-body">
      <div className="service-freelancer">
        <div className="user-avatar" style={{width:'36px',height:'36px',fontSize:'0.8rem'}}>
          {service.freelancerId?.avatar || '👤'}
        </div>
        <div>
          <div style={{fontWeight:600, fontSize:'0.9rem'}}>{service.freelancerId?.username || 'مستقل'}</div>
          <div style={{color:'#f59e0b', fontSize:'0.8rem'}}>{'★'.repeat(Math.floor(service.rating || 0))} {service.rating}</div>
        </div>
      </div>
      <h3 className="service-title">{service.title}</h3>
      <p className="service-desc">{service.description?.substring(0, 80)}...</p>
      <div className="service-footer">
        <span style={{color:'#64748b', fontSize:'0.8rem'}}>⏱️ {service.deliveryDays} أيام</span>
        <span className="service-price">{service.price} π</span>
      </div>
    </div>
  </div>
);

// ==================== HOME PAGE ====================
const HomePage = ({ navigate }) => {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ services: 500, freelancers: 120, orders: 1200 });

  useEffect(() => {
    api.get('/api/services?limit=4').then(res => setServices(res.data.slice(0, 4))).catch(() => {});
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
      <div className="hero">
        <h1 className="hero-title">أنجز أعمالك بأمان<br/>بعملة <span style={{color:'#6366f1'}}>Pi</span></h1>
        <p className="hero-subtitle">
          أول منصة خدمات عربية وعالمية آمنة مدعومة بعملة Pi. نربط المواهب بالفرص عبر نظام الضمان الذكي (Escrow).
        </p>
        <div className="hero-actions">
          <Button onClick={() => navigate('/marketplace')} style={{padding:'1rem 2rem', fontSize:'1rem'}}>
            استكشف الخدمات →
          </Button>
          <Button variant="outline" style={{padding:'1rem 2rem', fontSize:'1rem'}}>
            انضم كمستقل
          </Button>
        </div>
        <div className="stats-grid">
          <div className="stat-item"><h3>{stats.services}+</h3><p>خدمة متاحة</p></div>
          <div className="stat-item"><h3>{stats.freelancers}+</h3><p>مستقل نشط</p></div>
          <div className="stat-item"><h3>{stats.orders}+</h3><p>صفقة ناجحة</p></div>
        </div>
      </div>

      <h2 className="section-title">الفئات الشائعة</h2>
      <div className="categories-grid">
        {categories.map(c => (
          <div key={c.name} className="category-card" onClick={() => navigate('/marketplace')}>
            <div className="category-icon">{c.icon}</div>
            <div className="category-name">{c.name}</div>
            <div className="category-count">{c.count} خدمة</div>
          </div>
        ))}
      </div>

      <h2 className="section-title">خدمات مميزة</h2>
      <div className="services-grid">
        {services.map(s => (
          <ServiceCard key={s._id} service={s} onClick={() => navigate(`/service/${s._id}`)} />
        ))}
      </div>
    </div>
  );
};

// ==================== MARKETPLACE ====================
const MarketplacePage = ({ navigate }) => {
  const [services, setServices] = useState([]);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => { fetchServices(); }, [category, sort]);

  const fetchServices = async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (sort) params.append('sort', sort);
      const res = await api.get(`/api/services?${params}`);
      setServices(res.data);
    } catch (err) {}
  };

  return (
    <div className="animate-fade">
      <div className="header" style={{marginBottom:'1.5rem'}}>
        <h2 style={{margin:0, fontSize:'clamp(1.5rem, 4vw, 2rem)'}}>🛒 سوق الخدمات</h2>
        <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="form-select"
            style={{width:'auto'}}
          >
            <option value="">جميع الفئات</option>
            <option value="تصميم">تصميم</option>
            <option value="برمجة">برمجة</option>
            <option value="تسويق">تسويق</option>
            <option value="كتابة">كتابة</option>
            <option value="فيديو">فيديو</option>
            <option value="صوتيات">صوتيات</option>
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="form-select"
            style={{width:'auto'}}
          >
            <option value="newest">الأحدث</option>
            <option value="price-low">السعر: منخفض</option>
            <option value="price-high">السعر: مرتفع</option>
            <option value="rating">الأعلى تقييماً</option>
          </select>
        </div>
      </div>
      <div className="services-grid">
        {services.length > 0 ? services.map(s => (
          <ServiceCard key={s._id} service={s} onClick={() => navigate(`/service/${s._id}`)} />
        )) : (
          <div className="empty-state" style={{gridColumn:'1/-1'}}>
            <div className="empty-state-icon">🔍</div>
            <h3>لا توجد نتائج</h3>
            <p>جرب بحثاً مختلفاً أو فئة أخرى</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== SERVICE DETAIL ====================
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
      const res = await api.post('/api/orders', { serviceId: service._id, requirements });
      addToast(`تم إنشاء الطلب #${res.data._id}`, 'success');
      navigate('/orders');
      setShowOrderModal(false);
    } catch (err) {
      addToast(err.response?.data?.error || 'خطأ في إنشاء الطلب', 'error');
    }
  };

  if (!service) return <div className="loading-spinner"><div className="spinner"/></div>;

  const freelancer = service.freelancerId;

  return (
    <div className="animate-fade">
      <Button onClick={() => navigate('/marketplace')} variant="secondary" style={{marginBottom:'1rem'}}>
        ← رجوع للسوق
      </Button>

      {/* على موبايل: عمود واحد — على ديسكتوب: عمودان */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap:'1.5rem'
      }}>
        <div>
          <div style={{
            height:'260px', borderRadius:'20px', fontSize:'5rem',
            background:'linear-gradient(135deg, #6366f1, #4f46e5)',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>{service.image}</div>
          <Card style={{marginTop:'1rem'}}>
            <h3 style={{fontSize:'1.1rem', fontWeight:700, marginBottom:'1rem'}}>وصف الخدمة</h3>
            <p style={{lineHeight:1.8, color:'#64748b'}}>{service.description}</p>
            <div style={{display:'flex', gap:'0.75rem', flexWrap:'wrap', marginTop:'1rem'}}>
              <StatusBadge status="completed" />
              <span className="status-badge status-active">⏱️ {service.deliveryDays} أيام تسليم</span>
              <span className="status-badge status-delivered">🔒 Escrow آمن</span>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div style={{display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem'}}>
              <div className="user-avatar" style={{width:'50px',height:'50px',fontSize:'1.2rem'}}>
                {freelancer?.avatar || '👤'}
              </div>
              <div>
                <div style={{fontWeight:700, fontSize:'1.1rem'}}>{freelancer?.username || 'مستقل'}</div>
                <div style={{color:'#64748b', fontSize:'0.8rem'}}>مستقل محترف</div>
              </div>
            </div>
            <div style={{fontSize:'2rem', fontWeight:800, color:'#f59e0b', marginBottom:'0.5rem'}}>{service.price} π</div>
            <p style={{color:'#64748b', marginBottom:'1.5rem'}}>السعر الإجمالي شامل العمولة</p>
            {user ? (
              <>
                <Button onClick={() => setShowOrderModal(true)} style={{width:'100%', marginBottom:'0.5rem', padding:'1rem', fontSize:'1rem'}}>
                  اطلب الآن 🔒
                </Button>
                <Button variant="secondary" style={{width:'100%'}}>💬 تواصل مع المستقل</Button>
              </>
            ) : (
              <Button style={{width:'100%', padding:'1rem', fontSize:'1rem'}}>سجل الدخول للطلب</Button>
            )}
            <div style={{marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                <span style={{color:'#64748b'}}>تسليم</span><strong>{service.deliveryDays} أيام</strong>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                <span style={{color:'#64748b'}}>مرات البيع</span><strong>{service.orders}</strong>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{color:'#64748b'}}>نظام الدفع</span><strong style={{color:'#6366f1'}}>Pi + Escrow</strong>
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
          className="form-textarea"
          placeholder="اشرح متطلباتك للمستقل..."
          value={requirements}
          onChange={e => setRequirements(e.target.value)}
          style={{marginBottom:'1rem'}}
        />
        <p style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'1rem'}}>
          🔒 سيتم احتجاز المبلغ في الـ Escrow. لن يتم تحويله للمستقل إلا بعد تأكيد استلامك.
        </p>
        <Button onClick={handleOrder} style={{width:'100%', padding:'1rem', fontSize:'1rem'}}>
          تأكيد ودفع {service.price} π
        </Button>
      </Modal>
    </div>
  );
};

// ==================== ORDERS PAGE ====================
const OrdersPage = ({ navigate, user, addToast }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => { if (user) fetchOrders(); }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/orders');
      setOrders(res.data);
    } catch (err) { addToast('خطأ في تحميل الطلبات', 'error'); }
  };

  const handleComplete = async (orderId) => {
    try {
      await api.post(`/api/orders/${orderId}/complete`);
      addToast('تم تأكيد الاستلام!', 'success');
      fetchOrders();
    } catch (err) { addToast(err.response?.data?.error || 'خطأ', 'error'); }
  };

  const handleDeliver = async (orderId) => {
    try {
      await api.post(`/api/orders/${orderId}/deliver`, { message: 'تم تسليم العمل' });
      addToast('تم إرسال التسليم!', 'success');
      fetchOrders();
    } catch (err) { addToast(err.response?.data?.error || 'خطأ', 'error'); }
  };

  if (!user) return (
    <div className="empty-state">
      <div className="empty-state-icon">🔒</div>
      <h3>يجب تسجيل الدخول</h3>
      <p>سجل الدخول لعرض طلباتك</p>
    </div>
  );

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem, 4vw, 2rem)', marginBottom:'1.5rem'}}>📦 طلباتي</h2>
      <Card>
        {orders.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>الخدمة</th>
                  <th>الطرف الآخر</th>
                  <th>القيمة</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const isClient = o.clientId._id === user._id || o.clientId === user._id;
                  const other = isClient ? o.freelancerId : o.clientId;
                  return (
                    <tr key={o._id}>
                      <td><strong>{o.serviceId?.title?.substring(0, 25) || 'خدمة'}...</strong></td>
                      <td>{other?.username || 'مستخدم'}</td>
                      <td style={{color:'#f59e0b'}}>{o.price} π</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                        {o.status === 'active' && isClient && (
                          <Button onClick={() => handleComplete(o._id)} variant="success" style={{fontSize:'0.75rem', padding:'0.5rem'}}>✅ تأكيد</Button>
                        )}
                        {o.status === 'active' && !isClient && (
                          <Button onClick={() => handleDeliver(o._id)} style={{fontSize:'0.75rem', padding:'0.5rem'}}>📤 تسليم</Button>
                        )}
                        <Button onClick={() => navigate(`/order/${o._id}`)} variant="secondary" style={{fontSize:'0.75rem', padding:'0.5rem'}}>التفاصيل</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>لا توجد طلبات</h3>
            <p>ابدأ باستكشاف الخدمات وطلب الأولى</p>
            <Button onClick={() => navigate('/marketplace')} style={{marginTop:'1rem'}}>استكشف الخدمات</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

// ==================== ORDER DETAIL ====================
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
    } catch (err) { addToast(err.response?.data?.error || 'خطأ', 'error'); }
  };

  if (!order) return <div className="loading-spinner"><div className="spinner"/></div>;

  const isClient = order.clientId._id === user?._id || order.clientId === user?._id;
  const steps = ['pending', 'active', 'completed'];
  const currentStep = steps.indexOf(order.status === 'disputed' ? 'active' : order.status);

  return (
    <div className="animate-fade">
      <Button onClick={() => window.history.back()} variant="secondary" style={{marginBottom:'1rem'}}>← رجوع</Button>
      <Card>
        <h2 style={{fontSize:'1.5rem', fontWeight:700, marginBottom:'1.5rem'}}>📦 تفاصيل الطلب #{order._id?.toString().slice(-4)}</h2>

        {/* شريط التقدم */}
        <div style={{display:'flex', justifyContent:'space-between', margin:'2rem 0', position:'relative'}}>
          <div style={{position:'absolute', top:'20px', left:'10%', right:'10%', height:'4px', background:'rgba(255,255,255,0.1)', zIndex:0}} />
          {['الدفع', 'التنفيذ', 'الاستلام'].map((label, i) => (
            <div key={label} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', zIndex:1}}>
              <div style={{
                width:'44px', height:'44px', borderRadius:'50%',
                background: i <= currentStep ? (i < currentStep ? '#10b981' : '#6366f1') : '#1e293b',
                border: `3px solid ${i <= currentStep ? (i < currentStep ? '#10b981' : '#6366f1') : 'rgba(255,255,255,0.1)'}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem'
              }}>{i === 0 ? '💳' : i === 1 ? '🛠️' : '✅'}</div>
              <span style={{fontSize:'0.8rem', fontWeight:600, color: i <= currentStep ? '#6366f1' : '#64748b'}}>{label}</span>
            </div>
          ))}
        </div>

        {/* تفاصيل */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'1rem'}}>
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
          <div style={{display:'flex', flexDirection:'column', gap:'0.75rem', maxWidth:'400px'}}>
            <Button onClick={async () => {
              await api.post(`/api/orders/${id}/complete`);
              addToast('تم تأكيد الاستلام!', 'success');
              const res = await api.get(`/api/orders/${id}`);
              setOrder(res.data);
            }} variant="success" style={{width:'100%'}}>✅ تأكيد استلام العمل</Button>
            <Button onClick={() => setShowDispute(true)} variant="danger" style={{width:'100%'}}>⚖️ فتح نزاع</Button>
          </div>
        )}

        {order.status === 'active' && !isClient && (
          <Button onClick={async () => {
            await api.post(`/api/orders/${id}/deliver`, { message: 'تم التسليم' });
            addToast('تم التسليم!', 'success');
            const res = await api.get(`/api/orders/${id}`);
            setOrder(res.data);
          }} style={{width:'100%', maxWidth:'400px'}}>📤 تسليم العمل للعميل</Button>
        )}
      </Card>

      <Modal isOpen={showDispute} onClose={() => setShowDispute(false)} title="⚖️ فتح نزاع">
        <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="form-select" style={{marginBottom:'1rem'}}>
          <option value="">اختر السبب</option>
          <option value="not_delivered">لم يتم تسليم العمل</option>
          <option value="poor_quality">جودة غير مقبولة</option>
          <option value="late">تأخير كبير</option>
          <option value="other">سبب آخر</option>
        </select>
        <textarea className="form-textarea" placeholder="اشرح المشكلة بالتفصيل..." value={disputeDetails} onChange={e => setDisputeDetails(e.target.value)} style={{marginBottom:'1rem'}} />
        <Button onClick={handleDispute} variant="danger" style={{width:'100%'}}>إرسال النزاع</Button>
      </Modal>
    </div>
  );
};

// ==================== MESSAGES ====================
const MessagesPage = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => { if (user) fetchConversations(); }, [user]);

  const fetchConversations = async () => {
    try { const res = await api.get('/api/messages/conversations'); setConversations(res.data); } catch {}
  };

  const openChat = async (partnerId) => {
    setSelectedChat(partnerId);
    try { const res = await api.get(`/api/messages/${partnerId}`); setMessages(res.data); } catch {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    try {
      await api.post('/api/messages', { receiverId: selectedChat, text: newMessage });
      setNewMessage('');
      const res = await api.get(`/api/messages/${selectedChat}`);
      setMessages(res.data);
    } catch {}
  };

  if (!user) return (
    <div className="empty-state">
      <div className="empty-state-icon">🔒</div>
      <h3>يجب تسجيل الدخول</h3>
    </div>
  );

  const partner = conversations.find(c => c.partnerId === selectedChat)?.partner;

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem, 4vw, 2rem)', marginBottom:'1.5rem'}}>💬 الرسائل</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap:'1.5rem'}}>
        <Card style={{maxHeight:'600px', overflowY:'auto'}}>
          <h3 style={{marginBottom:'1rem', fontSize:'1.1rem'}}>المحادثات</h3>
          {conversations.length > 0 ? conversations.map(c => (
            <div key={c.partnerId} onClick={() => openChat(c.partnerId)} style={{
              display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.875rem',
              borderRadius:'12px', cursor:'pointer', marginBottom:'0.5rem',
              background: selectedChat === c.partnerId ? '#6366f1' : 'transparent'
            }}>
              <div className="user-avatar" style={{width:'36px',height:'36px',fontSize:'0.8rem'}}>{c.partner?.avatar || '👤'}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600, fontSize:'0.9rem'}}>{c.partner?.username || 'مستخدم'}</div>
                <div style={{color:'#64748b', fontSize:'0.75rem'}}>{c.lastMessage?.text?.substring(0, 25)}...</div>
              </div>
              {c.unread > 0 && <span className="badge" style={{position:'static'}}>{c.unread}</span>}
            </div>
          )) : <p style={{color:'#64748b', textAlign:'center', padding:'2rem'}}>لا توجد محادثات</p>}
        </Card>

        <div style={{display:'flex', flexDirection:'column', height:'500px', background:'#0f172a', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.1)', overflow:'hidden'}}>
          <div style={{padding:'1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', gap:'1rem'}}>
            <div className="user-avatar">{partner?.avatar || '💬'}</div>
            <div>
              <h4>{partner?.username || 'اختر محادثة'}</h4>
              <p style={{color:'#64748b', fontSize:'0.8rem'}}>{partner ? 'متصل' : 'اختر محادثة من القائمة'}</p>
            </div>
          </div>
          <div style={{flex:1, overflowY:'auto', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
            {messages.length > 0 ? messages.map(m => (
              <div key={m._id} style={{
                maxWidth:'70%', padding:'1rem', borderRadius:'16px', fontSize:'0.9rem',
                alignSelf: m.senderId === user._id ? 'flex-start' : 'flex-end',
                background: m.senderId === user._id ? '#6366f1' : '#1e293b',
              }}>
                {m.text}
                <div style={{fontSize:'0.7rem', opacity:0.7, marginTop:'0.5rem'}}>
                  {new Date(m.createdAt).toLocaleTimeString('ar', {hour:'2-digit', minute:'2-digit'})}
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
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
              className="form-input"
            />
            <Button onClick={sendMessage} disabled={!selectedChat}>إرسال</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MY SERVICES ====================
const MyServicesPage = ({ user, addToast, navigate }) => {
  const [services, setServices] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title:'', category:'تصميم', description:'', price:'', deliveryDays:3 });

  useEffect(() => { if (user?.type === 'freelancer') fetchServices(); }, [user]);

  const fetchServices = async () => {
    try { const res = await api.get('/api/services/my/list'); setServices(res.data); } catch {}
  };

  const handleCreate = async () => {
    try {
      await api.post('/api/services', form);
      addToast('تم نشر الخدمة!', 'success');
      setShowCreate(false);
      fetchServices();
    } catch (err) { addToast(err.response?.data?.error || 'خطأ', 'error'); }
  };

  if (!user || user.type !== 'freelancer') return (
    <div className="empty-state"><div className="empty-state-icon">💼</div><h3>غير مصرح</h3><p>هذه الصفحة للمستقلين فقط</p></div>
  );

  return (
    <div className="animate-fade">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem'}}>
        <h2 style={{margin:0, fontSize:'clamp(1.5rem, 4vw, 2rem)'}}>💼 خدماتي</h2>
        <Button onClick={() => setShowCreate(true)}>+ خدمة جديدة</Button>
      </div>
      {services.length > 0 ? (
        <div className="services-grid">
          {services.map(s => <ServiceCard key={s._id} service={s} onClick={() => {}} />)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">💼</div>
          <h3>لا توجد خدمات</h3>
          <p>أضف خدمتك الأولى وابدأ بالربح</p>
          <Button onClick={() => setShowCreate(true)} style={{marginTop:'1rem'}}>إضافة خدمة</Button>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="💼 خدمة جديدة">
        <div className="form-group">
          <input className="form-input" placeholder="عنوان الخدمة" value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
        </div>
        <div className="form-group">
          <select className="form-select" value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
            <option value="تصميم">تصميم</option>
            <option value="برمجة">برمجة</option>
            <option value="تسويق">تسويق</option>
            <option value="كتابة">كتابة</option>
            <option value="فيديو">فيديو</option>
            <option value="صوتيات">صوتيات</option>
          </select>
        </div>
        <div className="form-group">
          <textarea className="form-textarea" placeholder="الوصف" value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}} className="form-group">
          <input className="form-input" type="number" placeholder="السعر (π)" value={form.price} onChange={e => setForm({...form, price:e.target.value})} />
          <input className="form-input" type="number" placeholder="مدة التسليم (أيام)" value={form.deliveryDays} onChange={e => setForm({...form, deliveryDays:e.target.value})} />
        </div>
        <Button onClick={handleCreate} style={{width:'100%'}}>نشر الخدمة</Button>
      </Modal>
    </div>
  );
};

// ==================== EARNINGS ====================
const EarningsPage = ({ user }) => {
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    if (user?.type === 'freelancer') api.get('/api/earnings').then(res => setEarnings(res.data)).catch(() => {});
  }, [user]);

  if (!user || user.type !== 'freelancer') return (
    <div className="empty-state"><div className="empty-state-icon">💰</div><h3>غير مصرح</h3></div>
  );

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem, 4vw, 2rem)', marginBottom:'1.5rem'}}>💰 الأرباح</h2>
      <div className="stats-grid" style={{marginTop:0, marginBottom:'2rem'}}>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'0.5rem'}}>رصيد متاح</div><div style={{fontSize:'2rem', fontWeight:800, color:'#10b981'}}>{earnings?.available || '0.00'} π</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'0.5rem'}}>قيد الانتظار</div><div style={{fontSize:'2rem', fontWeight:800, color:'#f59e0b'}}>{earnings?.pending || '0.00'} π</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'0.5rem'}}>إجمالي الأرباح</div><div style={{fontSize:'2rem', fontWeight:800}}>{earnings?.total || '0.00'} π</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'0.5rem'}}>العمولات المدفوعة</div><div style={{fontSize:'2rem', fontWeight:800, color:'#64748b'}}>{earnings?.fees || '0.00'} π</div></Card>
      </div>
      <Card>
        <h3 style={{marginBottom:'1rem', fontSize:'1.1rem'}}>سجل المعاملات</h3>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>التاريخ</th><th>المبلغ</th><th>الحالة</th></tr></thead>
            <tbody>
              {earnings?.transactions?.map((t, i) => (
                <tr key={i}>
                  <td>{new Date(t.date).toLocaleDateString('ar')}</td>
                  <td style={{color:'#10b981'}}>+{t.amount} π</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              )) || <tr><td colSpan={3} style={{textAlign:'center', padding:'2rem', color:'#64748b'}}>لا توجد معاملات</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== PROFILE ====================
const ProfilePage = ({ user }) => {
  if (!user) return (
    <div className="empty-state"><div className="empty-state-icon">👤</div><h3>غير مسجل</h3></div>
  );

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem, 4vw, 2rem)', marginBottom:'1.5rem'}}>👤 الملف الشخصي</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap:'1.5rem'}}>
        <Card style={{textAlign:'center'}}>
          <div className="user-avatar" style={{width:'100px', height:'100px', margin:'0 auto 1rem', fontSize:'2.5rem'}}>{user.avatar}</div>
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
            <div className="form-group"><label className="form-label">الاسم</label><input className="form-input" value={user.username} readOnly /></div>
            <div className="form-group"><label className="form-label">البريد</label><input className="form-input" type="email" value={user.email || ''} readOnly /></div>
            <div className="form-group"><label className="form-label">نوع الحساب</label><input className="form-input" value={user.type} readOnly /></div>
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

// ==================== ADMIN ====================
const AdminPage = ({ user, addToast }) => {
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user?.type === 'admin') {
      api.get('/api/admin/stats').then(res => setStats(res.data)).catch(() => {});
      api.get('/api/admin/orders').then(res => setOrders(res.data)).catch(() => {});
      api.get('/api/admin/users').then(res => setUsers(res.data)).catch(() => {});
    }
  }, [user]);

  if (!user || user.type !== 'admin') return (
    <div className="empty-state"><div className="empty-state-icon">🛡️</div><h3>غير مصرح</h3></div>
  );

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem, 4vw, 2rem)', marginBottom:'1.5rem'}}>🛡️ لوحة الإدارة</h2>
      <div className="stats-grid" style={{marginTop:0, marginBottom:'2rem'}}>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>المستخدمين</div><div style={{fontSize:'2rem', fontWeight:800}}>{stats.users || 0}</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>الخدمات</div><div style={{fontSize:'2rem', fontWeight:800}}>{stats.services || 0}</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>الطلبات</div><div style={{fontSize:'2rem', fontWeight:800, color:'#6366f1'}}>{stats.orders || 0}</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>النزاعات</div><div style={{fontSize:'2rem', fontWeight:800, color:'#ef4444'}}>{stats.disputes || 0}</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>العمولات</div><div style={{fontSize:'2rem', fontWeight:800, color:'#10b981'}}>{stats.fees || 0} π</div></Card>
        <Card><div style={{color:'#64748b', fontSize:'0.875rem'}}>حجم التداول</div><div style={{fontSize:'2rem', fontWeight:800, color:'#f59e0b'}}>{stats.volume || 0} π</div></Card>
      </div>
      <Card style={{marginBottom:'1.5rem'}}>
        <h3 style={{marginBottom:'1rem', fontSize:'1.1rem'}}>أحدث الطلبات</h3>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>#</th><th>الخدمة</th><th>القيمة</th><th>الحالة</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td>#{o._id?.toString().slice(-4)}</td>
                  <td>{o.serviceId?.title?.substring(0, 25)}...</td>
                  <td>{o.price} π</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <h3 style={{marginBottom:'1rem', fontSize:'1.1rem'}}>المستخدمون</h3>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>المعرف</th><th>الاسم</th><th>النوع</th><th>الرصيد</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u._id?.toString().slice(-6)}</td>
                  <td>{u.username}</td>
                  <td>{u.type}</td>
                  <td>{u.balance} π</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== DISPUTES ====================
const DisputesPage = ({ user, addToast }) => {
  const [disputes, setDisputes] = useState([]);

  useEffect(() => { if (user?.type === 'admin') fetchDisputes(); }, [user]);

  const fetchDisputes = async () => {
    try { const res = await api.get('/api/disputes'); setDisputes(res.data); } catch {}
  };

  const resolve = async (id, resolution) => {
    try {
      await api.post(`/api/disputes/${id}/resolve`, { resolution });
      addToast(`تم حل النزاع لصالح ${resolution === 'freelancer' ? 'المستقل' : 'العميل'}`, 'success');
      fetchDisputes();
    } catch { addToast('خطأ', 'error'); }
  };

  if (!user || user.type !== 'admin') return (
    <div className="empty-state"><div className="empty-state-icon">⚖️</div><h3>غير مصرح</h3></div>
  );

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem, 4vw, 2rem)', marginBottom:'1.5rem'}}>⚖️ إدارة النزاعات</h2>
      <Card>
        {disputes.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>الطلب</th><th>السبب</th><th>الإجراء</th></tr></thead>
              <tbody>
                {disputes.map(d => (
                  <tr key={d._id}>
                    <td>#{d.orderId?._id?.toString().slice(-4) || d.orderId}</td>
                    <td>{d.reason}</td>
                    <td style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                      <Button onClick={() => resolve(d._id, 'client')} variant="success" style={{fontSize:'0.75rem', padding:'0.5rem'}}>صالح العميل</Button>
                      <Button onClick={() => resolve(d._id, 'freelancer')} style={{fontSize:'0.75rem', padding:'0.5rem'}}>صالح المستقل</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">⚖️</div>
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
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{textAlign:'center'}}>
        <div className="modal-header">
          <h2 className="modal-title">تسجيل الدخول</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{color:'#64748b', marginBottom:'1.5rem'}}>اختر طريقة الدخول إلى المنصة</p>

        <button onClick={onPiLogin} className="btn btn-primary btn-lg" style={{
          width:'100%', marginBottom:'1.5rem',
          background:'linear-gradient(135deg, #8b5cf6, #6366f1)',
          boxShadow:'0 10px 30px rgba(139,92,246,0.3)'
        }}>
          <span style={{fontSize:'1.5rem', fontWeight:800}}>π</span>
          <span>الدخول عبر Pi Network</span>
        </button>

        <div style={{margin:'1.5rem 0', position:'relative'}}>
          <hr style={{borderColor:'rgba(255,255,255,0.1)'}} />
          <span style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#1e293b', padding:'0 1rem', color:'#64748b', fontSize:'0.875rem'}}>أو</span>
        </div>

        <div className="form-group" style={{textAlign:'right'}}>
          <label className="form-label">الاسم</label>
          <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسمك" />
        </div>
        <div className="form-group" style={{textAlign:'right'}}>
          <label className="form-label">نوع الحساب</label>
          <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="client">عميل (أطلب خدمات)</option>
            <option value="freelancer">مستقل (أعرض خدمات)</option>
            <option value="admin">مدير (للاختبار)</option>
          </select>
        </div>
        <Button onClick={() => onLogin(name, type)} style={{width:'100%', marginBottom:'1rem'}}>دخول تجريبي</Button>
        <p style={{color:'#64748b', fontSize:'0.8rem'}}>في النسخة الحقيقية، سيتم استبدال هذا بـ Pi Authentication SDK</p>
      </div>
    </div>
  );
};

// ==================== ROUTER HELPER ====================
function useParamsFromRoute() {
  const location = useLocation();
  const parts = location.pathname.split('/');
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
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleLogin = async (name, type) => {
    try {
      const res = await api.post('/api/auth/demo', { name, type });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setShowLogin(false);
      addToast(`أهلاً ${res.data.user.username}!`, 'success');
    } catch { addToast('خطأ في تسجيل الدخول', 'error'); }
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
    } catch { addToast('خطأ في Pi Login', 'error'); }
  };

  const handleLogout = () => {
    piSDK.logout();
    setUser(null);
    addToast('تم تسجيل الخروج', 'info');
    navigate('/');
  };

  return (
    <div className="app-layout">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Sidebar
        user={user}
        currentPath={location.pathname}
        navigate={navigate}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <Header
          user={user}
          onLogin={() => setShowLogin(true)}
          onLogout={handleLogout}
          onSearch={(q) => navigate('/marketplace')}
        />
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
