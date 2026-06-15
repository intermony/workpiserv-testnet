import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Shield, Loader2, Truck, CheckCircle2 } from 'lucide-react';
import { usePiAuth } from '@/hooks/usePiAuth';
import { useLanguage } from '@/i18n';
import type { Order, OrderStatus } from '@/types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api.onrender.com';

// Order enrichi avec les IDs bruts pour savoir si on est acheteur ou vendeur
type OrderEx = Order & { buyerRawId: string; freelancerRawId: string };

const statusConfig: Record<OrderStatus, { labelKey: string; color: string; bg: string }> = {
  active:          { labelKey: 'orders.status.active',          color: 'text-blue-600',   bg: 'bg-blue-50' },
  pending_payment: { labelKey: 'orders.status.pending_payment', color: 'text-amber-600',  bg: 'bg-amber-50' },
  in_progress:     { labelKey: 'orders.status.in_progress',     color: 'text-purple-600', bg: 'bg-purple-50' },
  delivered:       { labelKey: 'orders.status.delivered',       color: 'text-green-600',  bg: 'bg-green-50' },
  completed:       { labelKey: 'orders.status.completed',       color: 'text-green-600',  bg: 'bg-green-50' },
  cancelled:       { labelKey: 'orders.status.cancelled',       color: 'text-red-600',    bg: 'bg-red-50' },
};

// Tolère les anciens statuts inconnus (ex. "pending" des premières versions)
function getStatusConfig(status: string) {
  return statusConfig[status as OrderStatus]
    ?? { labelKey: status, color: 'text-muted-foreground', bg: 'bg-muted' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOrder(o: any): OrderEx {
  return {
    id           : o._id || o.id || '',
    buyerRawId      : o.buyerId?._id || o.buyerId || '',
    freelancerRawId : o.freelancerId?._id || o.freelancerId || '',
    orderId      : o.orderId || `#${(o._id || o.id || '').slice(-6).toUpperCase()}`,
    serviceId    : o.serviceId?._id || o.serviceId || '',
    serviceTitle : o.serviceId?.title || o.serviceTitle || 'Service',
    serviceImage : o.serviceId?.image || o.serviceImage || '/images/service-default.jpg',
    package      : o.package || 'Standard',
    status       : o.status || 'active',
    price        : o.amount || o.price || 0,
    date         : o.createdAt ? new Date(o.createdAt).toLocaleDateString() : o.date || '',
    freelancer   : {
      id          : o.freelancerId?._id || '',
      name        : o.freelancerId?.username || 'Pioneer',
      username    : o.freelancerId?.username || '',
      avatar      : o.freelancerId?.avatar || '👤',
      title       : 'Freelancer on WorkπServ',
      verified    : false,
      location    : 'Pi Network',
      memberSince : '',
      rating      : o.freelancerId?.rating || 0,
      orders      : 0,
      completion  : '—',
      responseTime: '—',
      yearsExp    : 0,
    },
    timeline     : o.timeline || [],
    milestones   : o.milestones || [],
    deliverables : o.deliverables || [],
  };
}

export default function OrdersPage() {
  const { user } = usePiAuth();
  const { t } = useLanguage();
  const [orders, setOrders]             = useState<OrderEx[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [acting, setActing]             = useState(false);
  const [actionError, setActionError]   = useState<string | null>(null);

  const myId = user?._id || '';

  // Action : livrer (freelance) ou confirmer/libérer les fonds (acheteur)
  const doOrderAction = async (orderId: string, action: 'deliver' | 'complete') => {
    setActing(true);
    setActionError(null);
    try {
      const token = localStorage.getItem('workpiserv_token');
      const res = await fetch(`${API_URL}/api/orders/${orderId}/${action}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      const newStatus: OrderStatus = action === 'deliver' ? 'delivered' : 'completed';
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch {
      setActionError(t('orders.actionFailed'));
    } finally {
      setActing(false);
    }
  };

  useEffect(() => {
    let token: string | null = null;
    try { token = localStorage.getItem('workpiserv_token'); } catch { token = null; }
    fetch(`${API_URL}/api/orders`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { setError(true); return; }
        const raw = Array.isArray(data) ? data : data.orders || [];
        setOrders(raw.map(normalizeOrder));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (activeStatus === 'all') return orders;
    return orders.filter(o => o.status === activeStatus);
  }, [activeStatus, orders]);

  const activeOrder = filtered.find(o => o.id === selectedId) || filtered[0] || null;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={36} className="text-brand animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{t('orders.loading')}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="font-semibold text-foreground mb-2">{t('orders.loadError')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('orders.checkConnection')}</p>
          <Link to="/" className="btn-primary">{t('orders.backHome')}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="section-container py-8">
          <div className="text-sm text-muted-foreground mb-2">
            <Link to="/" className="text-brand hover:underline">{t('nav.home')}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{t('orders.title')}</span>
          </div>
          <h1 className="font-heading font-bold text-3xl text-navy">{t('orders.title')}</h1>

          {/* Status tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
            {(['all', 'active', 'in_progress', 'delivered', 'completed', 'pending_payment', 'cancelled'] as const).map(key => {
              const count = key === 'all' ? orders.length : orders.filter(o => o.status === key).length;
              const labels: Record<string, string> = {
                all: 'orders.status.all', active: 'orders.status.active', in_progress: 'orders.status.in_progress',
                delivered: 'orders.status.delivered', completed: 'orders.status.completed',
                pending_payment: 'orders.status.pending', cancelled: 'orders.status.cancelled',
              };
              return (
                <button
                  key={key}
                  onClick={() => { setActiveStatus(key); setSelectedId(null); }}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeStatus === key ? 'bg-brand-light text-brand' : 'text-muted-foreground hover:bg-background'
                  }`}
                >
                  {t(labels[key])} <span className="opacity-60 text-xs">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="section-container py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">{t('orders.none')}</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{t('orders.noneHint')}</p>
            <Link to="/marketplace" className="btn-primary">{t('orders.browse')}</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* List */}
            <div className="lg:w-[360px] shrink-0 space-y-3">
              {filtered.map(order => {
                const sc = getStatusConfig(order.status);
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={`card-surface p-4 cursor-pointer transition-all ${
                      activeOrder?.id === order.id ? 'border-brand ring-1 ring-brand' : 'card-surface-hover'
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={order.serviceImage}
                        alt={order.serviceTitle}
                        className="w-20 h-14 rounded-lg object-cover shrink-0 bg-muted"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/service-default.jpg'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-navy text-sm line-clamp-1">{order.serviceTitle}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{order.freelancer.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                            {t(sc.labelKey)}
                          </span>
                          <span className="text-sm font-bold text-brand">π {order.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail */}
            {activeOrder && (
              <div className="flex-1 min-w-0 space-y-4">
                <div className="card-surface p-6">
                  <div className="flex gap-4">
                    <img
                      src={activeOrder.serviceImage}
                      alt={activeOrder.serviceTitle}
                      className="w-24 h-16 rounded-lg object-cover shrink-0 bg-muted"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/service-default.jpg'; }}
                    />
                    <div className="flex-1">
                      <h2 className="font-semibold text-navy">{activeOrder.serviceTitle}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{activeOrder.freelancer.name}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{activeOrder.orderId}</span>
                        <span>{activeOrder.date}</span>
                        <span className="bg-brand-light text-brand px-2 py-0.5 rounded-full">{activeOrder.package}</span>
                      </div>
                    </div>
                  </div>

                  {/* Escrow */}
                  <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
                    <Shield size={22} className="text-purple-600 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-purple-700 text-sm">{t('orders.escrowTitle')}</p>
                      <p className="text-xs text-muted-foreground">{t('orders.escrowBody').replace('{n}', String(activeOrder.price))}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusConfig(activeOrder.status).bg} ${getStatusConfig(activeOrder.status).color}`}>
                      {t(getStatusConfig(activeOrder.status).labelKey)}
                    </span>
                  </div>

                  {/* Actions selon le rôle */}
                  {myId === activeOrder.freelancerRawId &&
                    (activeOrder.status === 'active' || activeOrder.status === 'in_progress') && (
                    <button
                      onClick={() => doOrderAction(activeOrder.id, 'deliver')}
                      disabled={acting}
                      className="btn-primary w-full mt-4 py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {acting ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                      {t('orders.markDelivered')}
                    </button>
                  )}

                  {myId === activeOrder.buyerRawId && activeOrder.status === 'delivered' && (
                    <div className="mt-4">
                      <button
                        onClick={() => doOrderAction(activeOrder.id, 'complete')}
                        disabled={acting}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {acting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {t('orders.confirmRelease').replace('{n}', String(activeOrder.price))}
                      </button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {t('orders.confirmHint')}
                      </p>
                    </div>
                  )}

                  {activeOrder.status === 'completed' && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl py-3">
                      <CheckCircle2 size={16} /> {t('orders.completedBanner')}
                    </div>
                  )}

                  {actionError && (
                    <p className="text-xs text-red-600 text-center mt-2">{actionError}</p>
                  )}
                </div>

                {/* Deliverables */}
                <div className="card-surface p-6">
                  <h3 className="font-semibold text-navy mb-3">{t('orders.deliverables')}</h3>
                  {(activeOrder.deliverables ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {activeOrder.status === 'in_progress'
                        ? t('orders.workInProgress')
                        : t('orders.noDeliverables')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(activeOrder.deliverables ?? []).map((file, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                          <Package size={18} className="text-brand shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-navy truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
