import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, MessageCircle, User } from 'lucide-react';
import { useLanguage } from '@/i18n';

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] md:hidden">
      <div className="flex items-center justify-around h-16 pb-safe">
        {navItems.map((item) => {
          const isActive = item.href === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              to={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-orange-600' : 'text-gray-400'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{t(item.key)}</span>
              {isActive && <span className="w-1 h-1 bg-orange-600 rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
