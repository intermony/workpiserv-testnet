import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, MessageCircle, Bell, Search, Menu, X, LogOut, Smartphone, Copy, Check } from 'lucide-react';
import { useIsDesktop, useIsMobile } from '@/hooks/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion';
import { usePiAuth } from '@/hooks/usePiAuth';
import { useLanguage, LanguageSwitcher } from '@/i18n';
import { QRCodeSVG } from 'qrcode.react';

const navItems = [
  { key: 'nav.home',        icon: Home,          href: '/' },
  { key: 'nav.marketplace', icon: ShoppingCart,  href: '/marketplace' },
  { key: 'nav.myOrders',    icon: Package,       href: '/orders' },
  { key: 'nav.messages',    icon: MessageCircle, href: '/messages' },
];

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
  const [copied, setCopied] = useState(false);

  // showChromeModal et setShowChromeModal proviennent maintenant du hook mis à jour
  const { user, loading, error, loggedIn, inPiBrowser, showChromeModal: showPiModal, setShowChromeModal: setShowPiModal, login, logout } = usePiAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileDrawerOpen(false); }, [location.pathname]);

  const handleLoginClick = () => {
    login();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('https://workpiserv.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white border-b border-gray-200 transition-shadow duration-200 ${scrolled ? 'shadow-nav' : ''}`}>
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            {isMobile ? (
              <button onClick={() => setMobileDrawerOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Menu size={24} className="text-navy" />
              </button>
            ) : null}

            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">π</span>
              </div>
              <span className="font-heading font-bold text-lg text-navy">Work<span className="text-brand">π</span>Serv</span>
            </Link>

            {isDesktop && (
              <nav className="flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                  return (
                    <Link key={item.key} to={item.href} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'text-brand bg-brand-light' : 'text-gray-500 hover:text-brand hover:bg-gray-50'}`}>
                      <item.icon size={18} /><span>{t(item.key)}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-2">
              {!isMobile && <LanguageSwitcher />}
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><Search size={20} className="text-gray-500" /></button>
              {loggedIn && user && (
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative hidden sm:block">
                  <Bell size={20} className="text-gray-500" />
                  {user.unreadNotifications > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
                </button>
              )}
              <div className="hidden sm:block">
                {loggedIn && user ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-light rounded-full">
                      <span className="text-sm font-medium text-brand">π {user.balance?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full">
                      <span className="text-sm font-medium text-gray-700">@{user.username}</span>
                    </div>
                    <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <LogOut size={18} className="text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <button onClick={handleLoginClick} className="btn-primary text-sm py-2 px-5">
                    {loading ? t('header.connecting') : t('header.login')}
                  </button>
                )}
              </div>
            </div>
          </div>
          {error && <div className="py-2 px-4 bg-orange-50 text-orange-700 text-sm text-center border-t border-orange-100">{error}</div>}
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="border-t border-gray-100 bg-white overflow-hidden">
              <div className="section-container py-4">
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                  <Search size={20} className="text-gray-400 shrink-0" />
                  <input type="text" placeholder={t('header.search')} className="flex-1 bg-transparent text-lg outline-none placeholder:text-gray-400" autoFocus />
                  <button onClick={() => setSearchOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-50" onClick={() => setMobileDrawerOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'tween', duration: 0.3 }} className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-50 shadow-xl">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center"><span className="text-white font-bold text-sm">π</span></div>
                    <span className="font-heading font-bold text-lg text-navy">Work<span className="text-brand">π</span>Serv</span>
                  </Link>
                  <button onClick={() => setMobileDrawerOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={20} /></button>
                </div>

                <div className="mb-4 flex justify-center">
                  <LanguageSwitcher />
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                    return (
                      <Link key={item.key} to={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'text-brand bg-brand-light' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <item.icon size={20} /><span>{t(item.key)}</span>
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  {loggedIn && user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-navy">@{user.username}</p>
                          <p className="text-sm text-gray-500">{user.type === 'both' ? t('header.both') : user.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-2 py-2 bg-brand-light rounded-xl">
                        <span className="text-sm text-gray-600">{t('header.balance')}</span>
                        <span className="font-bold text-brand">π {user.balance?.toFixed(2) || '0.00'}</span>
                      </div>
                      {(user.newOrders > 0 || user.unreadMessages > 0) && (
                        <div className="flex gap-2">
                          {user.newOrders > 0 && <span className="flex-1 text-center py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-lg">{user.newOrders} {t('header.newOrders')}</span>}
                          {user.unreadMessages > 0 && <span className="flex-1 text-center py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg">{user.unreadMessages} {t('header.messages')}</span>}
                        </div>
                      )}
                      <button onClick={() => { logout(); setMobileDrawerOpen(false); }} className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                        <LogOut size={16} /><span>{t('header.logout')}</span>
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { handleLoginClick(); setMobileDrawerOpen(false); }} className="btn-primary w-full text-center">
                      {loading ? t('header.connecting') : t('header.login')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPiModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-50" onClick={() => setShowPiModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative">
                
                <button onClick={() => setShowPiModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>

                <div className="w-14 h-14 bg-brand rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-2xl">π</span>
                </div>
                
                <h3 className="font-heading font-bold text-lg text-navy mb-1">Ouvrir dans Pi Browser</h3>
                <p className="text-gray-600 text-xs mb-4">{t('pimodal.body')}</p>
                
                {/* 🎯 QR CODE ADDITION LOCAL */}
                <div className="bg-gray-50 p-3 rounded-2xl inline-block mb-4 border border-gray-100">
                  <QRCodeSVG value="https://workpiserv.com" size={140} level="H" includeMargin={true} />
                </div>

                {/* CONSIGNE STRICTE DE SÉCURITÉ */}
                <div className="bg-orange-50 text-orange-800 text-[11px] text-left p-3 rounded-xl space-y-1 mb-4 border border-orange-100/50">
                  <div className="font-semibold flex items-center gap-1">🛡️ Sécurité Pi Network :</div>
                  <div>• Ne partagez <span className="font-bold text-red-600">JAMAIS</span> vos 24 mots.</div>
                  <div>• Connexion sécurisée en un clic via l'application.</div>
                </div>

                <div className="space-y-2">
                  <button onClick={handleCopy} className="flex items-center justify-center gap-2 w-full bg-brand text-white py-2.5 px-4 rounded-full font-medium hover:bg-brand/90 transition-colors text-sm shadow-md">
                    {copied ? <><Check size={16} /> Lien copié !</> : <><Copy size={16} /> Copier le lien du site</>}
                  </button>
                  
                  <div className="flex gap-2 pt-1">
                    <a href={PI_BROWSER_LINKS.android} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 border border-gray-200 text-gray-700 py-2 px-3 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors">
                      <Smartphone size={14} /> Android
                    </a>
                    <a href={PI_BROWSER_LINKS.ios} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 border border-gray-200 text-gray-700 py-2 px-3 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors">
                      <Smartphone size={14} /> iOS
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
