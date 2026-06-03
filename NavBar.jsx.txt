// ============================================================
// src/components/NavBar.jsx — VERSION COMPLÈTE MISE À JOUR
// WorkPiServ — RTL / Arabe / Pi Browser
// Inclut : badges compteurs, reset, admin guard, wallet badge
// ============================================================
import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCounters, IconWithBadge } from './BadgeCounter';
import { notify } from './NotificationSystem';

// ── Icônes SVG ──
const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const MessageIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const OrderIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const WalletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5z"/>
    <circle cx="17" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);
const AdminIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

// ════════════════════════════════════════════════════════════
export default function NavBar({ user, token, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { counters, resetCounter } = useCounters(token);

  // ── Notifier le rôle UNE SEULE FOIS par session ──
  useEffect(() => {
    if (!user?.role || !user?.username) return;
    const key = `role_notified_${user.id || user.username}`;
    if (!sessionStorage.getItem(key)) {
      const timer = setTimeout(() => {
        notify.role(user.role, user.username);
        sessionStorage.setItem(key, '1');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [user]);

  function handleLogout() {
    onLogout?.();
    navigate('/login');
    setMenuOpen(false);
  }

  // ── Styles ──
  const nav = {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(15,23,42,0.92)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '0 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: '60px', direction: 'rtl',
  };
  const logo = {
    fontWeight: 800, fontSize: '18px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    textDecoration: 'none', letterSpacing: '-0.5px',
  };
  const iconRow = { display: 'flex', alignItems: 'center', gap: '4px' };
  const mobileMenu = {
    position: 'fixed', top: '60px', right: 0, left: 0, bottom: 0,
    background: 'rgba(10,18,36,0.97)',
    backdropFilter: 'blur(20px)',
    padding: '24px 20px',
    display: menuOpen ? 'flex' : 'none',
    flexDirection: 'column', gap: '8px',
    direction: 'rtl', zIndex: 99,
    overflowY: 'auto',
  };
  const menuLink = {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px', borderRadius: '12px',
    color: '#e2e8f0', textDecoration: 'none', fontSize: '15px', fontWeight: 500,
    transition: 'background 0.2s',
  };
  const adminMenuLink = {
    ...menuLink,
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.20)',
    color: '#fca5a5',
  };
  const divider = { height: '1px', background: 'rgba(255,255,255,0.08)', margin: '8px 0' };

  // ── Total badges pour le bouton menu mobile ──
  const totalBadge = counters.notifications + counters.messages + (user?.role === 'freelancer' ? counters.orders : 0);

  return (
    <>
      <nav style={nav}>
        {/* Logo */}
        <Link to="/" style={logo}>WorkPiServ</Link>

        {/* Icônes bureau */}
        <div style={iconRow}>
          {/* Notifications */}
          <IconWithBadge
            icon={<BellIcon />}
            count={counters.notifications}
            onReset={() => resetCounter('notifications')}
            label="الإشعارات"
            badgeColor="#ef4444"
          />

          {/* Messages */}
          <IconWithBadge
            icon={<MessageIcon />}
            count={counters.messages}
            onReset={() => resetCounter('messages')}
            label="الرسائل"
            badgeColor="#6366f1"
          />

          {/* Commandes — freelancers uniquement */}
          {user?.role === 'freelancer' && (
            <IconWithBadge
              icon={<OrderIcon />}
              count={counters.orders}
              onReset={() => resetCounter('orders')}
              label="الطلبات"
              badgeColor="#f59e0b"
            />
          )}

          {/* Wallet Pi — visible Pi Browser uniquement */}
          <IconWithBadge
            icon={<WalletIcon />}
            count={0}
            onReset={null}
            label="محفظة Pi"
            badgeColor="#f59e0b"
          />

          {/* Bouton menu burger (mobile) */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              position: 'relative', background: 'none', border: 'none',
              cursor: 'pointer', padding: '8px', color: '#e2e8f0', borderRadius: '10px'
            }}
            aria-label="القائمة"
          >
            <MenuIcon />
            {totalBadge > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                background: '#ef4444', color: '#fff', borderRadius: '50%',
                width: '16px', height: '16px', fontSize: '10px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(10,18,36,0.97)',
              }}>
                {totalBadge > 9 ? '9+' : totalBadge}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── Menu mobile ── */}
      <div style={mobileMenu} onClick={() => setMenuOpen(false)}>

        {/* Profil utilisateur */}
        {user && (
          <div style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: '14px',
            padding: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#f1f5f9', fontSize: '14px' }}>
                {user.username}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {user.role === 'freelancer' ? '👨‍💻 مستقل' :
                 user.role === 'admin'      ? '🛡️ مدير'   :
                                             '🛍️ عميل'}
              </p>
            </div>
          </div>
        )}

        <div style={divider} />

        {/* Liens communs */}
        <Link to="/"        style={menuLink} onClick={() => setMenuOpen(false)}>🏠 الرئيسية</Link>
        <Link to="/services" style={menuLink} onClick={() => setMenuOpen(false)}>🔍 الخدمات</Link>

        {/* Liens freelancer */}
        {user?.role === 'freelancer' && (
          <>
            <Link to="/dashboard" style={menuLink} onClick={() => setMenuOpen(false)}>
              📊 لوحة التحكم
              {counters.orders > 0 && (
                <span style={{ marginRight: 'auto', background: '#f59e0b', color: '#000', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                  {counters.orders}
                </span>
              )}
            </Link>
            <Link to="/my-services" style={menuLink} onClick={() => setMenuOpen(false)}>🛠️ خدماتي</Link>
            <Link to="/orders" style={menuLink} onClick={() => setMenuOpen(false)}>
              📦 الطلبات
              {counters.orders > 0 && (
                <span style={{ marginRight: 'auto', background: '#f59e0b', color: '#000', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                  {counters.orders}
                </span>
              )}
            </Link>
          </>
        )}

        {/* Liens client */}
        {user?.role === 'client' && (
          <Link to="/my-orders" style={menuLink} onClick={() => setMenuOpen(false)}>📦 طلباتي</Link>
        )}

        {/* Messages & Notifications */}
        <Link to="/messages" style={menuLink} onClick={() => { setMenuOpen(false); resetCounter('messages'); }}>
          💬 الرسائل
          {counters.messages > 0 && (
            <span style={{ marginRight: 'auto', background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
              {counters.messages}
            </span>
          )}
        </Link>
        <Link to="/notifications" style={menuLink} onClick={() => { setMenuOpen(false); resetCounter('notifications'); }}>
          🔔 الإشعارات
          {counters.notifications > 0 && (
            <span style={{ marginRight: 'auto', background: '#ef4444', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
              {counters.notifications}
            </span>
          )}
        </Link>

        {/* Wallet */}
        <Link to="/profile" style={menuLink} onClick={() => setMenuOpen(false)}>
          🔑 محفظة Pi
        </Link>

        <div style={divider} />

        {/* Profil */}
        <Link to="/profile" style={menuLink} onClick={() => setMenuOpen(false)}>👤 الملف الشخصي</Link>

        {/* ── ADMIN GUARD : visible SEULEMENT si role === 'admin' ── */}
        {user?.role === 'admin' && (
          <>
            <div style={divider} />
            <Link to="/admin" style={adminMenuLink} onClick={() => setMenuOpen(false)}>
              <AdminIcon />
              لوحة الإدارة
              <span style={{ marginRight: 'auto', fontSize: '10px', color: '#f87171', opacity: 0.8 }}>ADMIN</span>
            </Link>
          </>
        )}

        <div style={divider} />

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          style={{
            ...menuLink, background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#fca5a5', cursor: 'pointer', width: '100%', textAlign: 'right',
            fontFamily: 'inherit',
          }}
        >
          🚪 تسجيل الخروج
        </button>
      </div>
    </>
  );
}
