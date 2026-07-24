import { HeroSection } from '@/sections/home/HeroSection';
import { StatsBar } from '@/sections/home/StatsBar';
import { CategoriesSection } from '@/sections/home/CategoriesSection';
import { FeaturedServices } from '@/sections/home/FeaturedServices';
import { HowItWorks } from '@/sections/home/HowItWorks';
import { FreelancerCTA } from '@/sections/home/FreelancerCTA';
import { TestnetBadge } from '@/components/shared/TestnetBadge';
import { BookOpen, Newspaper } from 'lucide-react';

export default function HomePage() {
  return (
    <main>
      <TestnetBadge />

      {/* ── Resource quick-links ── */}
      <div className="flex items-center justify-center gap-3 px-4 pt-5 pb-1">
        <a
          href="/guide.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-brand bg-brand/5 text-brand text-sm font-bold hover:bg-brand hover:text-white transition-all duration-200"
        >
          <BookOpen size={15} />
          Guide
        </a>
        <a
          href="/poster-workpiserv.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-border text-muted-foreground text-sm font-bold hover:border-brand hover:text-brand transition-all duration-200"
        >
          <Newspaper size={15} />
          Affiche
        </a>
      </div>

      <HeroSection />
      <StatsBar />
      <CategoriesSection />
      <FeaturedServices />
      <HowItWorks />
      <FreelancerCTA />
    </main>
  );
}
