import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n';

export function HeroSection() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1B1640] via-[#161236] to-[#13112E] rounded-b-[32px]">
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-brand/8 rounded-full blur-[80px]" />
      <div className="absolute bottom-10 right-10 w-[250px] h-[250px] bg-escrow/6 rounded-full blur-[80px]" />

      <motion.div
        className="absolute right-[10%] top-[20%] hidden lg:block"
        animate={{ y: [-8, 8] }}
        transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      >
        <span className="text-[200px] font-heading font-bold text-brand/10 select-none">π</span>
      </motion.div>

      <div className="section-container relative z-10 py-20 lg:py-32">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-dot" />
              {t('home.badge')}
            </span>
          </motion.div>

          <motion.h1
            className="font-heading font-bold text-4xl lg:text-5xl text-navy leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {t('home.heroTitle1')}{' '}
            <span className="text-brand">{t('home.heroTitle2')}</span>
          </motion.h1>

          <motion.p
            className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            {t('home.heroSub')}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link to="/marketplace" className="btn-primary inline-flex items-center justify-center gap-2 text-base py-3.5 px-7">
              {t('home.explore')}
              <ArrowRight size={18} />
            </Link>
            <Link to="/create-service" className="btn-secondary inline-flex items-center justify-center text-base py-3.5 px-7">
              {t('home.join')}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
