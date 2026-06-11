import { Search, ShoppingCart, Package, CheckCircle } from 'lucide-react';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { useLanguage } from '@/i18n';

const steps = [
  { number: '1', icon: Search, title: 'home.step1Title', description: 'home.step1Desc' },
  { number: '2', icon: ShoppingCart, title: 'home.step2Title', description: 'home.step2Desc' },
  { number: '3', icon: Package, title: 'home.step3Title', description: 'home.step3Desc' },
  { number: '4', icon: CheckCircle, title: 'home.step4Title', description: 'home.step4Desc' },
];

export function HowItWorks() {
  const { t } = useLanguage();
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="section-container">
        <ScrollReveal>
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="font-heading font-bold text-2xl lg:text-3xl text-navy">
              {t('home.howTitle')}
            </h2>
            <p className="mt-3 text-gray-500 text-lg">
              {t('home.howSub')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line - desktop only */}
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 border-t-2 border-dashed border-gray-200" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.number} delay={index * 0.12}>
                <div className="text-center relative">
                  {/* Number */}
                  <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center mx-auto relative z-10">
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>
                  {/* Icon */}
                  <div className="mt-4">
                    <Icon size={28} className="text-brand mx-auto" />
                  </div>
                  <h3 className="mt-4 font-semibold text-navy text-lg">{t(step.title)}</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-[240px] mx-auto">
                    {t(step.description)}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
