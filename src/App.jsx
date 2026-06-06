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

const isPiBrowser = () => {
  const ua = navigator.userAgent || '';
  return /PiBrowser/i.test(ua) ||
         typeof window.Pi !== 'undefined' ||
         /Pi Network/i.test(ua);
};

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
    <div className="pi-banner" style={{
      background: 'linear-gradient(135deg, #004E64, #0077B6)',
      borderBottom: '1px solid rgba(0,78,100,0.10)',
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
            background: 'rgba(0,78,100,0.10)',
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
        <button onClick={()=>removeToast(t.id)} style={{background:'none',border:'none',color:'#5A7A8A',cursor:'pointer',fontSize:'1.2rem'}}>×</button>
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
          background:'var(--bg-surface)', border:'1px solid var(--border-medium)',
          borderRadius:'10px', padding:'0.45rem 0.75rem',
          color:'var(--text-heading)', cursor:'pointer', fontSize:'0.85rem', fontWeight:600
        }}
      >
        <span>{current?.flag}</span>
        <span style={{display:'none'}}>{current?.label}</span>
        <span style={{fontSize:'0.7rem', opacity:0.7}}>▾</span>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'110%', right:0, background:'var(--bg-surface)',
          border:'1px solid var(--border-medium)', borderRadius:'12px',
          overflow:'hidden', zIndex:500, minWidth:'140px',
          boxShadow:'var(--shadow-lg)'
        }}>
          {LANGUAGES.map(l => (
            <div
              key={l.code}
              onClick={() => { onChangeLang(l.code); setOpen(false); }}
              style={{
                display:'flex', alignItems:'center', gap:'0.6rem',
                padding:'0.6rem 1rem', cursor:'pointer', fontSize:'0.875rem',
                background: l.code === lang ? 'rgba(255,107,53,0.15)' : 'transparent',
                color: l.code === lang ? '#FF6B35' : 'var(--text-body)',
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

// ==================== TOP NAV (remplace Sidebar) ====================
const Sidebar = ({ user, currentPath, navigate, lang, T }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { page: '/', label: T.home, icon: '🏠' },
    { page: '/marketplace', label: T.marketplace, icon: '🛒' },
    { page: '/orders', label: T.myOrders, icon: '📦' },
    { page: '/messages', label: T.messages, icon: '💬' },
    { page: '/notifications', label: 'Notifications', icon: '🔔' },
  ];
  const freelancerNav = ['freelancer','both'].includes(user?.type) ? [
    { page: '/my-services', label: T.myServices, icon: '💼' },
    { page: '/earnings', label: T.earnings, icon: '💰' },
  ] : [];
  const adminNav = user?.type === 'admin' ? [
    { page: '/admin', label: T.dashboard, icon: '🛡️' },
    { page: '/disputes', label: T.disputes, icon: '⚖️' },
  ] : [];

  const allItems = [...navItems, ...freelancerNav, ...adminNav];
  const handleNav = (page) => { navigate(page); setMenuOpen(false); };

  const navLinkStyle = (page) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '8px',
    fontSize: '0.875rem', fontWeight: 600,
    cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
    color: currentPath === page ? '#FF6B35' : 'var(--text-body)',
    background: currentPath === page ? 'rgba(255,107,53,0.10)' : 'transparent',
    border: currentPath === page ? '1px solid rgba(255,107,53,0.20)' : '1px solid transparent',
    transition: 'all 0.15s',
  });

  return (
    <>
      {/* ── DESKTOP TOP NAV ── */}
      <nav className="topnav-desktop">
        <div className="topnav-inner">
          {/* Logo */}
          <a href="/" onClick={e => { e.preventDefault(); handleNav('/'); }} className="topnav-logo">
            <span style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#FF6B35,#E55A28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', color: '#fff', fontWeight: 800, flexShrink: 0,
            }}>π</span>
            <span style={{
              fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: '1.05rem',
              background: 'linear-gradient(135deg,#FF6B35,#004E64)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.3px',
            }}>
              Work<span style={{ color: '#FF6B35', WebkitTextFillColor: '#FF6B35' }}>π</span>Serv
            </span>
          </a>

          {/* Liens nav */}
          <div className="topnav-links">
            {allItems.map(item => (
              <div key={item.page} onClick={() => handleNav(item.page)} style={navLinkStyle(item.page)}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* User pill */}
          {user && (
            <div onClick={() => handleNav('/profile')} style={{
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
              padding: '5px 12px 5px 6px', borderRadius: '999px',
              background: 'rgba(0,78,100,0.07)', border: '1px solid rgba(0,78,100,0.15)',
              flexShrink: 0,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg,#FF6B35,#004E64)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: '#fff',
              }}>
                {user.username?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                {user.username}
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* ── MOBILE BURGER ── */}
      <button className="mobile-toggle" onClick={() => setMenuOpen(v => !v)} aria-label="menu">
        {menuOpen ? '✕' : '☰'}
      </button>
      {menuOpen && (
        <div className="topnav-mobile-menu" onClick={() => setMenuOpen(false)}>
          {allItems.map(item => (
            <div key={item.page} onClick={(e) => { e.stopPropagation(); handleNav(item.page); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', borderRadius: '12px',
                color: currentPath === item.page ? '#FF6B35' : 'var(--text-heading)',
                background: currentPath === item.page ? 'rgba(255,107,53,0.08)' : 'transparent',
                fontSize: '15px', fontWeight: 500, cursor: 'pointer',
              }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
          {user && (
            <div onClick={(e) => { e.stopPropagation(); handleNav('/profile'); }} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', borderRadius: '12px',
              color: 'var(--text-heading)', fontSize: '15px', fontWeight: 500, cursor: 'pointer',
              marginTop: '4px', borderTop: '1px solid var(--border-light)',
            }}>
              👤 {user.username}
            </div>
          )}
        </div>
      )}
    </>
  );
};

// ==================== LOGO WORKPISERV ====================
const WorkPiServLogo = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(255,107,53,0.45))' }}>
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF6B35" />
        <stop offset="100%" stopColor="#E55A28" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="24" fill="url(#logoGrad)" />
    <text x="24" y="32" textAnchor="middle" fontSize="24" fontFamily="Georgia, serif"
      fontWeight="bold" fill="white" letterSpacing="-1">π</text>
    <rect x="10" y="37.5" width="28" height="2" rx="1" fill="white" opacity="0.45" />
  </svg>
);

const WorkPiServWordmark = () => (
  <span style={{
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: '1.15rem',
    color: 'var(--text-heading)',
    letterSpacing: '0.02em',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  }}>
    Work<span style={{ color: '#FF6B35' }}>π</span>Serv
  </span>
);

// ==================== HEADER ====================
const Header = ({ user, onLogin, onLogout, onSearch, lang, onChangeLang, T, navigate }) => {
  const [notifCount, setNotifCount] = useState(0);

  const fetchNotifCount = () => {
    if (user) api.get('/api/notifications').then(res => setNotifCount(res.data.filter(n=>!n.read).length)).catch(()=>{});
  };

  useEffect(() => {
    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleBellClick = () => {
    if (navigate) navigate('/notifications');
  };

  return (
    <header className="header">
      <a href="/" onClick={e => { e.preventDefault(); if (navigate) navigate('/'); }}
        style={{ display:'flex', alignItems:'center', gap:'0.5rem', textDecoration:'none', flexShrink:0, marginRight:'0.75rem' }}
        aria-label="WorkPiServ — Accueil">
        <WorkPiServLogo size={38} />
        <WorkPiServWordmark />
      </a>
      <div className="search-box" style={{ flex: 1 }}>
        <span className="search-icon">🔍</span>
        <input type="text" placeholder={T.searchPlaceholder}
          onKeyPress={e => e.key==='Enter' && onSearch(e.target.value)} />
      </div>
      <div className="header-actions">
        <LangSwitcher lang={lang} onChangeLang={onChangeLang} />
        <button className="btn-icon" onClick={handleBellClick} style={{cursor:'pointer'}}>
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
const ACCENT_MAP = {
  'Design':'#FF6B35','تصميم':'#FF6B35',
  'Développement':'#0EA5E9','برمجة':'#0EA5E9',
  'Marketing':'#EC4899','تسويق':'#EC4899',
  'Rédaction':'#10B981','كتابة':'#10B981',
  'Vidéo':'#F59E0B','فيديو':'#F59E0B',
  'Audio':'#8B5CF6','صوتيات':'#8B5CF6',
};

const ServiceCard = ({ service, onClick, T }) => {
  const [hovered, setHovered] = useState(false);
  const accent = ACCENT_MAP[service.category] || '#FF6B35';
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,107,53,0.05)' : 'var(--bg-surface)',
        border: `1.5px solid ${hovered ? accent : 'var(--border-medium)'}`,
        borderRadius: '20px', cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `0 20px 48px ${accent}22` : 'none',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
      }}
    >
      <div style={{ height:'140px', background:`linear-gradient(135deg,${accent}22,#FFF5F1)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', position:'relative', overflow:'hidden' }}>
        {service.image || '🎯'}
        <div style={{ position:'absolute',top:'-20px',right:'-20px',width:'100px',height:'100px',background:`radial-gradient(circle,${accent}33 0%,transparent 70%)`,borderRadius:'50%' }} />
        <span style={{ position:'absolute',top:'10px',right:'10px',background:`${accent}22`,color:accent,border:`1px solid ${accent}44`,padding:'3px 10px',borderRadius:'100px',fontSize:'10px',fontWeight:700,backdropFilter:'blur(8px)' }}>{service.category}</span>
      </div>
      <div style={{ padding:'1rem', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'0.625rem' }}>
          <div style={{ width:'30px',height:'30px',borderRadius:'50%',background:`linear-gradient(135deg,${accent},${accent}88)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:800,color:'#fff',flexShrink:0 }}>
            {service.freelancerId?.username?.[0]?.toUpperCase() || '👤'}
          </div>
          <div>
            <div style={{ fontWeight:600,fontSize:'0.8rem',color:'var(--text-body)' }}>{service.freelancerId?.username||'—'}</div>
            <div style={{ color:'#F59E0B',fontSize:'0.7rem' }}>{'★'.repeat(Math.floor(service.rating||0))} <span style={{color:'var(--text-muted)'}}>{service.rating||0}</span></div>
          </div>
        </div>
        <h3 style={{ fontFamily:"'Syne','Montserrat',sans-serif",fontWeight:700,fontSize:'0.9rem',color:'var(--text-heading)',lineHeight:1.3,margin:'0 0 0.5rem 0',flex:1 }}>
          {service.title?.substring(0,55)}{service.title?.length > 55 ? '…' : ''}
        </h3>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:'0.625rem',borderTop:'1px solid var(--border-light)' }}>
          <span style={{ color:'var(--text-muted)',fontSize:'0.72rem' }}>⏱️ {service.deliveryDays} {T.daysLabel||'j'}</span>
          <span style={{ fontFamily:"'Syne','Montserrat',sans-serif",fontWeight:800,fontSize:'1rem',color:'var(--text-heading)' }}>
            <span style={{ color:accent }}>π</span> {service.price}
          </span>
        </div>
      </div>
    </div>
  );
};


// ==================== NOTIFICATIONS PAGE ====================
const NotificationsPage = ({ user, T }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/api/notifications')
      .then(res => {
        setNotifications(res.data);
        // Marquer tout comme lu
        api.put('/api/notifications/read').catch(()=>{});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const typeIcon = (type) => {
    const icons = {
      order: '📦', message: '💬', payment: '💰',
      review: '⭐', system: '🔔', dispute: '⚖️'
    };
    return icons[type] || '🔔';
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'maintenant';
    if (mins < 60) return `il y a ${mins}min`;
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${days}j`;
  };

  return (
    <div className="animate-fade" style={{maxWidth:'700px',margin:'0 auto',padding:'1rem'}}>
      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.5rem'}}>
        <span style={{fontSize:'1.8rem'}}>🔔</span>
        <h2 style={{margin:0,fontSize:'1.5rem',fontWeight:700}}>Notifications</h2>
        {notifications.filter(n=>!n.read).length > 0 && (
          <span style={{
            background:'#D62246',color:'#fff',borderRadius:'12px',
            padding:'2px 10px',fontSize:'12px',fontWeight:700
          }}>
            {notifications.filter(n=>!n.read).length} nouvelles
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"/></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <h3>Aucune notification</h3>
          <p>Vous serez notifié ici pour vos commandes, messages et paiements.</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          {notifications.map(n => (
            <div key={n._id} style={{
              background: n.read ? 'var(--bg-card)' : 'rgba(255,107,53,0.05)',
              border: `1px solid ${n.read ? 'rgba(0,78,100,0.08)' : 'rgba(255,107,53,0.20)'}`,
              borderRadius:'14px', padding:'1rem 1.25rem',
              display:'flex', alignItems:'flex-start', gap:'1rem',
              transition:'all 0.2s',
            }}>
              <span style={{fontSize:'1.5rem',flexShrink:0,marginTop:'2px'}}>
                {typeIcon(n.type)}
              </span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{
                  margin:'0 0 4px',fontWeight: n.read ? 400 : 600,
                  fontSize:'0.9rem',color:'var(--text-heading,#004E64)',
                  lineHeight:1.5
                }}>
                  {n.text || n.message}
                </p>
                <span style={{fontSize:'0.78rem',color:'#5A7A8A'}}>
                  {timeAgo(n.createdAt)}
                </span>
              </div>
              {!n.read && (
                <div style={{
                  width:'8px',height:'8px',borderRadius:'50%',
                  background:'#FF6B35',flexShrink:0,marginTop:'6px'
                }}/>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== HOME PAGE ====================
const HomePage = ({ navigate, T, user }) => {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ services: 0, freelancers: 0, orders: 0 });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredCat, setHoveredCat] = useState(null);

  useEffect(() => {
    api.get('/api/services?limit=6').then(res => setServices(res.data.slice(0, 6))).catch(() => {});
    api.get('/api/services').then(res => {
      const freelancerIds = [...new Set(res.data.map(s => s.freelancerId?._id || s.freelancerId).filter(Boolean))];
      setStats(prev => ({ ...prev, services: res.data.length, freelancers: freelancerIds.length }));
    }).catch(() => {});
    api.get('/api/orders/count').then(res => {
      setStats(prev => ({ ...prev, orders: res.data.count || 0 }));
    }).catch(() => {});
    if (!document.getElementById('wps-fonts')) {
      const link = document.createElement('link');
      link.id = 'wps-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const categories = [
    { key: 'catDesign',    icon: '🎨', accent: '#FF6B35', label: T.catDesign    || 'Design' },
    { key: 'catDev',       icon: '💻', accent: '#0EA5E9', label: T.catDev       || 'Développement' },
    { key: 'catMarketing', icon: '📢', accent: '#EC4899', label: T.catMarketing || 'Marketing' },
    { key: 'catWriting',   icon: '✍️', accent: '#10B981', label: T.catWriting   || 'Rédaction' },
    { key: 'catVideo',     icon: '🎬', accent: '#F59E0B', label: T.catVideo     || 'Vidéo' },
    { key: 'catAudio',     icon: '🎙️', accent: '#8B5CF6', label: T.catAudio     || 'Audio' },
  ];

  const accentForCategory = (cat) => {
    const map = {
      'Design': '#FF6B35', 'تصميم': '#FF6B35',
      'Développement': '#0EA5E9', 'برمجة': '#0EA5E9',
      'Marketing': '#EC4899', 'تسويق': '#EC4899',
      'Rédaction': '#10B981', 'كتابة': '#10B981',
      'Vidéo': '#F59E0B', 'فيديو': '#F59E0B',
      'Audio': '#8B5CF6', 'صوتيات': '#8B5CF6',
    };
    return map[cat] || '#FF6B35';
  };

  const sectionTitle = {
    fontFamily: "'Syne', 'Montserrat', sans-serif",
    fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-heading)',
    marginBottom: '0.875rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };
  const seeAll = {
    color: '#FF6B35', fontSize: '0.78rem', fontWeight: 600,
    cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit',
  };

  return (
    <div className="animate-fade" style={{ background: 'var(--bg-body)', minHeight: '100vh', paddingBottom: '2rem' }}>

      {/* ── HERO BANNER ── */}
      <div style={{
        margin: '1rem', padding: '1.75rem 1.25rem',
        background: 'linear-gradient(145deg, #FFE8DC 0%, #FFF0E0 60%, #E8F4FF 100%)',
        border: '1.5px solid rgba(255,107,53,0.25)', borderRadius: '24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-40px', right: '-20px',
          width: '160px', height: '160px',
          background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,107,53,0.10)', border: '1px solid rgba(255,107,53,0.25)',
            borderRadius: '100px', padding: '4px 12px', marginBottom: '12px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B35' }} />
            <span style={{ color: '#FF6B35', fontSize: '11px', fontWeight: 600 }}>Testnet actif</span>
          </div>
          <h1 style={{
            fontFamily: "'Syne', 'Montserrat', sans-serif",
            fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.15,
            marginBottom: '0.6rem', color: 'var(--text-heading)',
          }}>
            {T.heroTitle?.split('\n')[0] || 'Vendez & Achetez'}<br />
            <span style={{
              background: 'linear-gradient(90deg, #FF6B35, #004E64)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>avec Pi π</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {T.heroSubtitle || 'La première marketplace de freelances payée en Pi Network.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => navigate('/marketplace')} style={{
              flex: 1, background: 'linear-gradient(135deg, #FF6B35, #E55A28)',
              border: 'none', borderRadius: '14px', padding: '0.75rem', color: '#fff',
              fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255,107,53,0.30)',
            }}>{T.exploreBtn || 'Explorer'}</button>
            <button onClick={() => navigate('/new-service')} style={{
              flex: 1, background: 'transparent',
              border: '1.5px solid rgba(0,78,100,0.35)', borderRadius: '14px',
              padding: '0.75rem', color: '#004E64',
              fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            }}>{T.joinBtn || 'Devenir freelance'}</button>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.6rem', margin: '0 1rem 1.5rem',
      }}>
        {[
          { value: `${stats.services}+`, label: T.statServices || 'Services', path: '/marketplace' },
          { value: `${stats.freelancers}+`, label: T.statFreelancers || 'Freelances', path: '/marketplace' },
          { value: `${stats.orders}+`, label: T.statDeals || 'Commandes', path: '/orders' },
        ].map((s, i) => (
          <div key={i} onClick={() => navigate(s.path)} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
            borderRadius: '16px', padding: '0.875rem 0.5rem',
            textAlign: 'center', cursor: 'pointer',
          }}>
            <div style={{
              fontFamily: "'Syne', 'Montserrat', sans-serif",
              fontWeight: 800, fontSize: '1.25rem', color: 'var(--coral-500)', marginBottom: '2px',
            }}>{s.value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── CARTES ACTION (connecté) ── */}
      {user && (
        <div style={{ margin: '0 1rem 1.5rem', display: 'flex', gap: '0.75rem' }}>
          {[
            { id: 'buy', icon: '🛍️', title: T.findService || 'Chercher un service', desc: T.findServiceDesc || "Trouvez le talent qu'il vous faut", path: '/marketplace', accent: '#FF6B35' },
            { id: 'sell', icon: '💼', title: T.publishService || 'Publier un service', desc: T.publishServiceDesc || 'Proposez vos compétences', path: '/new-service', accent: '#FF6B35' },
          ].map(card => (
            <div key={card.id}
              onClick={() => navigate(card.path)}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                flex: 1, background: hoveredCard === card.id ? 'rgba(255,107,53,0.05)' : 'var(--bg-surface)',
                border: `1.5px solid ${hoveredCard === card.id ? card.accent : 'var(--border-medium)'}`,
                borderRadius: '20px', padding: '1.25rem',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.3s',
                boxShadow: hoveredCard === card.id ? `0 12px 32px ${card.accent}33` : 'none',
              }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{card.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-heading)', marginBottom: '0.2rem' }}>{card.title}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{card.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── CATÉGORIES ── */}
      <div style={{ padding: '0 1rem' }}>
        <div style={sectionTitle}>
          <span>{T.popularCats || 'Catégories populaires'}</span>
          <button style={seeAll} onClick={() => navigate('/marketplace')}>Voir tout →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {categories.map((cat, i) => (
            <div key={cat.key}
              onClick={() => navigate('/marketplace')}
              onMouseEnter={() => setHoveredCat(i)}
              onMouseLeave={() => setHoveredCat(null)}
              style={{
                background: hoveredCat === i ? 'rgba(255,107,53,0.08)' : 'var(--bg-surface)',
                border: `1.5px solid ${hoveredCat === i ? cat.accent + '55' : 'var(--border-medium)'}`,
                borderRadius: '18px', padding: '1rem',
                cursor: 'pointer', transition: 'all 0.3s',
                transform: hoveredCat === i ? 'translateY(-2px)' : 'none',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: `${cat.accent}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0,
              }}>{cat.icon}</div>
              <div>
                <div style={{
                  fontFamily: "'Syne', 'Montserrat', sans-serif",
                  fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-heading)', marginBottom: '2px',
                }}>{cat.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>0 {T.catServices || 'services'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES EN VEDETTE ── */}
      <div style={{ padding: '0 1rem' }}>
        <div style={sectionTitle}>
          <span>{T.featuredServices || 'Services en vedette'}</span>
          <button style={seeAll} onClick={() => navigate('/marketplace')}>Voir tout →</button>
        </div>

        {services.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {services.map((s, i) => {
              const accent = accentForCategory(s.category);
              const isLarge = i === 0;
              return (
                <div key={s._id}
                  onClick={() => navigate(`/service/${s._id}`)}
                  style={{
                    gridColumn: isLarge ? 'span 2' : 'span 1',
                    background: 'var(--bg-surface)', border: '1.5px solid var(--border-medium)',
                    borderRadius: '20px', padding: isLarge ? '1.25rem' : '1rem',
                    cursor: 'pointer', transition: 'all 0.3s',
                    position: 'relative', overflow: 'hidden',
                    minHeight: isLarge ? '140px' : '120px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = accent;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 16px 40px ${accent}22`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                  <div style={{
                    position: 'absolute', top: '-20px', right: '-20px',
                    width: '80px', height: '80px',
                    background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
                    borderRadius: '50%',
                  }} />
                  <div>
                    <span style={{
                      background: `${accent}22`, color: accent,
                      fontSize: '10px', fontWeight: 700,
                      padding: '3px 10px', borderRadius: '100px',
                      display: 'inline-block', marginBottom: '0.5rem',
                    }}>{s.category}</span>
                    <h3 style={{
                      fontFamily: "'Syne', 'Montserrat', sans-serif",
                      fontWeight: 700, fontSize: isLarge ? '1rem' : '0.8rem',
                      color: 'var(--text-heading)', lineHeight: 1.3, margin: '0 0 0.5rem 0',
                    }}>
                      {s.title?.substring(0, isLarge ? 60 : 40)}{s.title?.length > (isLarge ? 60 : 40) ? '…' : ''}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {s.freelancerId?.username || '—'}
                    </span>
                    <div style={{
                      fontFamily: "'Syne', 'Montserrat', sans-serif",
                      fontWeight: 800, fontSize: isLarge ? '1rem' : '0.875rem', color: 'var(--text-heading)',
                    }}>
                      <span style={{ color: accent }}>π</span> {s.price}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-surface)', border: '1.5px dashed var(--border-medium)',
            borderRadius: '20px', padding: '2.5rem 1rem',
            textAlign: 'center', marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {T.noResults || 'Aucun service disponible pour le moment.'}
            </p>
            <button onClick={() => navigate('/new-service')} style={{
              background: 'linear-gradient(135deg, #FF6B35, #E55A28)',
              border: 'none', borderRadius: '12px', padding: '0.6rem 1.25rem',
              color: '#fff', fontFamily: 'inherit', fontWeight: 700,
              fontSize: '0.8rem', cursor: 'pointer',
            }}>{T.btnAddService || 'Publier le premier service'}</button>
          </div>
        )}
      </div>

      {/* ── CTA FREELANCE ── */}
      <div style={{
        margin: '0 1rem',
        background: 'linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(0,119,182,0.06) 100%)',
        border: '1.5px solid rgba(255,107,53,0.20)', borderRadius: '20px',
        padding: '1.5rem 1.25rem', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Syne', 'Montserrat', sans-serif",
          fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-heading)', marginBottom: '0.5rem',
        }}>Tu as un talent ? 🚀</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.5 }}>
          Rejoins la communauté et commence à gagner en Pi aujourd'hui.
        </p>
        <button onClick={() => navigate('/new-service')} style={{
          background: 'linear-gradient(135deg, #FF6B35, #E55A28)',
          border: 'none', borderRadius: '14px', padding: '0.75rem 1.5rem',
          color: '#fff', fontFamily: 'inherit', fontWeight: 700,
          fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,107,53,0.30)',
        }}>{T.btnNewService || 'Créer mon profil freelance'}</button>
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
          <div style={{height:'260px',borderRadius:'20px',fontSize:'5rem',background:'linear-gradient(135deg, #FF6B35, #E55A28)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {service.image}
          </div>
          <Card style={{marginTop:'1rem'}}>
            <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:'1rem'}}>{T.serviceDesc}</h3>
            <p style={{lineHeight:1.8,color:'#5A7A8A'}}>{service.description}</p>
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
                <div style={{color:'#5A7A8A',fontSize:'0.8rem'}}>{T.professionalFreelancer}</div>
              </div>
            </div>
            <div style={{fontSize:'2rem',fontWeight:800,color:'#FF6B35',marginBottom:'0.5rem'}}>{service.price} π</div>
            <p style={{color:'#5A7A8A',marginBottom:'1.5rem'}}>{T.totalPriceNote}</p>
            {user ? (
              <>
                <Button onClick={() => setShowOrderModal(true)} style={{width:'100%',marginBottom:'0.5rem',padding:'1rem',fontSize:'1rem'}}>{T.btnOrderNow}</Button>
                <Button variant="secondary" style={{width:'100%'}} onClick={() => {
                  if (freelancer?._id) {
                    navigate('/messages', { state: { partnerId: freelancer._id, partner: freelancer } });
                  }
                }}>{T.btnContact}</Button>
              </>
            ) : (
              <Button style={{width:'100%',padding:'1rem',fontSize:'1rem'}}>{T.btnLoginToOrder}</Button>
            )}
            <div style={{marginTop:'1.5rem',paddingTop:'1rem',borderTop:'1px solid rgba(0,78,100,0.08)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
                <span style={{color:'#5A7A8A'}}>{T.labelDelivery}</span><strong>{service.deliveryDays} {T.daysLabel}</strong>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
                <span style={{color:'#5A7A8A'}}>{T.labelTimesSold}</span><strong>{service.orders}</strong>
              </div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{color:'#5A7A8A'}}>{T.labelPaymentSystem}</span><strong style={{color:'#FF6B35'}}>Pi + Escrow</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} title={T.confirmOrderTitle}>
        <div style={{marginBottom:'1rem'}}>
          <h3>{service.title}</h3><p style={{color:'#5A7A8A'}}>{freelancer?.username}</p>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
          <span>{T.labelServicePrice}</span><strong>{service.price} π</strong>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
          <span>{T.labelPlatformFee}</span><strong>{(service.price*0.1).toFixed(2)} π</strong>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',paddingTop:'0.5rem',borderTop:'1px solid rgba(0,78,100,0.08)',marginBottom:'1rem'}}>
          <span style={{color:'#FFD166'}}>{T.labelTotalEscrowed}</span>
          <strong style={{color:'#FFD166'}}>{service.price} π</strong>
        </div>
        <textarea className="form-textarea" placeholder={T.requirementsPlaceholder} value={requirements} onChange={e=>setRequirements(e.target.value)} style={{marginBottom:'1rem'}} />
        <p style={{color:'#5A7A8A',fontSize:'0.875rem',marginBottom:'1rem'}}>{T.escrowNote}</p>
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
                      <td style={{color:'#FFD166'}}>{o.price} π</td>
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
          <div style={{position:'absolute',top:'20px',left:'10%',right:'10%',height:'4px',background:'rgba(0,78,100,0.08)',zIndex:0}}/>
          {[T.stepPayment, T.stepExecution, T.stepReceipt].map((label,i) => (
            <div key={label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem',zIndex:1}}>
              <div style={{width:'44px',height:'44px',borderRadius:'50%',background:i<=currentStep?(i<currentStep?'#06A77D':'#FF6B35'):'#E0F0F5',border:`3px solid ${i<=currentStep?(i<currentStep?'#06A77D':'#FF6B35'):'rgba(0,78,100,0.08)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.25rem'}}>
                {i===0?'💳':i===1?'🛠️':'✅'}
              </div>
              <span style={{fontSize:'0.8rem',fontWeight:600,color:i<=currentStep?'#FF6B35':'#8FA8B5'}}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'1rem',marginBottom:'1rem'}}>
          <div><p style={{color:'#5A7A8A',marginBottom:'0.5rem'}}>{T.labelService}</p><p style={{fontWeight:700}}>{order.serviceId?.title||'—'}</p></div>
          <div><p style={{color:'#5A7A8A',marginBottom:'0.5rem'}}>{T.labelEscrow}</p><p style={{fontWeight:700,color:'#FFD166'}}>{order.escrowAmount} π</p></div>
          <div><p style={{color:'#5A7A8A',marginBottom:'0.5rem'}}>{T.labelClient}</p><p>{order.clientId?.username||'—'}</p></div>
          <div><p style={{color:'#5A7A8A',marginBottom:'0.5rem'}}>{T.labelFreelancer}</p><p>{order.freelancerId?.username||'—'}</p></div>
        </div>
        <div style={{marginBottom:'1rem'}}>
          <p style={{color:'#5A7A8A',marginBottom:'0.5rem'}}>{T.labelCurrentStatus}</p>
          <StatusBadge status={order.status} T={T} />
        </div>
        {order.status==='active'&&isClient&&(
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',maxWidth:'400px'}}>
            <Button onClick={async()=>{ await api.post(`/api/orders/${id}/complete`); addToast(T.receiptConfirmed,'success'); const r=await api.get(`/api/orders/${id}`); setOrder(r.data); }} variant="success" style={{width:'100%'}}>{T.btnConfirmReceipt}</Button>
            <Button onClick={()=>setShowDispute(true)} variant="danger" style={{width:'100%'}}>{T.btnOpenDispute}</Button>
          </div>
        )}
        {order.status==='active'&&!isClient&&(
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',maxWidth:'400px'}}>
            <Button onClick={async()=>{ await api.post(`/api/orders/${id}/deliver`,{message:'done'}); addToast(T.deliverySent,'success'); const r=await api.get(`/api/orders/${id}`); setOrder(r.data); }} style={{width:'100%'}}>{T.btnDeliverWork}</Button>
            <Button onClick={()=>setShowDispute(true)} variant="danger" style={{width:'100%'}}>{T.btnOpenDispute}</Button>
          </div>
        )}
        {order.status==='disputed'&&(
          <div style={{background:'rgba(214,34,70,0.1)',border:'1px solid #D62246',borderRadius:'12px',padding:'1rem',maxWidth:'400px'}}>
            <p style={{color:'#D62246',fontWeight:700,marginBottom:'0.25rem'}}>⚠️ {T.disputeInProgress||'Litige en cours'}</p>
            <p style={{color:'#8FA8B5',fontSize:'0.85rem'}}>{T.disputeAdminReview||"L'administration examine votre litige. Vous serez notifié de la décision."}</p>
          </div>
        )}
      </Card>
      <Modal isOpen={showDispute} onClose={()=>setShowDispute(false)} title={`⚖️ ${T.btnOpenDispute||'Signaler un litige'}`}>
        <p style={{color:'#8FA8B5',fontSize:'0.85rem',marginBottom:'1rem'}}>{T.disputeAdminReview||"L'administration examinera votre demande et vous notifiera de la décision."}</p>
        <select value={disputeReason} onChange={e=>setDisputeReason(e.target.value)} className="form-select" style={{marginBottom:'1rem'}}>
          <option value="">{T.selectReason}</option>
          <option value="not_delivered">{T.notDelivered}</option>
          <option value="poor_quality">{T.poorQuality}</option>
          <option value="late">{T.lateDelivery}</option>
          <option value="non_payment">{T.nonPayment||'Problème de paiement'}</option>
          <option value="other">{T.otherReason}</option>
        </select>
        <textarea className="form-textarea" placeholder={T.explainProblem} value={disputeDetails} onChange={e=>setDisputeDetails(e.target.value)} style={{marginBottom:'1rem',minHeight:'100px'}}/>
        <Button onClick={handleDispute} disabled={!disputeReason||!disputeDetails} variant="danger" style={{width:'100%'}}>{T.btnSubmitDispute}</Button>
      </Modal>
    </div>
  );
};

// ==================== MESSAGES ====================
// ==================== MESSAGES PAGE ====================
// Coller ce composant dans App.jsx, à la place de l'ancien MessagesPage
// ou juste avant le composant MessagesPage existant

const MessagesPage = ({ user, T, navigate }) => {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [text, setText]                   = useState('');
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const messagesEndRef                    = React.useRef(null);

  // ── Charger les conversations ──
  useEffect(() => {
    if (!user) return;
    api.get('/api/messages/conversations')
      .then(r => {
        setConversations(r.data);
        const incoming = location?.state;
        if (incoming?.partnerId && !activeConv) {
          setActiveConv({ partnerId: incoming.partnerId, partner: incoming.partner });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // ── Charger les messages d'une conversation ──
  useEffect(() => {
    if (!activeConv) return;
    api.get(`/api/messages/${activeConv.partnerId}`)
      .then(r => {
        setMessages(r.data);
        // Mettre à jour la conv comme lue
        setConversations(prev =>
          prev.map(c => c.partnerId === activeConv.partnerId ? { ...c, unread: 0 } : c)
        );
      })
      .catch(() => {});
  }, [activeConv]);

  // ── Polling messages toutes les 5s ──
  useEffect(() => {
    if (!activeConv) return;
    const interval = setInterval(() => {
      api.get(`/api/messages/${activeConv.partnerId}`)
        .then(r => setMessages(r.data))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [activeConv]);

  // ── Scroll en bas ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Envoyer un message ──
  const sendMessage = async () => {
    if (!text.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const res = await api.post('/api/messages', {
        receiverId: activeConv.partnerId,
        text: text.trim()
      });
      setMessages(prev => [...prev, res.data]);
      setText('');
      // Mettre à jour lastMessage dans la liste
      setConversations(prev =>
        prev.map(c => c.partnerId === activeConv.partnerId
          ? { ...c, lastMessage: res.data }
          : c
        )
      );
    } catch {
      notify.error('Erreur', 'Message non envoyé');
    } finally {
      setSending(false);
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'maintenant';
    if (mins < 60)  return `${mins}min`;
    if (hours < 24) return `${hours}h`;
    return `${days}j`;
  };

  // ── Styles ──
  const containerStyle = {
    display: 'flex',
    height: 'calc(100vh - 120px)',
    gap: '0',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '1px solid rgba(0,78,100,0.12)',
    background: '#fff',
  };

  const sidebarStyle = {
    width: activeConv ? '0' : '100%',
    minWidth: activeConv ? '0' : '100%',
    borderRight: '1px solid rgba(0,78,100,0.08)',
    overflowY: 'auto',
    transition: 'all 0.3s',
    display: 'flex',
    flexDirection: 'column',
  };

  const chatStyle = {
    flex: 1,
    display: activeConv ? 'flex' : 'none',
    flexDirection: 'column',
    background: '#FFF8F0',
  };

  if (!user) return (
    <div className="empty-state">
      <div className="empty-state-icon">💬</div>
      <h3>Connectez-vous pour accéder aux messages</h3>
    </div>
  );

  return (
    <div className="animate-fade">
      <h2 style={{ marginBottom: '1rem', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        💬 Messagerie
      </h2>

      <div style={containerStyle}>

        {/* ── Liste conversations ── */}
        <div style={sidebarStyle}>
          <div style={{
            padding: '1rem',
            fontWeight: 700, fontSize: '0.85rem',
            color: '#5A7A8A', textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: '1px solid rgba(0,78,100,0.06)'
          }}>
            Conversations
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner"/></div>
          ) : conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-icon">💬</div>
              <h3 style={{ fontSize: '1rem' }}>Aucune conversation</h3>
              <p style={{ fontSize: '0.85rem' }}>
                Commandez un service pour démarrer une conversation.
              </p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.partnerId}
                onClick={() => setActiveConv(conv)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.875rem 1rem', cursor: 'pointer',
                  borderBottom: '1px solid rgba(0,78,100,0.04)',
                  background: activeConv?.partnerId === conv.partnerId
                    ? 'rgba(0,78,100,0.04)' : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #004E64, #FF6B35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', fontWeight: 700, color: '#fff',
                }}>
                  {conv.partner?.avatar || conv.partner?.username?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#004E64' }}>
                      {conv.partner?.username || 'Utilisateur'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#8FA8B5' }}>
                      {timeAgo(conv.lastMessage?.createdAt)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <p style={{
                      fontSize: '0.8rem', color: '#5A7A8A',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      maxWidth: '160px', margin: 0
                    }}>
                      {conv.lastMessage?.text || '...'}
                    </p>
                    {conv.unread > 0 && (
                      <span style={{
                        background: '#FF6B35', color: '#fff',
                        borderRadius: '50%', width: '20px', height: '20px',
                        fontSize: '0.7rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Zone chat ── */}
        {activeConv && (
          <div style={chatStyle}>

            {/* Header chat */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: '#fff',
              borderBottom: '1px solid rgba(0,78,100,0.08)',
            }}>
              <button
                onClick={() => setActiveConv(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '1.2rem', color: '#5A7A8A', padding: '4px',
                }}
              >←</button>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #004E64, #FF6B35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', color: '#fff', fontWeight: 700,
              }}>
                {activeConv.partner?.avatar || activeConv.partner?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#004E64' }}>
                  {activeConv.partner?.username}
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#06A77D' }}>● En ligne</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '1rem',
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#8FA8B5', marginTop: '2rem', fontSize: '0.9rem' }}>
                  Démarrez la conversation 👋
                </div>
              ) : (
                messages.map((m, i) => {
                  const isMe = m.senderId === user._id || m.senderId?._id === user._id ||
                               m.senderId?.toString() === user._id?.toString();
                  return (
                    <div key={m._id || i} style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '72%',
                        padding: '0.6rem 0.875rem',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMe
                          ? 'linear-gradient(135deg, #004E64, #0077B6)'
                          : '#fff',
                        color: isMe ? '#fff' : '#004E64',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: isMe ? 'none' : '1px solid rgba(0,78,100,0.08)',
                      }}>
                        <p style={{ margin: 0 }}>{m.text}</p>
                        <p style={{
                          margin: '4px 0 0', fontSize: '0.65rem',
                          color: isMe ? 'rgba(255,255,255,0.6)' : '#8FA8B5',
                          textAlign: 'right',
                        }}>
                          {timeAgo(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input envoi */}
            <div style={{
              padding: '0.875rem 1rem',
              background: '#fff',
              borderTop: '1px solid rgba(0,78,100,0.08)',
              display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
            }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyPress={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Écrivez un message..."
                rows={1}
                style={{
                  flex: 1, padding: '0.75rem 1rem',
                  border: '1px solid rgba(0,78,100,0.15)',
                  borderRadius: '20px', resize: 'none',
                  fontFamily: 'inherit', fontSize: '0.875rem',
                  color: '#004E64', outline: 'none',
                  background: '#FFF8F0',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: text.trim()
                    ? 'linear-gradient(135deg, #FF6B35, #E55A28)'
                    : 'rgba(0,78,100,0.08)',
                  border: 'none', cursor: text.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', transition: 'all 0.2s', flexShrink: 0,
                }}
              >
                {sending ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// ==================== MY SERVICES ====================
const MyServicesPage = ({ user, addToast, navigate, T, autoOpenCreate }) => {
  const [services, setServices] = useState([]);
  const [showCreate, setShowCreate] = useState(!!autoOpenCreate);
  const [form, setForm] = useState({title:'',category:'تصميم',description:'',price:'',deliveryDays:3});

  useEffect(() => { if (['freelancer','both','admin'].includes(user?.type)) api.get('/api/services/my/list').then(r=>setServices(r.data)).catch(()=>{}); }, [user]);

  const handleCreate = async () => {
    try { await api.post('/api/services',form); addToast(T.servicePublished,'success'); setShowCreate(false); api.get('/api/services/my/list').then(r=>setServices(r.data)).catch(()=>{}); }
    catch (err) { addToast(err.response?.data?.error||T.error,'error'); }
  };

  if (!user||!['freelancer','both','admin'].includes(user.type)) return <div className="empty-state"><div className="empty-state-icon">💼</div><h3>{T.unauthorized}</h3><p>{T.unauthorizedFreelancer}</p></div>;

  const catOptions = [
    { value:'تصميم',   label: T.catDesign    || 'Design' },
    { value:'برمجة',   label: T.catDev       || 'Développement' },
    { value:'تسويق',   label: T.catMarketing || 'Marketing' },
    { value:'كتابة',   label: T.catWriting   || 'Rédaction' },
    { value:'فيديو',   label: T.catVideo     || 'Vidéo' },
    { value:'صوتيات',  label: T.catAudio     || 'Audio' },
  ];

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
  useEffect(() => { if (['freelancer','both','admin'].includes(user?.type)) api.get('/api/earnings').then(r=>setEarnings(r.data)).catch(()=>{}); }, [user]);

  if (!user||!['freelancer','both','admin'].includes(user.type)) return <div className="empty-state"><div className="empty-state-icon">💰</div><h3>{T.unauthorized}</h3></div>;

  return (
    <div className="animate-fade">
      <h2 style={{fontSize:'clamp(1.5rem,4vw,2rem)',marginBottom:'1.5rem'}}>💰 {T.earningsTitle}</h2>
      <div className="stats-grid" style={{marginTop:0,marginBottom:'2rem'}}>
        <Card style={{border:'2px solid rgba(6,167,125,0.35)',boxShadow:'0 4px 16px rgba(6,167,125,0.10)'}}><div style={{color:'#2D4A5A',fontWeight:600,fontSize:'0.875rem',marginBottom:'0.5rem'}}>{T.availableBalance}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#06A77D'}}>{earnings?.available||'0.00'} π</div><div style={{fontSize:'0.875rem',color:'#06A77D',fontWeight:600}}>↑ {T.readyWithdraw}</div></Card>
        <Card style={{border:'2px solid rgba(255,209,102,0.45)',boxShadow:'0 4px 16px rgba(255,209,102,0.12)'}}><div style={{color:'#2D4A5A',fontWeight:600,fontSize:'0.875rem',marginBottom:'0.5rem'}}>{T.pendingBalance}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#B8860B'}}>{earnings?.pending||'0.00'} π</div><div style={{fontSize:'0.875rem',color:'#8B6914',fontWeight:600}}>{T.inEscrow}</div></Card>
        <Card style={{border:'2px solid rgba(0,78,100,0.20)',boxShadow:'0 4px 16px rgba(0,78,100,0.08)'}}><div style={{color:'#2D4A5A',fontWeight:600,fontSize:'0.875rem',marginBottom:'0.5rem'}}>{T.totalEarnings}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#004E64'}}>{earnings?.total||'0.00'} π</div></Card>
        <Card style={{border:'2px solid rgba(90,122,138,0.30)',boxShadow:'0 4px 16px rgba(90,122,138,0.08)'}}><div style={{color:'#2D4A5A',fontWeight:600,fontSize:'0.875rem',marginBottom:'0.5rem'}}>{T.feesPaid}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#3D6274'}}>{earnings?.fees||'0.00'} π</div></Card>
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
                  <td style={{color:'#06A77D'}}>+{t.amount} π</td>
                  <td><StatusBadge status={t.status} T={T}/></td>
                </tr>
              ))||<tr><td colSpan={3} style={{textAlign:'center',padding:'2rem',color:'#5A7A8A'}}>{T.noTransactions}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== PROFILE ====================
const ProfilePage = ({ user, T }) => {
  if (!user) return (
    <div className="empty-state">
      <div className="empty-state-icon">👤</div>
      <h3>{T.loginRequired}</h3>
    </div>
  );
  const typeLabel = user.type==='freelancer'?T.freelancerType:user.type==='admin'?T.managerType:user.type==='both'?(T.bothType||'Pionnier'):T.clientType;
  const completionRate = user.sales > 0 ? Math.round((user.completed / user.sales) * 100) : 0;

  return (
    <div className="animate-fade" style={{ padding:'0 0 2rem' }}>
      {/* ── Header profil ── */}
      <div style={{
        margin:'1rem', padding:'1.5rem',
        background:'linear-gradient(145deg,#FFE0CC,#FFE8D0)',
        border:'1.5px solid rgba(255,107,53,0.25)', borderRadius:'24px',
        display:'flex', alignItems:'center', gap:'1.25rem',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute',top:'-30px',right:'-30px',width:'120px',height:'120px',background:'radial-gradient(circle,rgba(255,107,53,0.15) 0%,transparent 70%)',borderRadius:'50%' }} />
        <div style={{
          width:'72px', height:'72px', borderRadius:'50%',
          background:'linear-gradient(135deg,#FF6B35,#FF9A6C)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'2rem', fontWeight:800, color:'#fff', flexShrink:0,
          boxShadow:'0 8px 24px rgba(255,107,53,0.30)',
        }}>
          {user.avatar || user.username?.[0]?.toUpperCase() || '👤'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <h2 style={{ fontFamily:"'Syne','Montserrat',sans-serif", fontWeight:800, fontSize:'1.25rem', color:'var(--text-heading)', margin:'0 0 4px' }}>{user.username}</h2>
          <span style={{ background:'rgba(255,107,53,0.12)', color:'#FF6B35', border:'1px solid rgba(255,107,53,0.25)', padding:'3px 12px', borderRadius:'100px', fontSize:'11px', fontWeight:700 }}>
            {typeLabel}
          </span>
          <div style={{ display:'flex', gap:'2px', color:'#F59E0B', fontSize:'1rem', marginTop:'6px' }}>
            {'★'.repeat(Math.floor(user.rating||0))}{'☆'.repeat(5-Math.floor(user.rating||0))}
            <span style={{ color:'var(--text-muted)', fontSize:'0.75rem', marginRight:'6px' }}>{user.reviews||0} avis</span>
          </div>
        </div>
        {/* Balance */}
        <div style={{ textAlign:'center', flexShrink:0 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:'var(--text-heading)' }}>
            <span style={{ color:'#FF6B35' }}>π</span> {user.balance||0}
          </div>
          <div style={{ color:'var(--text-muted)', fontSize:'10px', fontWeight:600 }}>BALANCE</div>
        </div>
      </div>

      {/* ── Stats Bento ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.6rem', margin:'0 1rem 1rem' }}>
        {[
          { label: T.servicesSold||'Services vendus', value: user.sales||0, color:'#FF6B35' },
          { label: T.ordersCompleted||'Complétés', value: user.completed||0, color:'#10B981' },
          { label: T.completionRate||'Taux', value: `${completionRate}%`, color:'#F59E0B' },
        ].map((s,i) => (
          <div key={i} style={{ background:'var(--bg-surface)', border:'1px solid var(--border-light)', borderRadius:'16px', padding:'0.875rem 0.5rem', textAlign:'center' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.25rem', color:s.color }}>{s.value}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'0.6rem', fontWeight:600, marginTop:'2px', lineHeight:1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Infos ── */}
      <div style={{ margin:'0 1rem', background:'var(--bg-surface)', border:'1px solid var(--border-light)', borderRadius:'20px', padding:'1.25rem', marginBottom:'1rem' }}>
        <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.95rem', color:'var(--text-heading)', marginBottom:'1rem' }}>{T.infoTitle||'Informations'}</h3>
        <div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={user.username} readOnly/></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={user.email||''} readOnly/></div>
        <div className="form-group" style={{marginBottom:0}}><label className="form-label">{T.accountType||'Type'}</label><input className="form-input" value={typeLabel} readOnly/></div>
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
        <Card><div style={{color:'#5A7A8A',fontSize:'0.875rem'}}>{T.labelUsers}</div><div style={{fontSize:'2rem',fontWeight:800}}>{stats.users||0}</div></Card>
        <Card><div style={{color:'#5A7A8A',fontSize:'0.875rem'}}>{T.labelServices}</div><div style={{fontSize:'2rem',fontWeight:800}}>{stats.services||0}</div></Card>
        <Card><div style={{color:'#5A7A8A',fontSize:'0.875rem'}}>{T.labelActiveOrders}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#FF6B35'}}>{stats.orders||0}</div></Card>
        <Card><div style={{color:'#5A7A8A',fontSize:'0.875rem'}}>{T.labelDisputes}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#D62246'}}>{stats.disputes||0}</div></Card>
        <Card><div style={{color:'#5A7A8A',fontSize:'0.875rem'}}>{T.labelFees}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#06A77D'}}>{stats.fees||0} π</div></Card>
        <Card><div style={{color:'#5A7A8A',fontSize:'0.875rem'}}>{T.labelVolume}</div><div style={{fontSize:'2rem',fontWeight:800,color:'#FFD166'}}>{stats.volume||0} π</div></Card>
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
              <thead><tr><th>{T.colOrder}</th><th>{T.colReason}</th><th>{T.colOpenedBy||'Ouvert par'}</th><th>{T.colDetails||'Détails'}</th><th>{T.colAction}</th></tr></thead>
              <tbody>{disputes.map(d=>(
                <tr key={d._id}>
                  <td>#{d.orderId?._id?.toString().slice(-4)||d.orderId}</td>
                  <td>{d.reason}</td>
                  <td>{d.openedBy?.username||'—'}</td>
                  <td style={{maxWidth:'200px',fontSize:'0.8rem',color:'#8FA8B5'}}>{d.details||'—'}</td>
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

// ==================== ROLE SELECT MODAL (nouvel utilisateur Pi) ====================
// ==================== LOGIN MODAL ====================
const LoginModal = ({ isOpen, onClose, onLogin, onPiLogin, T }) => {
  const [name, setName] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal login-modal" style={{textAlign:'center', background:'var(--bg-surface)', color:'var(--text-heading)', maxWidth:'400px'}}>
        <div className="modal-header">
          <h2 className="modal-title" style={{color:'#FFD166', fontSize:'1.4rem'}}>
            🌟 {T.welcomePioneer || 'Bienvenue Pionnier !'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {!showDemo ? (
          <>
            <p style={{color:'var(--text-muted)', marginBottom:'2rem', fontSize:'0.9rem', lineHeight:1.6}}>
              {T.piLoginDesc || 'Votre nom Pi est détecté automatiquement. Appuyez pour valider votre connexion.'}
            </p>
            <button onClick={onPiLogin} className="btn btn-primary btn-lg"
              style={{width:'100%', marginBottom:'1.25rem',
                background:'linear-gradient(135deg,#7B2FBE,#FF6B35)',
                boxShadow:'0 8px 32px rgba(123,47,190,0.4)', border:'none',
                fontSize:'1.1rem', fontWeight:700, padding:'1rem',
                borderRadius:'16px', letterSpacing:'0.5px'}}>
              <span style={{fontSize:'1.4rem', marginRight:'0.5rem'}}>π</span>
              {T.connectPi || 'Se connecter avec Pi Network'}
            </button>
            <button onClick={()=>setShowDemo(true)}
              style={{background:'none', border:'none', color:'#5A7A8A',
                cursor:'pointer', fontSize:'0.8rem', fontFamily:'inherit',
                textDecoration:'underline'}}>
              {T.continueWithoutPi || 'Continuer en mode démo →'}
            </button>
          </>
        ) : (
          <>
            <div className="form-group" style={{textAlign:'start', marginBottom:'1rem'}}>
              <label className="form-label" style={{color:'var(--text-muted)'}}>
                {T.nameLabel || "Nom d'utilisateur"}
              </label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={e=>setName(e.target.value)}
                placeholder={T.namePlaceholder || 'Votre nom...'}
                onKeyPress={e=>e.key==='Enter'&&name.trim()&&onLogin(name,'both')}
                style={{background:'var(--bg-input)', color:'var(--text-body)',
                  border:'1px solid var(--border-medium)'}}
                autoFocus
              />
            </div>
            <Button
              onClick={()=>name.trim()&&onLogin(name,'both')}
              disabled={!name.trim()}
              style={{width:'100%', marginBottom:'0.75rem',
                background:'linear-gradient(135deg,#004E64,#0077B6)',
                opacity: name.trim() ? 1 : 0.5}}>
              {T.demoLogin || 'Se connecter en démo'}
            </Button>
            <button onClick={()=>setShowDemo(false)}
              style={{background:'none', border:'none', color:'#5A7A8A',
                cursor:'pointer', fontSize:'0.85rem', fontFamily:'inherit'}}>
              ← {T.backBtn || 'Retour'}
            </button>
          </>
        )}
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
      if (!result) return;

      if (result.isNew) {
        // Nouvel utilisateur — inscription automatique avec type 'both'
        const res = await api.post('/api/auth/pi/register', {
          piUserId: result.piUserId,
          username: result.username,
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setShowLogin(false);
        addToast(`🎉 ${T.welcomeMsg} ${res.data.user.username}!`, 'success');
        return;
      }

      // Utilisateur existant — connexion directe
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
      setShowLogin(false);
      addToast(`${T.welcomeMsg} ${result.user.username}!`, 'success');
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
    <div className="app-layout" style={{ flex: 1, flexDirection: 'column' }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Sidebar user={user} currentPath={location.pathname} navigate={navigate} lang={lang} T={T} />
      <main className="main-content main-content-full">
        <Header
          user={user} onLogin={()=>setShowLogin(true)} onLogout={handleLogout}
          onSearch={()=>navigate('/marketplace')} lang={lang} onChangeLang={handleChangeLang} T={T}
          navigate={navigate}
        />
        <Routes>
          <Route path="/" element={<HomePage {...pageProps} user={user}/>} />
          <Route path="/marketplace" element={<MarketplacePage {...pageProps}/>} />
          <Route path="/service/:id" element={<ServiceDetailPage {...pageProps}/>} />
          <Route path="/orders" element={<OrdersPage {...pageProps}/>} />
          <Route path="/order/:id" element={<OrderDetailPage {...pageProps}/>} />
          <Route path="/messages" element={<MessagesPage {...pageProps}/>} />
          <Route path="/my-services" element={<MyServicesPage {...pageProps}/>} />
          <Route path="/new-service" element={<MyServicesPage {...pageProps} autoOpenCreate={true}/>} />
          <Route path="/earnings" element={<EarningsPage {...pageProps}/>} />
          <Route path="/profile" element={<ProfilePage {...pageProps}/>} />
          <Route path="/admin" element={<AdminPage {...pageProps}/>} />
          <Route path="/disputes" element={<DisputesPage {...pageProps}/>} />
          <Route path="/notifications" element={<NotificationsPage {...pageProps}/>} />
        </Routes>
      </main>
      <LoginModal isOpen={showLogin} onClose={()=>setShowLogin(false)} onLogin={handleLogin} onPiLogin={handlePiLogin} T={T}/>

    </div>
    </div>
    </>
  );
}

export default App;
