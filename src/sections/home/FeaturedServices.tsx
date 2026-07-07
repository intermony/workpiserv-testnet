import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { ServiceCard } from '@/components/shared/ServiceCard';
import type { Service } from '@/types';
import { useLanguage } from '@/i18n';

import { API_BASE_URL as API_URL } from '@/config/network';
// Même mapper API → Service que MarketplacePage (cohérence garantie).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeApiService(s: any): Service {
  const freelancerId = s.freelancerId || {};
  return {
    id          : s._id || s.id,
    title       : s.title,
    category    : s.category,
    rating      : s.rating || 0,
    reviewCount : s.reviews || 0,
    price       : s.price,
    priceCurrency: s.priceCurrency || 'PI',
    deliveryDays: s.deliveryDays || 3,
    image       : s.image || '/images/service-default.jpg',
    escrow      : true,
    description : s.description,
    freelancer  : {
      id          : freelancerId._id || '',
      name        : freelancerId.username || 'Pioneer',
      username    : freelancerId.username || '',
      avatar      : freelancerId.avatar || '',
      title       : 'Freelancer on WorkπServ',
      verified    : false,
      location    : 'Pi Network',
      memberSince : '',
      rating      : freelancerId.rating || 0,
      orders      : 0,
      completion  : '—',
      responseTime: '—',
      yearsExp    : 0,
    },
  };
}

export function FeaturedServices() {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // L'API renvoie les plus récents ; on remonte ensuite les mieux notés.
        const res = await fetch(`${API_URL}/api/services?sort=newest`);
        if (res.ok) {
          const data = await res.json();
          const raw: unknown[] = Array.isArray(data) ? data : data.services || [];
          // Tri par note décroissante ; à note égale, l'ordre récent est conservé
          // (Array.sort est stable) → la section n'est jamais vide tant qu'il y a des services.
          const ranked = raw.map(normalizeApiService).sort((a, b) => b.rating - a.rating);
          if (active) setServices(ranked.slice(0, 4));
        }
      } catch { /* silencieux */ }
    })();
    return () => { active = false; };
  }, []);

  // Ne jamais afficher une section "vedette" vide avec son titre
  if (services.length === 0) return null;

  return (
    <section className="py-16 lg:py-24">
      <div className="section-container">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading font-bold text-2xl lg:text-3xl text-navy">
              {t('home.featured')}
            </h2>
            <Link
              to="/marketplace"
              className="text-sm font-medium text-brand hover:underline flex items-center gap-1"
            >
              {t('home.viewAll')} <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
