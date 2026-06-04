import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import piSDK from './pi.js';
import './App.css';
import { NotificationContainer, notify } from './components/NotificationSystem';
import { translations, LANGUAGES, detectLang, saveLang } from './i18n.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ==================== PI BROWSER BANNER ====================
const PI_REFERRAL_LINK = 'https://minepi.com/alibentaher';
const PI_REFERRAL_CODE = 'alibentaher';

const isPiBrowser = () => /PiBrowser/i.test(navigator.userAgent);

const PiBanner = () => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isPiBrowser()) {
      const dismissed = sessionStorage.getItem('pi_banner_dismissed');
      if (!dismissed) setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('pi_banner_dismissed', '1');
    setVisible(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(PI_REFERRAL_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!visible) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #004E64, #0077B6)',
      borderBottom: '1px solid rgba(255,255,255,0.15)',
      padding: '0.875rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      position: 'sticky',
      top: 0,
      zIndex: 999,
      animation: 'fadeIn 0.5s ease-out',
    }}>
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>π</span>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', margin: 0 }}>
          WorkPiServ fonctionne sous Pi Network · Pi Browser recommandé
        </p>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', margin: '0.2rem 0 0' }}>
          Pi est une cryptomonnaie créée par des docteurs de Stanford — +55 millions de membres dans le monde.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <a
          href={PI_REFERRAL_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#FF6B35',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.8rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          🚀 Rejoindre Pi Network
        </a>
        <button
          onClick={copyCode}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.78rem',
            padding: '0.5rem 0.875rem',
            borderRadius: '8px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          {copied ? '✅ Copié !' : `Code : ${PI_REFERRAL_CODE}`}
        </button>
      </div>
      <button
        onClick={dismiss}
        aria-label="Fermer"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          fontSize: '1.2rem',
          lineHeight: 1,
          padding: '0.25rem',
          flexShrink: 0,
        }}
      >×</button>
    </div>
  );
};
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
        <span>{t.type==='success'?'✅':t.type==='error'?'❌':t.type==='warning'?'⚠️':'ℹ️'}</span>
        <span style={{flex:1}}>{t.message}</span>
        <button onClick={()=>removeToast(t.id)} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:'1.2rem'}}>×</button>
      </div>
    ))}
  </div>
);

// ==================== LANGUAGE SWITCHER ====================
const LangSwitcher = ({ lang, onChangeLang }) => {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang);
  return (
    <div style={{position:'relative'}}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display:'flex', alignItems:'center', gap:'0.4rem',
          background:'#1e293b', border:'1px solid rgba(255,255,255,0.15)',
          borderRadius:'10px', padding:'0.45rem 0.75rem',
          color:'white', cursor:'pointer', fontSize:'0.85rem', fontWeight:600
        }}
      >
        <span>{current?.flag}</span>
        <span style={{display:'none'}}>{current?.label}</span>
        <span style={{fontSize:'0.7rem', opacity:0.7}}>▾</span>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'110%', right:0, background:'#1e293b',
          border:'1px solid rgba(255,255,255,0.15)', borderRadius:'12px',
          overflow:'hidden', zIndex:500, minWidth:'140px',
          boxShadow:'0 10px 30px rgba(0,0,0,0.4)'
        }}>
          {LANGUAGES.map(l => (
            <div
              key={l.code}
              onClick={() => { onChangeLang(l.code); setOpen(false); }}
              style={{
                display:'flex', alignItems:'center', gap:'0.6rem',
                padding:'0.6rem 1rem', cursor:'pointer', fontSize:'0.875rem',
                background: l.code === lang ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: l.code === lang ? '#6366f1' : 'white',
                fontWeight: l.code === lang ? 700 : 400,
                transition:'background 0.2s'
              }}
            >
              <span>{l.flag}</span><span>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== SIDEBAR ====================
const Sidebar = ({ user, currentPath, navigate, lang, T }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { page: '/', label: T.home, icon: '🏠' },
    { page: '/marketplace', label: T.marketplace, icon: '🛒' },
    { page: '/orders', label: T.myOrders, icon: '📦' },
    { page: '/messages', label: T.messages, icon: '💬' },
  ];
  const freelancerNav = user?.type === 'freelancer' ? [
    { page: '/my-services', label: T.myServices, icon: '💼' },
    { page: '/earnings', label: T.earnings, icon: '💰' },
  ] : [];
  const adminNav = user?.type === 'admin' ? [
    { page: '/admin', label: T.dashboard, icon: '🛡️' },
    { page: '/disputes', label: T.disputes, icon: '⚖️' },
  ] : [];

  const handleNav = (page) => { navigate(page); setMobileOpen(false); };

  const userTypeLabel = user
    ? (user.type==='freelancer' ? T.freelancerType : user.type==='admin' ? T.adminType : T.clientType)
    : T.notRegistered;

  return (
    <>
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="menu">
        {mobileOpen ? '✕' : '☰'}
      </button>
      <div className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <a href="/" onClick={e => { e.preventDefault(); handleNav('/'); }} className="sidebar-logo">
          <span>π</span>Work<span className="highlight">Pi</span>Serv
        </a>

        <div className="sidebar-section">
          <div className="sidebar-section-title">{T.mainMenu}</div>
          {navItems.map(item => (
            <div key={item.page} onClick={() => handleNav(item.page)}
              className={`sidebar-nav-item ${currentPath === item.page ? 'active' : ''}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </div>

        {freelancerNav.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">{T.freelancerMenu}</div>
            {freelancerNav.map(item => (
              <div key={item.page} onClick={() => handleNav(item.page)}
                className={`sidebar-nav-item ${currentPath === item.page ? 'active' : ''}`}>
                <span>{item.icon}</span><span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {adminNav.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">{T.adminMenu}</div>
            {adminNav.map(item => (
              <div key={item.page} onClick={() => handleNav(item.page)}
                className={`sidebar-nav-item ${currentPath === item.page ? 'active' : ''}`}>
                <span>{item.icon}</span><span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="sidebar-user">
          <div className="sidebar-user-card" onClick={() => handleNav('/profile')}>
            <div className="user-avatar">{user ? user.avatar : '👤'}</div>
            <div className="user-info">
              <h4>{user ? user.username : T.guest}</h4>
              <p>{userTypeLabel}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// ==================== HEADER ====================
const Header = ({ user, onLogin, onLogout, onSearch, lang, onChangeLang, T }) => {
  const [notifCount, setNotifCount] = useState(0);
  useEffect(() => {
    if (user) api.get('/api/notifications').then(res => setNotifCount(res.data.filter(n=>!n.read).length)).catch(()=>{});
  }, [user]);

  return (
    <header className="header">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder={T.searchPlaceholder}
          onKeyPress={e => e.key==='Enter' && onSearch(e.target.value)} />
      </div>
      <div className="header-actions">
        <LangSwitcher lang={lang} onChangeLang={onChangeLang} />
        <button className="btn-icon">
          🔔{notifCount > 0 && <span className="badge">{notifCount}</span>}
        </button>
        {user ? (
          <>
            <div className="balance-pill">
              <span style={{fontSize:'1.2rem'}}>π</span>
              <span>{user.balance?.toFixed(2)||'0.00'}</span>
            </div>
            <button onClick={onLogout} className="btn btn-danger" style={{fontSize:'0.8rem',padding:'0.5rem 1rem'}}>
              {T.logout}
            </button>
          </>
        ) : (
          <button onClick={onLogin} className="btn btn-primary" style={{fontSize:'0.8rem'}}>
            {T.login}
          </button>
        )}
      </div>
    </header>
  );
};

// ==================== UI COMPONENTS ====================
const Card = ({ children, style }) => <div className="card" style={style}>{children}</div>;

const Button = ({ children, onClick, variant='primary', style, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={`btn btn-${variant}`} style={style}>
    {children}
  </button>
);

const StatusBadge = ({ status, T }) => {
  const map = {
    pending: T.statusPending, active: T.statusActive,
    delivered: T.statusDelivered, completed: T.statusCompleted,
    disputed: T.statusDisputed, cancelled: T.statusCancelled
  };
  return <span className={`status-badge status-${status}`}>{map[status]||status}</span>;
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
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
const ServiceCard = ({ service, onClick, T }) => (
  <div className="service-card" onClick={onClick}>
    <div className="service-image">
      {service.image}
      <span className="service-category">{service.category}</span>
    </div>
    <div className="service-body">
      <div className="service-freelancer">
        <div className="user-avatar" style={{width:'36px',height:'36px',fontSize:'0.8rem'}}>
          {service.freelancerId?.avatar||'👤'}
        </div>
        <div>
          <div style={{fontWeight:600,fontSize:'0.9rem'}}>{service.freelancerId?.username||'—'}</div>
          <div style={{color:'#f59e0b',fontSize:'0.8rem'}}>{'★'.repeat(Math.floor(service.rating||0))} {service.rating}</div>
        </div>
      </div>
      <h3 className="service-title">{service.title}</h3>
      <p className="service-desc">{service.description?.substring(0,80)}...</p>
      <div className="service-footer">
        <span style={{color:'#64748b',fontSize:'0.8rem'}}>⏱️ {service.deliveryDays} {T.daysLabel}</span>
        <span className="service-price">{service.price} π</span>
      </div>
    </div>
  </div>
);

// ==================== HOME PAGE ====================
const HomePage = ({ navigate, T }) => {
  const [services, setServices] = useState([]);
  const stats = { services: 0, freelancers: 0, orders: 0 };

  useEffect(() => {
    api.get('/api/services?limit=4').then(res => setServices(res.data.slice(0,4))).catch(()=>{});
  }, []);

  const categories = [
    { key:'catDesign', icon:'🎨', count:0 }, { key:'catDev', icon:'💻', count:0 },
    { key:'catMarketing', icon:'📢', count:0 }, { key:'catWriting', icon:'✍️', count:0 },
    { key:'catVideo', icon:'🎬', count:0 }, { key:'catAudio', icon:'🎙️', count:0 },
  ];

  return (
    <div className="animate-fade">
      <div className="hero">
        <h1 className="hero-title">
          {T.heroTitle.split('\n').map((line,i) => (
            <span key={i}>{line}{i===0&&<br/>}</span>
          ))}
        </h1>
        <p className="hero-subtitle">{T.heroSubtitle}</p>
        <div className="hero-actions">
          <Button onClick={() => navigate('/marketplace')} style={{padding:'1rem 2rem',fontSize:'1rem'}}>
            {T.exploreBtn}
          </Button>
          <Button variant="outline" style={{padding:'1rem 2rem',fontSize:'1rem'}}>
            {T.joinBtn}
          </Button>
        </div>
        <div className="stats-grid">
          <div className="stat-item"><h3>{stats.services}+</h3><p>{T.statServices}</p></div>
          <div className="stat-item"><h3>{stats.freelancers}+</h3><p>{T.statFreelancers}</p></div>
          <div className="stat-item"><h3>{stats.orders}+</h3><p>{T.statDeals}</p></div>
        </div>
      </div>

      <h2 className="section-title">{T.popularCats}</h2>
      <div className="categories-grid">
        {categories.map(c => (
          <div key={c.key} className="category-card" onClick={() => navigate('/marketplace')}>
            <div className="category-icon">{c.icon}</div>
            <div className="category-name">{T[c.key]}</div>
            <div className="category-count">{c.count} {T.catServices}</div>
          </div>
        ))}
      </div>

      <h2 className="section-title">{T.featuredServices}</h2>
      <div className="services-grid">
        {services.map(s => (
          <ServiceCard key={s._id} service={s} T={T} onClick={() => navigate(`/service/${s._id}`)} />
        ))}
      </div>
    </div>
  );
};

// ==================== MARKETPLACE ====================
const MarketplacePage = ({ navigate, T }) => {
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
    } catch {}
  };

  const catOptions = [
    { value:'', label: T.allCats },
    { value:'تصميم', label: T.catDesign },
    { value:'برمجة', label: T.catDev },
    { value:'تسويق', label: T.catMarketing },
    { value:'كتابة', label: T.catWriting },
    { value:'فيديو', label: T.catVideo },
    { value:'صوتيات', label: T.catAudio },
  ];

  return (
    <div className="animate-fade">
      <div className="header" style={{marginBottom:'1.5rem'}}>
        <h2 style={{margin:0,fontSize:'clamp(1.5rem,4vw,2rem)'}}>🛒 {T.marketTitle}</h2>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
          <select value={category} onChange={e=>setCategory(e.target.value)} className="form-select" style={{width:'auto'}}>
            {catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)} className="form-select" style={{width:'auto'}}>
            <option value="newest">{T.sortNewest}</option>
            <option value="price-low">{T.sortPriceLow}</option>
            <option value="price-high">{T.sortPriceHigh}</option>
            <option value="rating">{T.sortRating}</option>
          </select>
        </div>
      </div>
      <div className="services-grid">
        {services.length > 0 ? services.map(s => (
          <ServiceCard key={s._id} service={s} T={T} onClick={() => navigate(`/service/${s._id}`)} />
        )) : (
          <div className="empty-state" style={{gridColumn:'1/-1'}}>
            <div className="empty-state-icon">🔍</div>
            <h3>{T.noResults}</h3><p>{T.noResultsSub}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== SERVICE DETAIL ====================
const ServiceDetailPage = ({ navigate, user, addToast, T }) => {
  const { id } = useParamsFromRoute();
  const [service, setService] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [requirements, setRequirements] = useState('');

  useEffect(() => {
    api.get(`/api/services/${id}`).then(res => setService(res.data)).catch(()=>{});
  }, [id]);

 const handleOrder = async () => {
    if (!user) { addToast(T.loginFirst, 'warning'); return; }
    try {
      await piSDK.createPayment(
        {
          amount: service.price,
          memo: `WorkPiServ: ${service.title}`,
          serviceId: service._id,
          requirements: requirements || ''
        },
        {
          onReadyForServerApproval: (paymentId, data) => {
            console.log('Approved:', data);
          },
          onReadyForServerCompletion: (paymentId, txid, data) => {
            addToast(`✅ Paiement confirmé !`, 'success');
            navigate('/orders');
            setShowOrderModal(false);
          },
          onCancel: () => { addToast('Paiement annulé', 'warning'); },
          onError: (err) => { addToast('Erreur paiement Pi', 'error'); }
        }
      );
    } catch (err) {
      addToast(err.message || T.errorCreatingOrder, 'error');
    }
  };

  if (!service) return <div className="loading-spinner"><div className="spinner"/></div>;
  const freelancer = service.freelancerId;

  return (
    <div className="animate-fade">
      <Button onClick={() => navigate('/marketplace')} variant="secondary" style={{marginBottom:'1rem'}}>
        {T.backToMarket}
      </Button>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',gap:'1.5rem'}}>
        <div>
          <div style={{height:'260px',borderRadius:'20px',fontSize:'5rem',background:'linear-gradient(135deg, #6366f1, #4f46e5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {service.image}
          </div>
          <Card style={{marginTop:'1rem'}}>
            <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:'1rem'}}>{T.serviceDesc}</h3>
            <p style={{lineHeight:1.8,color:'#64748b'}}>{service.description}</p>
            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',marginTop:'1rem'}}>
              <StatusBadge status="completed" T={T} />
              <span className="status-badge status-active">⏱️ {service.deliveryDays} {T.daysLabel}</span>
              <span className="status-badge status-delivered">{T.safeEscrow}</span>
            </div>
          </Card>
        </div>
        <div>
          <Card>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.5rem'}}>
              <div className="user-avatar" style={{width:'50px',height:'50px',fontSize:'1.2rem'}}>{freelancer?.avatar||'👤'}</div>
              <div>
                <div style={{fontWeight:700,fontSize:'1.1rem'}}>{freelancer?.username||'—'}</div>
                <div style={{color:'#64748b',fontSize:'0.8rem'}}>{T.professionalFreelancer}</div>
              </div>
            </div>
            <div style={{fontSize:'2rem',fontWeight:800,color:'#f59e0b',marginBottom:'0.5rem'}}>{service.price} π</div>
            <p style={{color:'#64748b',marginBottom:'1.5rem'}}>{T.totalPriceNote}</p>
            {user ? (
              <>
                <Button onClick={() => setShowOrderModal(true)} style={{width:'100%',marginBottom:'0.5rem',padding:'1rem',fontSize:'1rem'}}>{T.btnOrderNow}</Button>
                <Button variant="secondary" style={{width:'100%'}}>{T.btnContact}</Button>
              </>
            ) : (
              <Button style={{width:'100%',padding:'1rem',fontSize:'1rem'}}>{T.btnLoginToOrder}</Button>
            )}
            <div style={{marginTop:'1.5rem',paddingTop:'1rem',borderTop:'1px solid rgba(255,255,255,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
                <span style={{color:'#64748b'}}>{T.labelDelivery}</span><strong>{service.deliveryDays} {T.daysLabel}</strong>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
                <span style={{color:'#64748b'}}>{T.labelTimesSold}</span><strong>{service.orders}</strong>
              </div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{color:'#64748b'}}>{T.labelPaymentSystem}</span><strong style={{color:'#6366f1'}}>Pi + Escrow</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} title={T.confirmOrderTitle}>
        <div style={{marginBottom:'1rem'}}>
          <h3>{service.title}</h3><p style={{color:'#64748b'}}>{freelancer?.username}</p>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
          <span>{T.labelServicePrice}</span><strong>{service.price} π</strong>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
          <span>{T.labelPlatformFee}</span><strong>{(service.price*0.1).toFixed(2)} π</strong>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',paddingTop:'0.5rem',borderTop:'1px solid rgba(255,255,255,0.1)',marginBottom:'1rem'}}>
          <span style={{color:'#f59e0b'}}>{T.labelTotalEscrowed}</span>
          <strong style={{color:'#f59e0b'}}>{service.price} π</strong>
        </div>
        <textarea className="form-textarea" placeholder={T.requirementsPlaceholder} value={requirements} onChange={e=>setRequirements(e.target.value)} style={{marginBottom:'1rem'}} />
        <p style={{color:'#64748b',fontSize:'0.875rem',marginBottom:'1rem'}}>{T.escrowNote}</p>
        <Button onClick={handleOrder} style={{width:'100%',padding:'1rem',fontSize:'1rem'}}>
          {T.btnConfirmPay} {service.price} π
        </Button>
      </Modal>
    </div>
  );
};

// ==================== ORDERS PAGE ====================
const OrdersPage = ({ navigate, user, addToast, T }) => {
  const [orders, setOrders] = useState([]);
  useEffect(() => { if (user) fetchOrders(); }, [user]);

  const fetchOrders = async () => {
    try { const res = await api.get('/api/orders'); setOrders(res.data); }
    catch { addToast(T.errorLoadingOrders, 'error'); }
  };
  const handleComplete = async (orderId) => {
    try { await api.post(`/api/orders/${orderId}/complete`); addToast(T.receiptConfirmed, 'success'); fetchOrders(); }
    catch (err) { addToast(err.response?.data?.error||T.error, 'error'); }
  };
  const handleDeliver = async (orderId) => {
    try { await api.post(`/api/orders/${orderId}/deliver`, {message:'done'}); addToast(T.deliverySent, 'success'); fetchOrders(); }
    catch (err) { addToast(err.response?.data?.error||T.error, 'error'); }
  };

  if (!user) return (
    <div className="empty-state">
      <div className="empty-state-icon">🔒</div>
      <h3>{T.loginRequired}</h3><p>{T.loginToView}</p>
    </div>
  );

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem,4vw,2rem)',marginBottom:'1.5rem'}}>📦 {T.ordersTitle}</h2>
      <Card>
        {orders.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>{T.colService}</th><th>{T.colCounterpart}</th><th>{T.colValue}</th><th>{T.colStatus}</th><th>{T.colAction}</th></tr></thead>
              <tbody>
                {orders.map(o => {
                  const isClient = o.clientId._id===user._id||o.clientId===user._id;
                  const other = isClient ? o.freelancerId : o.clientId;
                  return (
                    <tr key={o._id}>
                      <td><strong>{o.serviceId?.title?.substring(0,25)||'—'}...</strong></td>
                      <td>{other?.username||'—'}</td>
                      <td style={{color:'#f59e0b'}}>{o.price} π</td>
                      <td><StatusBadge status={o.status} T={T} /></td>
                      <td style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                        {o.status==='active'&&isClient&&<Button onClick={()=>handleComplete(o._id)} variant="success" style={{fontSize:'0.75rem',padding:'0.5rem'}}>{T.btnConfirm}</Button>}
                        {o.status==='active'&&!isClient&&<Button onClick={()=>handleDeliver(o._id)} style={{fontSize:'0.75rem',padding:'0.5rem'}}>{T.btnDeliver}</Button>}
                        <Button onClick={()=>navigate(`/order/${o._id}`)} variant="secondary" style={{fontSize:'0.75rem',padding:'0.5rem'}}>{T.btnDetails}</Button>
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
            <h3>{T.noOrders}</h3><p>{T.noOrdersSub}</p>
            <Button onClick={()=>navigate('/marketplace')} style={{marginTop:'1rem'}}>{T.exploreNow}</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

// ==================== ORDER DETAIL ====================
const OrderDetailPage = ({ user, addToast, T }) => {
  const { id } = useParamsFromRoute();
  const [order, setOrder] = useState(null);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');

  useEffect(() => { api.get(`/api/orders/${id}`).then(res=>setOrder(res.data)).catch(()=>{}); }, [id]);

  const handleDispute = async () => {
    try {
      await api.post('/api/disputes', {orderId:id,reason:disputeReason,details:disputeDetails});
      addToast(T.disputeOpened, 'warning');
      setShowDispute(false);
      const res = await api.get(`/api/orders/${id}`); setOrder(res.data);
    } catch (err) { addToast(err.response?.data?.error||T.error, 'error'); }
  };

  if (!order) return <div className="loading-spinner"><div className="spinner"/></div>;
  const isClient = order.clientId._id===user?._id||order.clientId===user?._id;
  const steps = ['pending','active','completed'];
  const currentStep = steps.indexOf(order.status==='disputed'?'active':order.status);

  return (
    <div className="animate-fade">
      <Button onClick={()=>window.history.back()} variant="secondary" style={{marginBottom:'1rem'}}>{T.backBtn}</Button>
      <Card>
        <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>📦 {T.orderDetailTitle} #{order._id?.toString().slice(-4)}</h2>
        <div style={{display:'flex',justifyContent:'space-between',margin:'2rem 0',position:'relative'}}>
          <div style={{position:'absolute',top:'20px',left:'10%',right:'10%',height:'4px',background:'rgba(255,255,255,0.1)',zIndex:0}}/>
          {[T.stepPayment, T.stepExecution, T.stepReceipt].map((label,i) => (
            <div key={label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem',zIndex:1}}>
              <div style={{width:'44px',height:'44px',borderRadius:'50%',background:i<=currentStep?(i<currentStep?'#10b981':'#6366f1'):'#1e293b',border:`3px solid ${i<=currentStep?(i<currentStep?'#10b981':'#6366f1'):'rgba(255,255,255,0.1)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.25rem'}}>
                {i===0?'💳':i===1?'🛠️':'✅'}
              </div>
              <span style={{fontSize:'0.8rem',fontWeight:600,color:i<=currentStep?'#6366f1':'#64748b'}}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'1rem',marginBottom:'1rem'}}>
          <div><p style={{color:'#64748b',marginBottom:'0.5rem'}}>{T.labelService}</p><p style={{fontWeight:700}}>{order.serviceId?.title||'—'}</p></div>
          <div><p style={{color:'#64748b',marginBottom:'0.5rem'}}>{T.labelEscrow}</p><p style={{fontWeight:700,color:'#f59e0b'}}>{order.escrowAmount} π</p></div>
          <div><p style={{color:'#64748b',marginBottom:'0.5rem'}}>{T.labelClient}</p><p>{order.clientId?.username||'—'}</p></div>
          <div><p style={{color:'#64748b',marginBottom:'0.5rem'}}>{T.labelFreelancer}</p><p>{order.freelancerId?.username||'—'}</p></div>
        </div>
        <div style={{marginBottom:'1rem'}}>
          <p style={{color:'#64748b',marginBottom:'0.5rem'}}>{T.labelCurrentStatus}</p>
          <StatusBadge status={order.status} T={T} />
        </div>
        {order.status==='active'&&isClient&&(
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',maxWidth:'400px'}}>
            <Button onClick={async()=>{ await api.post(`/api/orders/${id}/complete`); addToast(T.receiptConfirmed,'success'); const r=await api.get(`/api/orders/${id}`); setOrder(r.data); }} variant="success" style={{width:'100%'}}>{T.btnConfirmReceipt}</Button>
            <Button onClick={()=>setShowDispute(true)} variant="danger" style={{width:'100%'}}>{T.btnOpenDispute}</Button>
          </div>
        )}
        {order.status==='active'&&!isClient&&(
          <Button onClick={async()=>{ await api.post(`/api/orders/${id}/deliver`,{message:'done'}); addToast(T.deliverySent,'success'); const r=await api.get(`/api/orders/${id}`); setOrder(r.data); }} style={{width:'100%',maxWidth:'400px'}}>{T.btnDeliverWork}</Button>
        )}
      </Card>
      <Modal isOpen={showDispute} onClose={()=>setShowDispute(false)} title="⚖️">
        <select value={disputeReason} onChange={e=>setDisputeReason(e.target.value)} className="form-select" style={{marginBottom:'1rem'}}>
          <option value="">{T.selectReason}</option>
          <option value="not_delivered">{T.notDelivered}</option>
          <option value="poor_quality">{T.poorQuality}</option>
          <option value="late">{T.lateDelivery}</option>
          <option value="other">{T.otherReason}</option>
        </select>
        <textarea className="form-textarea" placeholder={T.explainProblem} value={disputeDetails} onChange={e=>setDisputeDetails(e.target.value)} style={{marginBottom:'1rem'}}/>
        <Button onClick={handleDispute} variant="danger" style={{width:'100%'}}>{T.btnSubmitDispute}</Button>
      </Modal>
    </div>
  );
};

// ==================== MESSAGES ====================
const MessagesPage = ({ user, T }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => { if (user) api.get('/api/messages/conversations').then(res=>setConversations(res.data)).catch(()=>{}); }, [user]);

  const openChat = async (pid) => {
    setSelectedChat(pid);
    try { const r=await api.get(`/api/messages/${pid}`); setMessages(r.data); } catch{}
  };
  const sendMessage = async () => {
    if (!newMessage.trim()||!selectedChat) return;
    try { await api.post('/api/messages',{receiverId:selectedChat,text:newMessage}); setNewMessage(''); const r=await api.get(`/api/messages/${selectedChat}`); setMessages(r.data); } catch{}
  };

  if (!user) return <div className="empty-state"><div className="empty-state-icon">🔒</div><h3>{T.loginRequired}</h3></div>;
  const partner = conversations.find(c=>c.partnerId===selectedChat)?.partner;

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem,4vw,2rem)',marginBottom:'1.5rem'}}>💬 {T.messagesTitle}</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',gap:'1.5rem'}}>
        <Card style={{maxHeight:'600px',overflowY:'auto'}}>
          <h3 style={{marginBottom:'1rem',fontSize:'1.1rem'}}>{T.conversationsTitle}</h3>
          {conversations.length>0 ? conversations.map(c=>(
            <div key={c.partnerId} onClick={()=>openChat(c.partnerId)} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.875rem',borderRadius:'12px',cursor:'pointer',marginBottom:'0.5rem',background:selectedChat===c.partnerId?'#6366f1':'transparent'}}>
              <div className="user-avatar" style={{width:'36px',height:'36px',fontSize:'0.8rem'}}>{c.partner?.avatar||'👤'}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:'0.9rem'}}>{c.partner?.username||'—'}</div>
                <div style={{color:'#64748b',fontSize:'0.75rem'}}>{c.lastMessage?.text?.substring(0,25)}...</div>
              </div>
              {c.unread>0&&<span className="badge" style={{position:'static'}}>{c.unread}</span>}
            </div>
          )) : <p style={{color:'#64748b',textAlign:'center',padding:'2rem'}}>{T.noConversations}</p>}
        </Card>
        <div style={{display:'flex',flexDirection:'column',height:'500px',background:'#0f172a',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.1)',overflow:'hidden'}}>
          <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',gap:'1rem'}}>
            <div className="user-avatar">{partner?.avatar||'💬'}</div>
            <div>
              <h4>{partner?.username||T.selectConvPlaceholder}</h4>
              <p style={{color:'#64748b',fontSize:'0.8rem'}}>{partner?T.onlineStatus:T.selectConvHint}</p>
            </div>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
            {messages.length>0 ? messages.map(m=>(
              <div key={m._id} style={{maxWidth:'70%',padding:'1rem',borderRadius:'16px',fontSize:'0.9rem',alignSelf:m.senderId===user._id?'flex-start':'flex-end',background:m.senderId===user._id?'#6366f1':'#1e293b'}}>
                {m.text}
                <div style={{fontSize:'0.7rem',opacity:0.7,marginTop:'0.5rem'}}>
                  {new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
            )) : <div className="empty-state"><div className="empty-state-icon">💬</div><p>{T.selectConvHint}</p></div>}
          </div>
          <div style={{display:'flex',gap:'0.75rem',padding:'1rem 1.5rem',borderTop:'1px solid rgba(255,255,255,0.1)'}}>
            <input type="text" placeholder={T.msgPlaceholder} value={newMessage} onChange={e=>setNewMessage(e.target.value)} onKeyPress={e=>e.key==='Enter'&&sendMessage()} disabled={!selectedChat} className="form-input"/>
            <Button onClick={sendMessage} disabled={!selectedChat}>{T.btnSend}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MY SERVICES ====================
const MyServicesPage = ({ user, addToast, navigate, T }) => {
  const [services, setServices] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({title:'',category:'تصميم',description:'',price:'',deliveryDays:3});

  useEffect(() => { if (user?.type==='freelancer') api.get('/api/services/my/list').then(r=>setServices(r.data)).catch(()=>{}); }, [user]);

  const handleCreate = async () => {
    try { await api.post('/api/services',form); addToast(T.servicePublished,'success'); setShowCreate(false); api.get('/api/services/my/list').then(r=>setServices(r.data)).catch(()=>{}); }
    catch (err) { addToast(err.response?.data?.error||T.error,'error'); }
  };

  if (!user||user.type!=='freelancer') return <div className="empty-state"><div className="empty-state-icon">💼</div><h3>{T.unauthorized}</h3><p>{T.unauthorizedFreelancer}</p></div>;

  const catOptions = ['تصميم','برمجة','تسويق','كتابة','فيديو','صوتيات'];

  return (
    <div className="animate-fade">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <h2 style={{margin:0,fontSize:'clamp(1.5rem,4vw,2rem)'}}>💼 {T.myServicesTitle}</h2>
        <Button onClick={()=>setShowCreate(true)}>{T.btnNewService}</Button>
      </div>
      {services.length>0 ? (
        <div className="services-grid">{services.map(s=><ServiceCard key={s._id} service={s} T={T} onClick={()=>{}}/>)}</div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">💼</div>
          <h3>{T.noServices}</h3><p>{T.noServicesSub}</p>
          <Button onClick={()=>setShowCreate(true)} style={{marginTop:'1rem'}}>{T.btnAddService}</Button>
        </div>
      )}
      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title={T.newServiceTitle}>
        <div className="form-group"><input className="form-input" placeholder={T.serviceTitleLabel} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
        <div className="form-group">
          <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
            {catOptions.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group"><textarea className="form-textarea" placeholder={T.descLabel} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}} className="form-group">
          <input className="form-input" type="number" placeholder={T.priceLabel} value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
          <input className="form-input" type="number" placeholder={T.deliveryDaysLabel} value={form.deliveryDays} onChange={e=>setForm({...form,deliveryDays:e.target.value})}/>
        </div>
        <Button onClick={handleCreate} style={{width:'100%'}}>{T.btnPublish}</Button>
      </Modal>
    </div>
  );
};

// ==================== EARNINGS ====================
const EarningsPage = ({ user, T }) => {
  const [earnings, setEarnings] = useState(null);
  useEffect(() => { if (user?.type==='freelancer') api.get('/api/earnings').then(r=>setEarnings(r.data)).catch(()=>{}); }, [user]);

  if (!user||user.type!=='freelancer') return <div className="empty-state"><div className="empty-state-icon">💰</div><h3>{T.unauthorized}</h3></div>;

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem,4vw,2rem)',marginBottom:'1.5rem'}}>💰 {T.earningsTitle}</h2>
      <div className="stats-grid" style={{marginTop:0,marginBottom:'2rem'}}>
        <Card><div style={{color:'#64748b',fontSize:'0.875rem',marginBottom:'0.5rem'}}>{T.availableBalance}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#10b981'}}>{earnings?.available||'0.00'} π</div><div style={{fontSize:'0.875rem',color:'#10b981'}}>{T.readyWithdraw}</div></Card>
        <Card><div style={{color:'#64748b',fontSize:'0.875rem',marginBottom:'0.5rem'}}>{T.pendingBalance}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#f59e0b'}}>{earnings?.pending||'0.00'} π</div><div style={{fontSize:'0.875rem',color:'#64748b'}}>{T.inEscrow}</div></Card>
        <Card><div style={{color:'#64748b',fontSize:'0.875rem',marginBottom:'0.5rem'}}>{T.totalEarnings}</div><div style={{fontSize:'2rem',fontWeight:800}}>{earnings?.total||'0.00'} π</div></Card>
        <Card><div style={{color:'#64748b',fontSize:'0.875rem',marginBottom:'0.5rem'}}>{T.feesPaid}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#64748b'}}>{earnings?.fees||'0.00'} π</div></Card>
      </div>
      <Card>
        <h3 style={{marginBottom:'1rem',fontSize:'1.1rem'}}>{T.transactionsTitle}</h3>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Date</th><th>{T.colValue}</th><th>{T.colStatus}</th></tr></thead>
            <tbody>
              {earnings?.transactions?.map((t,i)=>(
                <tr key={i}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td style={{color:'#10b981'}}>+{t.amount} π</td>
                  <td><StatusBadge status={t.status} T={T}/></td>
                </tr>
              ))||<tr><td colSpan={3} style={{textAlign:'center',padding:'2rem',color:'#64748b'}}>{T.noTransactions}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== PROFILE ====================
const ProfilePage = ({ user, T }) => {
  if (!user) return <div className="empty-state"><div className="empty-state-icon">👤</div><h3>{T.loginRequired}</h3></div>;
  const typeLabel = user.type==='freelancer'?T.freelancerType:user.type==='admin'?T.managerType:T.clientType;

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem,4vw,2rem)',marginBottom:'1.5rem'}}>👤 {T.profileTitle}</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',gap:'1.5rem'}}>
        <Card style={{textAlign:'center'}}>
          <div className="user-avatar" style={{width:'100px',height:'100px',margin:'0 auto 1rem',fontSize:'2.5rem'}}>{user.avatar}</div>
          <h3>{user.username}</h3>
          <p style={{color:'#64748b'}}>{typeLabel}</p>
          <div style={{display:'flex',gap:'0.25rem',color:'#f59e0b',fontSize:'1.25rem',justifyContent:'center',marginTop:'0.5rem'}}>
            {'★'.repeat(Math.floor(user.rating||0))}{'☆'.repeat(5-Math.floor(user.rating||0))}
          </div>
          <p style={{color:'#64748b',marginTop:'0.5rem'}}>{user.reviews||0} {T.reviewsLabel}</p>
        </Card>
        <div>
          <Card style={{marginBottom:'1rem'}}>
            <h3 style={{marginBottom:'1rem',fontSize:'1.1rem'}}>{T.infoTitle}</h3>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={user.username} readOnly/></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={user.email||''} readOnly/></div>
            <div className="form-group"><label className="form-label">{T.accountType}</label><input className="form-input" value={typeLabel} readOnly/></div>
          </Card>
          <Card>
            <h3 style={{marginBottom:'1rem',fontSize:'1.1rem'}}>{T.statsTitle}</h3>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><span style={{color:'#64748b'}}>{T.servicesSold}</span><strong>{user.sales||0}</strong></div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><span style={{color:'#64748b'}}>{T.ordersCompleted}</span><strong>{user.completed||0}</strong></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#64748b'}}>{T.completionRate}</span><strong style={{color:'#10b981'}}>{user.sales>0?Math.round((user.completed/user.sales)*100):0}%</strong></div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ==================== ADMIN ====================
const AdminPage = ({ user, addToast, T }) => {
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user?.type==='admin') {
      api.get('/api/admin/stats').then(r=>setStats(r.data)).catch(()=>{});
      api.get('/api/admin/orders').then(r=>setOrders(r.data)).catch(()=>{});
      api.get('/api/admin/users').then(r=>setUsers(r.data)).catch(()=>{});
    }
  }, [user]);

  if (!user||user.type!=='admin') return <div className="empty-state"><div className="empty-state-icon">🛡️</div><h3>{T.unauthorized}</h3></div>;

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem,4vw,2rem)',marginBottom:'1.5rem'}}>🛡️ {T.adminTitle}</h2>
      <div className="stats-grid" style={{marginTop:0,marginBottom:'2rem'}}>
        <Card><div style={{color:'#64748b',fontSize:'0.875rem'}}>{T.labelUsers}</div><div style={{fontSize:'2rem',fontWeight:800}}>{stats.users||0}</div></Card>
        <Card><div style={{color:'#64748b',fontSize:'0.875rem'}}>{T.labelServices}</div><div style={{fontSize:'2rem',fontWeight:800}}>{stats.services||0}</div></Card>
        <Card><div style={{color:'#64748b',fontSize:'0.875rem'}}>{T.labelActiveOrders}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#6366f1'}}>{stats.orders||0}</div></Card>
        <Card><div style={{color:'#64748b',fontSize:'0.875rem'}}>{T.labelDisputes}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#ef4444'}}>{stats.disputes||0}</div></Card>
        <Card><div style={{color:'#64748b',fontSize:'0.875rem'}}>{T.labelFees}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#10b981'}}>{stats.fees||0} π</div></Card>
        <Card><div style={{color:'#64748b',fontSize:'0.875rem'}}>{T.labelVolume}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#f59e0b'}}>{stats.volume||0} π</div></Card>
      </div>
      <Card style={{marginBottom:'1.5rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <h3 style={{fontSize:'1.1rem'}}>{T.latestOrdersTitle}</h3>
          <Button onClick={()=>{api.get('/api/admin/stats').then(r=>setStats(r.data));api.get('/api/admin/orders').then(r=>setOrders(r.data));addToast(T.refreshed,'success');}} variant="secondary" style={{fontSize:'0.75rem'}}>{T.btnRefresh}</Button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>#</th><th>{T.colService}</th><th>{T.colValue}</th><th>{T.colStatus}</th></tr></thead>
            <tbody>{orders.map(o=>(
              <tr key={o._id}>
                <td>#{o._id?.toString().slice(-4)}</td>
                <td>{o.serviceId?.title?.substring(0,25)}...</td>
                <td>{o.price} π</td>
                <td><StatusBadge status={o.status} T={T}/></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      <Card>
        <h3 style={{marginBottom:'1rem',fontSize:'1.1rem'}}>{T.usersTitle}</h3>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>{T.accountType}</th><th>Balance</th></tr></thead>
            <tbody>{users.map(u=>(
              <tr key={u._id}>
                <td>{u._id?.toString().slice(-6)}</td>
                <td>{u.username}</td>
                <td>{u.type}</td>
                <td>{u.balance} π</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== DISPUTES ====================
const DisputesPage = ({ user, addToast, T }) => {
  const [disputes, setDisputes] = useState([]);
  useEffect(() => { if (user?.type==='admin') api.get('/api/disputes').then(r=>setDisputes(r.data)).catch(()=>{}); }, [user]);

  const resolve = async (id, resolution) => {
    try {
      await api.post(`/api/disputes/${id}/resolve`,{resolution});
      addToast(resolution==='freelancer'?T.resolvedFreelancer:T.resolvedClient, 'success');
      api.get('/api/disputes').then(r=>setDisputes(r.data)).catch(()=>{});
    } catch { addToast(T.error,'error'); }
  };

  if (!user||user.type!=='admin') return <div className="empty-state"><div className="empty-state-icon">⚖️</div><h3>{T.unauthorized}</h3></div>;

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem,4vw,2rem)',marginBottom:'1.5rem'}}>⚖️ {T.disputesTitle}</h2>
      <Card>
        {disputes.length>0 ? (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>{T.colOrder}</th><th>{T.colReason}</th><th>{T.colAction}</th></tr></thead>
              <tbody>{disputes.map(d=>(
                <tr key={d._id}>
                  <td>#{d.orderId?._id?.toString().slice(-4)||d.orderId}</td>
                  <td>{d.reason}</td>
                  <td style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                    <Button onClick={()=>resolve(d._id,'client')} variant="success" style={{fontSize:'0.75rem',padding:'0.5rem'}}>{T.btnResolveClient}</Button>
                    <Button onClick={()=>resolve(d._id,'freelancer')} style={{fontSize:'0.75rem',padding:'0.5rem'}}>{T.btnResolveFreelancer}</Button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><div className="empty-state-icon">⚖️</div><h3>{T.noDisputes}</h3><p>{T.noDisputesSub}</p></div>
        )}
      </Card>
    </div>
  );
};

// ==================== LOGIN MODAL ====================
const LoginModal = ({ isOpen, onClose, onLogin, onPiLogin, T }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('client');
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{textAlign:'center'}}>
        <div className="modal-header">
          <h2 className="modal-title">{T.loginTitle}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{color:'#64748b',marginBottom:'1.5rem'}}>{T.loginSubtitle}</p>
        <button onClick={onPiLogin} className="btn btn-primary btn-lg" style={{width:'100%',marginBottom:'1.5rem',background:'linear-gradient(135deg,#8b5cf6,#6366f1)',boxShadow:'0 10px 30px rgba(139,92,246,0.3)'}}>
          <span style={{fontSize:'1.5rem',fontWeight:800}}>π</span>
          <span>{T.loginViaPi}</span>
        </button>
        <div style={{margin:'1.5rem 0',position:'relative'}}>
          <hr style={{borderColor:'rgba(255,255,255,0.1)'}}/>
          <span style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'#1e293b',padding:'0 1rem',color:'#64748b',fontSize:'0.875rem'}}>{T.or}</span>
        </div>
        <div className="form-group" style={{textAlign:'start'}}>
          <label className="form-label">{T.nameLabel}</label>
          <input className="form-input" type="text" value={name} onChange={e=>setName(e.target.value)} placeholder={T.namePlaceholder}/>
        </div>
        <div className="form-group" style={{textAlign:'start'}}>
          <label className="form-label">{T.accountType}</label>
          <select className="form-select" value={type} onChange={e=>setType(e.target.value)}>
            <option value="client">{T.clientOption}</option>
            <option value="freelancer">{T.freelancerOption}</option>
            <option value="admin">{T.adminOption}</option>
          </select>
        </div>
        <Button onClick={()=>onLogin(name,type)} style={{width:'100%',marginBottom:'1rem'}}>{T.demoLogin}</Button>
        <p style={{color:'#64748b',fontSize:'0.8rem'}}>{T.piNote}</p>
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
  const [lang, setLang] = useState(detectLang);
  const navigate = useNavigate();
  const location = useLocation();

  // T = translations object for current language
  const T = translations[lang] || translations['en'];

  // Apply dir & font to document
  useEffect(() => {
    document.documentElement.setAttribute('dir', T.dir);
    document.documentElement.setAttribute('lang', T.lang);
    document.body.style.fontFamily = T.lang === 'ar' ? "'Cairo', sans-serif" : "'Inter', sans-serif";
  }, [lang]);

  const handleChangeLang = (code) => {
    saveLang(code);
    setLang(code);
  };

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

  const addToast = useCallback((message, type='info') => {
    const id = Date.now();
    setToasts(prev => [...prev, {id, message, type}]);
    setTimeout(() => setToasts(prev => prev.filter(t=>t.id!==id)), 4000);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t=>t.id!==id));

  const handleLogin = async (name, type) => {
    try {
      const res = await api.post('/api/auth/demo', {name, type});
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setShowLogin(false);
      addToast(`${T.welcomeMsg} ${res.data.user.username}!`, 'success');
    } catch { addToast(T.loginError, 'error'); }
  };

  const handlePiLogin = async () => {
    try {
      const result = await piSDK.authenticate();
      if (result) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        setShowLogin(false);
        addToast(`${T.welcomeMsg} ${result.user.username}!`, 'success');
      }
    } catch { addToast(T.piLoginError, 'error'); }
  };

  const handleLogout = () => {
    piSDK.logout();
    setUser(null);
    addToast(T.logoutMsg, 'info');
    navigate('/');
  };

  // Pass T and lang to all pages via props
  const pageProps = { navigate, user, addToast, T, lang };

  return (
    <>
      <NotificationContainer />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PiBanner />
    <div className="app-layout" style={{ flex: 1 }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Sidebar user={user} currentPath={location.pathname} navigate={navigate} lang={lang} T={T} />
      <main className="main-content">
        <Header
          user={user} onLogin={()=>setShowLogin(true)} onLogout={handleLogout}
          onSearch={()=>navigate('/marketplace')} lang={lang} onChangeLang={handleChangeLang} T={T}
        />
        <Routes>
          <Route path="/" element={<HomePage {...pageProps}/>} />
          <Route path="/marketplace" element={<MarketplacePage {...pageProps}/>} />
          <Route path="/service/:id" element={<ServiceDetailPage {...pageProps}/>} />
          <Route path="/orders" element={<OrdersPage {...pageProps}/>} />
          <Route path="/order/:id" element={<OrderDetailPage {...pageProps}/>} />
          <Route path="/messages" element={<MessagesPage {...pageProps}/>} />
          <Route path="/my-services" element={<MyServicesPage {...pageProps}/>} />
          <Route path="/earnings" element={<EarningsPage {...pageProps}/>} />
          <Route path="/profile" element={<ProfilePage {...pageProps}/>} />
          <Route path="/admin" element={<AdminPage {...pageProps}/>} />
          <Route path="/disputes" element={<DisputesPage {...pageProps}/>} />
        </Routes>
      </main>
      <LoginModal isOpen={showLogin} onClose={()=>setShowLogin(false)} onLogin={handleLogin} onPiLogin={handlePiLogin} T={T}/>
    </div>
    </div>
    </>
  );
}

export default App;
