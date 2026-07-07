import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Palette, Code, Megaphone, Pen, Clapperboard, Mic } from 'lucide-react';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { categories } from '@/data/categories';
import { useLanguage } from '@/i18n';

import { API_BASE_URL as API_URL } from '@/config/network';
const iconMap: Record<string, React.ElementType> = {
  Palette, Code, Megaphone, Pen, Clapperboard, Mic,
};

export function CategoriesSection() {
  const { t } = useLanguage();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/services`);
        if (res.ok) {
          const data = await res.json();
          const raw = (Array.isArray(data) ? data : data.services || []) as Array<{ category?: string }>;
          // Même logique de comptage que MarketplacePage : clé = valeur exacte de category
          const c: Record<string, number> = {};
          for (const s of raw) {
            if (s && s.category) c[s.category] = (c[s.category] || 0) + 1;
          }
          if (active) setCounts(c);
        }
      } catch { /* silencieux */ }
    })();
    return () => { active = false; };
  }, []);

  return (
    <section className="py-16 lg:py-24">
      <div className="section-container">
        {/* Header */}
        <ScrollReveal>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading font-bold text-2xl lg:text-3xl text-navy">
              {t('home.popularCategories')}
            </h2>
            <Link
              to="/marketplace"
              className="text-sm font-medium text-brand hover:underline flex items-center gap-1"
            >
              {t('home.viewAll')} <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((cat, index) => {
            const Icon = iconMap[cat.icon] || Palette;
            return (
              <ScrollReveal key={cat.id} delay={index * 0.08}>
                <Link
                  to={`/marketplace?category=${cat.id}`}
                  className="card-surface-hover p-5 block group"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-subtle flex items-center justify-center mb-3 group-hover:bg-brand-light transition-colors">
                    <Icon size={24} className="text-brand" />
                  </div>
                  <h3 className="font-semibold text-navy group-hover:text-brand transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{counts[cat.id] || 0} {t('home.servicesWord')}</p>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
