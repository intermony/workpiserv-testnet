import { Shield, Globe, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n';

const platformLinks = [
  { label: 'market.title', href: '/marketplace' },
  { label: 'home.howTitle', href: '/' },
  { label: 'footer.escrowSystem', href: '/safety' },
  { label: 'footer.pricing', href: '/help' },
];

const supportLinks = [
  { label: 'footer.helpCenter', href: '/help' },
  { label: 'footer.safetyTrust', href: '/safety' },
  { label: 'footer.reportIssue', href: '/report' },
  { label: 'footer.contactUs', href: '/contact' },
];

const communityLinks = [
  { label: 'footer.aboutUs', href: '/about' },
  { label: 'footer.blog', href: '/blog' },
  { label: 'footer.becomeFreelancer', href: '/marketplace' },
  { label: 'footer.affiliate', href: '/affiliate' },
];

export function Footer() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <footer className="bg-[#100D26] text-white">
      <div className="section-container py-16 pb-24 md:pb-8">
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
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <Shield size={16} className="text-muted-foreground" />
              <Globe size={16} className="text-muted-foreground" />
              <Zap size={16} className="text-muted-foreground" />
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">{t('footer.platform')}</h4>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <button onClick={() => navigate(link.href)} className="text-sm text-muted-foreground hover:text-white transition-colors text-left">
                    {t(link.label)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">{t('footer.support')}</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <button onClick={() => navigate(link.href)} className="text-sm text-muted-foreground hover:text-white transition-colors text-left">
                    {t(link.label)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">{t('footer.community')}</h4>
            <ul className="space-y-3">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <button onClick={() => navigate(link.href)} className="text-sm text-muted-foreground hover:text-white transition-colors text-left">
                    {t(link.label)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 WorkπServ. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-5">
            <button onClick={() => navigate('/privacy')} className="text-sm text-muted-foreground hover:text-white transition-colors py-1">{t('footer.privacy')}</button>
            <button onClick={() => navigate('/terms')} className="text-sm text-muted-foreground hover:text-white transition-colors py-1">{t('footer.terms')}</button>
            <button onClick={() => navigate('/cookies')} className="text-sm text-muted-foreground hover:text-white transition-colors py-1">{t('footer.cookies')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
