import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, Filter, X, LayoutGrid, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { services as mockServices } from '@/data/services';
import { categories } from '@/data/categories';
import { ServiceCard } from '@/components/shared/ServiceCard';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import type { Service } from '@/types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api.onrender.com';

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Best Rating' },
];

const deliveryOptions = [
  { value: 'any', label: 'Any time' },
  { value: '1', label: 'Within 24 hours' },
  { value: '3', label: 'Within 3 days' },
  { value: '7', label: 'Within 7 days' },
  { value: '14', label: 'Within 14 days' },
];

const ratingOptions = [
  { value: 'any', label: 'Any rating' },
  { value: '4.5', label: '4.5 & up' },
  { value: '4.0', label: '4.0 & up' },
  { value: '3.0', label: '3.0 & up' },
];

// Normalise un service venant de l'API backend vers le type Service frontend
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
    deliveryDays: s.deliveryDays || 3,
    image       : s.image || '/images/service-default.jpg',
    escrow      : true,
    description : s.description,
    freelancer  : {
      id          : freelancerId._id || '',
      name        : freelancerId.username || 'Pioneer',
      username    : freelancerId.username || '',
      avatar      : freelancerId.avatar || '👤',
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

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktop = useIsDesktop();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [apiServices, setApiServices] = useState<Service[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  const searchQuery    = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || '';
  const activeSort     = searchParams.get('sort') || 'popular';
  const activeDelivery = searchParams.get('delivery') || 'any';
  const activeRating   = searchParams.get('rating') || 'any';

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set('category', activeCategory);
      if (searchQuery)    params.set('q', searchQuery);
      if (activeSort)     params.set('sort', activeSort);

      const res = await fetch(`${API_URL}/api/services?${params}`);
      if (res.ok) {
        const data = await res.json();
        const raw: unknown[] = Array.isArray(data) ? data : data.services || [];
        if (raw.length > 0) {
          setApiServices(raw.map(normalizeApiService));
          setUsingMock(false);
        } else {
          setApiServices(null);
          setUsingMock(true);
        }
      } else {
        setApiServices(null);
        setUsingMock(true);
      }
    } catch {
      setApiServices(null);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery, activeSort]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const allServices: Service[] = apiServices ?? mockServices;

  const filteredServices = useMemo(() => {
    let result = [...allServices];

    if (usingMock || apiServices === null) {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(s =>
          s.title.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.freelancer.name.toLowerCase().includes(q)
        );
      }
      if (activeCategory) {
        result = result.filter(s => s.category === activeCategory);
      }
    }

    if (activeDelivery !== 'any') {
      const days = parseInt(activeDelivery);
      result = result.filter(s => s.deliveryDays <= days);
    }

    if (activeRating !== 'any') {
      const min = parseFloat(activeRating);
      result = result.filter(s => s.rating >= min);
    }

    if (usingMock || apiServices === null) {
      switch (activeSort) {
        case 'price_asc':  result.sort((a, b) => a.price - b.price); break;
        case 'price_desc': result.sort((a, b) => b.price - a.price); break;
        case 'rating':     result.sort((a, b) => b.rating - a.rating); break;
        default: break;
      }
    }

    return result;
  }, [allServices, searchQuery, activeCategory, activeSort, activeDelivery, activeRating, usingMock, apiServices]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'any') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());
  const hasFilters = activeCategory || activeDelivery !== 'any' || activeRating !== 'any';

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-navy mb-4">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => updateParam('category', '')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              !activeCategory ? 'bg-brand-light text-brand font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid size={18} />
            All Services
            <span className="ml-auto text-xs text-gray-400">{allServices.length}</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => updateParam('category', cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
                activeCategory === cat.id ? 'bg-brand-light text-brand font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="capitalize">{cat.name}</span>
              <span className="ml-auto text-xs text-gray-400">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-navy mb-4">Delivery Time</h3>
        <div className="space-y-2">
          {deliveryOptions.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="delivery"
                value={opt.value}
                checked={activeDelivery === opt.value}
                onChange={(e) => updateParam('delivery', e.target.value)}
                className="w-4 h-4 text-brand border-gray-300 focus:ring-brand"
              />
              <span className="text-sm text-gray-600">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-navy mb-4">Minimum Rating</h3>
        <div className="space-y-2">
          {ratingOptions.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={opt.value}
                checked={activeRating === opt.value}
                onChange={(e) => updateParam('rating', e.target.value)}
                className="w-4 h-4 text-brand border-gray-300 focus:ring-brand"
              />
              <span className="text-sm text-gray-600">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button onClick={clearFilters} className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
          <X size={16} /> Reset All Filters
        </button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen pb-20">
      <div className="bg-white border-b border-gray-200">
        <div className="section-container py-8">
          <ScrollReveal>
            <div className="text-sm text-gray-500 mb-2">
              <Link to="/" className="text-brand hover:underline">Home</Link>
              <span className="mx-2">/</span>
              <span>Marketplace</span>
            </div>
            <h1 className="font-heading font-bold text-3xl text-navy">Browse Services</h1>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="mt-6 max-w-2xl">
              <div className="flex">
                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services, freelancers..."
                    value={searchQuery}
                    onChange={(e) => updateParam('q', e.target.value)}
                    className="w-full h-[52px] pl-12 pr-4 border border-gray-200 rounded-l-full text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>
                <button className="btn-primary rounded-l-none rounded-r-full h-[52px] px-7">
                  Search
                </button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => updateParam('category', '')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !activeCategory ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => updateParam('category', activeCategory === cat.id ? '' : cat.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                    activeCategory === cat.id ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {usingMock && !loading && (
        <div className="section-container pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700 flex items-center justify-between">
            <span>Showing demo services — real services will appear once published.</span>
            <button onClick={fetchServices} className="underline text-xs ml-4 shrink-0">Retry</button>
          </div>
        </div>
      )}

      <div className="section-container py-8">
        <div className="flex gap-8">
          {isDesktop && (
            <aside className="w-[260px] shrink-0">
              <div className="sticky top-24 card-surface p-5">
                <FilterSidebar />
              </div>
            </aside>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {loading
                  ? 'Loading services...'
                  : `Showing ${filteredServices.length} of ${allServices.length} services`}
              </p>
              <div className="flex items-center gap-2 relative">
                {!isDesktop && (
                  <button
                    onClick={() => setMobileFilterOpen(true)}
                    className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                  >
                    <Filter size={16} /> Filters
                  </button>
                )}
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy transition-colors bg-white border border-gray-200 rounded-lg px-4 py-2"
                >
                  {sortOptions.find(o => o.value === activeSort)?.label}
                  <ChevronDown size={16} />
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-20 min-w-[180px]"
                    >
                      {sortOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { updateParam('sort', opt.value); setSortOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            activeSort === opt.value ? 'text-brand font-medium' : 'text-gray-600'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <Loader2 size={36} className="text-brand animate-spin mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Loading services...</p>
                </div>
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredServices.map((service, index) => (
                  <ServiceCard key={service.id} service={service} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Search size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700">No services found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
                <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setMobileFilterOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: '20%' }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-6 overflow-y-auto"
              style={{ maxHeight: '80vh' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-navy text-lg">Filters</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>
              <FilterSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
