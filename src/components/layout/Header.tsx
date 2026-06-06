import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, MessageCircle, Bell, Search, Menu, X, LogOut, User, Smartphone } from 'lucide-react';
import { useIsDesktop, useIsMobile } from '@/hooks/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion';
import { usePiAuth } from '@/hooks/usePiAuth';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Marketplace', icon: ShoppingCart, href: '/marketplace' },
  { label: 'My Orders', icon: Package, href: '/orders' },
  { label: 'Messages', icon: MessageCircle, href: '#' },
];

// Pi Browser download links
const PI_BROWSER_LINKS = {
  android: 'https://play.google.com/store/apps/details?id=com.blockchainvault',
  ios: 'https://apps.apple.com/us/app/pi-network/id1445472541',
};

export function Header() {
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showPiModal, setShowPiModal] = useState(false);

  const { user, loading, error, loggedIn, inPiBrowser, login, logout } = usePiAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Show Pi Browser modal instead of error for non-Pi browser users
  const handleLoginClick = () => {
    if (!inPiBrowser) {
      setShowPiModal(true);
      return;
    }
    login();
  };

  const LoginButton = ({ className = '' }: { className?: string }) => {
    if (loading) {
      return (
        <button disabled className={`btn-primary text-sm py-2 px-5 opacity-70 ${className}`}>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Connecting...
          </span>
        </button>
      );
    }

    if (loggedIn && user) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-light rounded-full">
            <User size={14} className="text-brand" />
            <span className="text-sm font-medium text-brand">@{user.username}</span>
          </div>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Logout">
            <LogOut size={18} className="text-gray-500" />
          </button>
        </div>
      );
    }

    return (
      <button onClick={handleLoginClick} className={`btn-primary text-sm py-2 px-5 ${className}`}>
        Login with π
      </button>
    );
  };

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white border-b border-gray-200 transition-shadow duration-200 ${scrolled ? 'shadow-nav' : ''}`}>
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            {isMobile ? (
              <button onClick={() => setMobileDrawerOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Open menu">
                <Menu size={24} className="text-navy" />
              </button>
            ) : null}

            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">π</span>
              </div>
              <span className="font-heading font-bold text-lg text-navy">
                Work<span className="text-brand">π</span>Serv
              </span>
            </Link>

            {isDesktop && (
              <nav className="flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                  return (
                    <Link key={item.label} to={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive ? 'text-brand bg-brand-light' : 'text-gray-500 hover:text-brand hover:bg-gray-50'
                      }`}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-2">
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Search">
                <Search size={20} className="text-gray-500" />
              </button>
              {loggedIn && (
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative hidden sm:block" aria-label="Notifications">
                  <Bell size={20} className="text-gray-500" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>
              )}
              <div className="hidden sm:block">
                <LoginButton />
              </div>
            </div>
          </div>

          {error && (
            <div className="py-2 px-4 bg-orange-50 text-orange-700 text-sm text-center border-t border-orange-100">
              {error}
            </div>
          )}
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="border-t border-gray-100 bg-white overflow-hidden">
              <div className="section-container py-4">
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                  <Search size={20} className="text-gray-400 shrink-0" />
                  <input type="text" placeholder="Search services, freelancers..." className="flex-1 bg-transparent text-lg outline-none placeholder:text-gray-400" autoFocus />
                  <button onClick={() => setSearchOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => setMobileDrawerOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'tween', duration: 0.3 }} className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-50 shadow-xl">
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">π</span>
                    </div>
                    <span className="font-heading font-bold text-lg text-navy">Work<span className="text-brand">π</span>Serv</span>
                  </Link>
                  <button onClick={() => setMobileDrawerOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={20} /></button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                    return (
                      <Link key={item.label} to={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'text-brand bg-brand-light' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <LoginButton className="w-full text-center" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pi Browser Modal */}
      <AnimatePresence>
        {showPiModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-50" onClick={() => setShowPiModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                {/* Pi Logo */}
                <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-3xl">π</span>
                </div>

                <h3 className="font-heading font-bold text-xl text-navy mb-2">
                  Open in Pi Browser
                </h3>

                {/* 3 languages */}
                <div className="space-y-2 mb-6">
                  <p className="text-gray-600 text-sm">
                    Open WorkPiServ in the Pi Browser to login and make real transactions.
                  </p>
                  <p className="text-gray-500 text-sm">
                    Ouvrez WorkPiServ dans Pi Browser pour vous connecter et effectuer de vraies transactions.
                  </p>
                  <p className="text-gray-500 text-sm" dir="rtl">
                    افتح WorkPiServ في Pi Browser لتسجيل الدخول والمعاملات الحقيقية.
                  </p>
                </div>

                {/* Download buttons */}
                <div className="space-y-3">
                  <a href={PI_BROWSER_LINKS.android} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-navy text-white py-3 px-4 rounded-full font-medium hover:bg-navy/90 transition-colors">
                    <Smartphone size={18} />
                    Download Pi Browser — Android
                  </a>
                  <a href={PI_BROWSER_LINKS.ios} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full border-2 border-navy text-navy py-3 px-4 rounded-full font-medium hover:bg-gray-50 transition-colors">
                    <Smartphone size={18} />
                    Download Pi Browser — iOS
                  </a>
                </div>

                <button onClick={() => setShowPiModal(false)} className="mt-4 text-gray-400 text-sm hover:text-gray-600 transition-colors">
                  Continue browsing in demo mode
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
