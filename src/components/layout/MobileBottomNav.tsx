import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, MessageCircle, User } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { useDeliveryNotifications } from '@/hooks/useDeliveryNotifications';

const navItems = [
  { key: 'nav.home',     icon: Home,          href: '/' },
  { key: 'nav.market',   icon: ShoppingCart,  href: '/marketplace' },
  { key: 'nav.orders',   icon: Package,       href: '/orders' },
  { key: 'nav.messages', icon: MessageCircle, href: '/messages' },
  { key: 'nav.profile',  icon: User,          href: '/profile' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { t } = useLanguage();
  // N1 — badge "nouvelle livraison" sur l'onglet Messages
  const { unreadCount } = useDeliveryNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.04)] md:hidden">
      <div className="flex items-center justify-around h-16 pb-safe">
        {navItems.map((item) => {
          const isActive = item.href === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.href);
          // N1 — seul l'onglet Messages porte le badge pour l'instant
          const isMessages = item.key === 'nav.messages';
          const showBadge = isMessages && unreadCount > 0;
          return (
            <Link
              key={item.key}
              to={item.href}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-orange-600' : 'text-muted-foreground'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{t(item.key)}</span>
              {isActive && <span className="w-1 h-1 bg-orange-600 rounded-full" />}
              {/* N1 — badge rouge type Freelancer (cf. capture user), top-right de l'icône */}
              {showBadge && (
                <span
                  aria-label={t('notif.delivery.badgeAria').replace('{n}', String(unreadCount))}
                  className="absolute top-0 right-1 min-w-[18px] h-[18px] px-1 bg-[#E11D48] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-card"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
