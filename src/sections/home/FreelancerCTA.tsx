import { Link } from 'react-router-dom';
import { ShieldCheck, Globe, Zap } from 'lucide-react';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n';

export function FreelancerCTA() {
  const { t } = useLanguage();
  return (
    <section className="py-16 lg:py-24">
      <div className="section-container">
        <ScrollReveal>
          <div className="relative overflow-hidden bg-gradient-to-br from-brand to-[#FF9466] rounded-3xl px-8 py-12 lg:px-16 lg:py-16 text-center">
            <motion.span
              className="absolute -bottom-6 -right-6 text-[150px] font-heading font-bold text-white/10 select-none"
              animate={{ y: [-4, 4] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            >
              π
            </motion.span>

            <h2 className="font-heading font-bold text-2xl lg:text-3xl text-white relative z-10">
              {t('home.ctaTitle')}
            </h2>
            <p className="mt-4 text-white/85 max-w-lg mx-auto relative z-10 text-lg">
              {t('home.ctaSub')}
            </p>

            <Link
              to="/create-service"
              className="mt-6 inline-flex items-center gap-2 border-2 border-white text-white font-medium px-7 py-3.5 rounded-full hover:bg-white hover:text-brand transition-all duration-200 relative z-10"
            >
              {t('home.ctaButton')}
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 relative z-10">
              <div className="flex items-center gap-2 text-white/80">
                <ShieldCheck size={16} />
                <span className="text-xs font-medium">{t('home.ctaSecure')}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Globe size={16} />
                <span className="text-xs font-medium">{t('home.ctaGlobal')}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Zap size={16} />
                <span className="text-xs font-medium">{t('home.ctaInstant')}</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
