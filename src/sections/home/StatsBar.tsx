import { useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { useLanguage } from '@/i18n';

import { API_BASE_URL as API_URL, apiHeaders } from '@/config/network';
interface Stats {
  services: number;
  freelancers: number;
  transactions: number;
}

export function StatsBar() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({ services: 0, freelancers: 0, transactions: 0 });

  useEffect(() => {
    fetch(`${API_URL}/api/stats`, { headers: apiHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setStats(data);
      })
      .catch(() => {/* silently keep 0s */});
  }, []);

  const items = [
    { value: stats.services,     suffix: '+', label: 'home.statServices' },
    { value: stats.freelancers,  suffix: '+', label: 'home.statFreelancers' },
    { value: stats.transactions, suffix: '+', label: 'home.statTransactions' },
  ];

  return (
    <section className="py-6">
      <div className="section-container">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {items.map((stat, index) => (
            <ScrollReveal key={stat.label} delay={index * 0.1}>
              <div className="card-surface p-6 text-center">
                <div className="text-3xl font-bold text-brand font-heading">
                  <CountUp end={stat.value} duration={1.5} separator="," suffix={stat.suffix} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground uppercase tracking-wider font-medium">
                  {t(stat.label)}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
