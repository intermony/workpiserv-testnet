import { Shield, Globe, Zap } from 'lucide-react';

// Use navigate function instead of Link for Pi Browser compatibility
const navigate = (href: string) => {
  window.location.href = href;
};

const platformLinks = [
  { label: 'Browse Services', href: '/marketplace' },
  { label: 'How It Works', href: '/' },
  { label: 'Escrow System', href: '/safety' },
  { label: 'Pricing', href: '/help' },
];

const supportLinks = [
  { label: 'Help Center', href: '/help' },
  { label: 'Safety & Trust', href: '/safety' },
  { label: 'Report an Issue', href: '/report' },
  { label: 'Contact Us', href: '/contact' },
];

const communityLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Become a Freelancer', href: '/marketplace' },
  { label: 'Affiliate Program', href: '/affiliate' },
];

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="section-container py-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-brand font-bold text-sm">π</span>
              </div>
              <span className="font-heading font-bold text-lg text-white">
                Work<span className="text-brand">π</span>Serv
              </span>
            </button>
            <p className="text-sm text-gray-400 leading-relaxed">
              The first Arabic & global secure freelance platform powered by Pi Network. Connecting talent with opportunity through our smart Escrow system.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <Shield size={16} className="text-gray-400" />
              <Globe size={16} className="text-gray-400" />
              <Zap size={16} className="text-gray-400" />
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Platform</h4>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <button onClick={() => navigate(link.href)} className="text-sm text-gray-400 hover:text-white transition-colors text-left">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <button onClick={() => navigate(link.href)} className="text-sm text-gray-400 hover:text-white transition-colors text-left">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Community</h4>
            <ul className="space-y-3">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <button onClick={() => navigate(link.href)} className="text-sm text-gray-400 hover:text-white transition-colors text-left">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; 2026 WorkπServ. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/privacy')} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</button>
            <button onClick={() => navigate('/terms')} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Terms of Service</button>
            <button onClick={() => navigate('/cookies')} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Cookies</button>
          </div>
        </div>
      </div>
    </footer>
  );
          }
          
