import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Shield, Loader2, Truck, CheckCircle2, AlertTriangle, RotateCcw, Ban } from 'lucide-react';
import { usePiAuth } from '@/hooks/usePiAuth';
import Price from '@/components/shared/Price';
import { useLanguage } from '@/i18n';
import type { Order, OrderStatus } from '@/types';

import { API_BASE_URL as API_URL } from '@/config/network';
// Order enrichi avec les IDs bruts pour savoir si on est acheteur ou vendeur
type Milestone = {
  id: string; title: string; createdBy: string; done: boolean;
  approvedBy: string | null; createdAt: string; doneAt: string | null; approvedAt: string | null;
};
type OrderEx = Order & { buyerRawId: string; freelancerRawId: string; deliveredAt?: string | null; milestones?: Milestone[] };

const statusConfig: Record<OrderStatus, { labelKey: string; color: string; bg: string }> = {
  active:          { labelKey: 'orders.status.active',          color: 'text-[#60A5FA]', bg: 'bg-[#60A5FA]/10' },
  pending_payment: { labelKey: 'orders.status.pending_payment', color: 'text-[#FBBF24]', bg: 'bg-[#FBBF24]/10' },
  in_progress:     { labelKey: 'orders.status.in_progress',     color: 'text-escrow',    bg: 'bg-escrow-light' },
  delivered:       { labelKey: 'orders.status.delivered',       color: 'text-[#4ADE80]', bg: 'bg-[#4ADE80]/10' },
  completed:       { labelKey: 'orders.status.completed',       color: 'text-[#4ADE80]', bg: 'bg-[#4ADE80]/10' },
  cancelled:       { labelKey: 'orders.status.cancelled',       color: 'text-[#F87171]', bg: 'bg-[#F87171]/10' },
  disputed:        { labelKey: 'orders.status.disputed',        color: 'text-[#FBBF24]', bg: 'bg-[#FBBF24]/10' },
  refunding:       { labelKey: 'orders.status.refunding',       color: 'text-[#FBBF24]', bg: 'bg-[#FBBF24]/10' },
  refunded:        { labelKey: 'orders.status.refunded',        color: 'text-[#F87171]', bg: 'bg-[#F87171]/10' },
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
    deliveredAt  : o.deliveredAt || null,
    milestones   : o.milestones || [],
    deliverables : o.deliverables || [],
  };
}

// ── Timeline verticale : Créée → Payée → Livrée → Validée ──
function OrderTimeline({ order, t }: { order: OrderEx; t: (k: string) => string }) {
  if (['cancelled', 'disputed', 'refunding', 'refunded'].includes(order.status)) return null;

  const paidEvent      = order.timeline?.find((e: { event?: string }) => e?.event === 'payment_completed');
  const completedEvent = order.timeline?.find((e: { event?: string }) => e?.event === 'completed');

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  const steps = [
    { key: 'created',   done: true,                                              title: t('orders.timeline.created'),   desc: t('orders.timeline.createdDesc').replace('{service}', order.serviceTitle), at: fmt(order.date) },
    { key: 'paid',      done: order.status !== 'pending_payment',                title: t('orders.timeline.paid'),      desc: t('orders.timeline.paidDesc').replace('{n}', String(order.price)),        at: fmt(paidEvent?.at ?? null) },
    { key: 'delivered', done: ['delivered', 'completed'].includes(order.status), title: t('orders.timeline.delivered'), desc: t('orders.timeline.deliveredDesc').replace('{name}', order.freelancer?.name || ''), at: fmt(order.deliveredAt) },
    { key: 'validated', done: order.status === 'completed',                      title: t('orders.timeline.validated'), desc: t('orders.timeline.validatedDesc'),                                         at: fmt(completedEvent?.at ?? null) },
  ];

  const activeIndex = steps.findIndex(s => !s.done);

  return (
    <div className="mt-4 bg-card border border-border rounded-xl p-5">
      <h3 className="font-heading font-bold text-lg text-navy mb-4">{t('orders.timeline.title')}</h3>
      <div>
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const isCurrent = i === activeIndex;
          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  step.done ? 'bg-escrow text-white' : isCurrent ? 'bg-brand text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {step.done ? <CheckCircle2 size={13} /> : <span className="text-[10px] font-semibold">{i + 1}</span>}
                </div>
                {!isLast && <div className={`w-0.5 flex-1 min-h-[28px] ${step.done ? 'bg-escrow' : 'bg-muted'}`} />}
              </div>
              <div className={`pb-5 ${!step.done && !isCurrent ? 'opacity-50' : ''}`}>
                <p className={`font-medium text-sm ${step.done || isCurrent ? 'text-navy' : 'text-muted-foreground'}`}>{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                {step.at && <p className="text-[11px] text-muted-foreground mt-1">{step.at}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Jalons de commande : le freelance propose, l'acheteur valide ──
// Bloquant côté backend (route /complete refusée tant que non tous validés),
// mais paiement toujours unique et global — aucune libération fractionnée ici.
function MilestoneTracker({
  order, myId, t, acting, onAdd, onMarkDone, onApprove,
}: {
  order: OrderEx; myId: string; t: (k: string) => string; acting: boolean;
  onAdd: (title: string) => void; onMarkDone: (mid: string) => void; onApprove: (mid: string) => void;
}) {
  const [newTitle, setNewTitle] = useState('');
  const milestones = order.milestones || [];
  const isFreelancer = myId === order.freelancerRawId;
  const isBuyer = myId === order.buyerRawId;
  const canEdit = order.status === 'in_progress';

  if (milestones.length === 0 && !(isFreelancer && canEdit)) return null;

  const approvedCount = milestones.filter(m => m.approvedBy).length;
  const total = milestones.length;
  const pct = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  return (
    <div className="mt-4 bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-heading font-bold text-lg text-navy">{t('orders.milestones.title')}</h3>
        {total > 0 && <span className="text-sm text-muted-foreground">{pct}%</span>}
      </div>
      {total > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-2">
            {t('orders.milestones.progress').replace('{done}', String(approvedCount)).replace('{total}', String(total))}
          </p>
          <div className="w-full h-2 bg-muted rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-escrow rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </>
      )}

      <div className="space-y-2">
        {milestones.map(m => (
          <div key={m.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                m.approvedBy ? 'bg-escrow text-white' : m.done ? 'bg-brand-light text-brand' : 'bg-muted text-muted-foreground'
              }`}>
                {m.approvedBy ? <CheckCircle2 size={11} /> : <span className="text-[9px] font-semibold">•</span>}
              </div>
              <span className={`text-sm truncate ${m.approvedBy ? 'text-navy' : 'text-muted-foreground'}`}>{m.title}</span>
            </div>
            {isFreelancer && !m.done && (
              <button
                disabled={acting}
                onClick={() => onMarkDone(m.id)}
                className="text-xs font-medium text-escrow shrink-0 disabled:opacity-50"
              >
                {t('orders.milestones.markDone')}
              </button>
            )}
            {isBuyer && m.done && !m.approvedBy && (
              <button
                disabled={acting}
                onClick={() => onApprove(m.id)}
                className="text-xs font-medium text-white bg-escrow px-2 py-1 rounded-full shrink-0 disabled:opacity-50"
              >
                {t('orders.milestones.approve')}
              </button>
            )}
            {m.done && !m.approvedBy && isFreelancer && (
              <span className="text-[11px] text-muted-foreground shrink-0">{t('orders.milestones.pendingApproval')}</span>
            )}
          </div>
        ))}
      </div>

      {isFreelancer && canEdit && total < 20 && (
        <div className="flex gap-2 mt-3">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder={t('orders.milestones.addPlaceholder')}
            maxLength={140}
            className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background"
          />
          <button
            disabled={acting || !newTitle.trim()}
            onClick={() => { onAdd(newTitle.trim()); setNewTitle(''); }}
            className="text-sm font-medium text-white bg-escrow px-3 py-2 rounded-lg disabled:opacity-50 shrink-0"
          >
            {t('orders.milestones.add')}
          </button>
        </div>
      )}
    </div>
  );
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
  const [disputeFor, setDisputeFor]       = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

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

  // Jalons : proposer (freelance), marquer fait (freelance), valider (acheteur).
  // Chaque appel remplace localement order.milestones avec la réponse serveur
  // (source de vérité), pas de mise à jour optimiste sur une structure imbriquée.
  const milestoneAction = async (orderId: string, method: 'POST' | 'PATCH', path: string, body?: object) => {
    setActing(true); setActionError(null);
    try {
      const token = localStorage.getItem('workpiserv_token');
      const res = await fetch(`${API_URL}/api/orders/${orderId}/milestones${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('orders.actionFailed'));
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, milestones: data.milestones ?? o.milestones } : o)));
      return true;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('orders.actionFailed'));
      return false;
    } finally {
      setActing(false);
    }
  };
  const addMilestone      = (orderId: string, title: string) => milestoneAction(orderId, 'POST', '', { title });
  const markMilestoneDone = (orderId: string, mid: string)    => milestoneAction(orderId, 'PATCH', `/${mid}/done`);
  const approveMilestone  = (orderId: string, mid: string)    => milestoneAction(orderId, 'PATCH', `/${mid}/approve`);

  // Actions litige / remboursement (réponses serveur variables : 200/202/400).
  // On affiche le message serveur (ex. « il reste X jours pour livrer »).
  const postAction = async (orderId: string, path: string, body?: object, optimisticStatus?: OrderStatus) => {
    setActing(true); setActionError(null);
    try {
      const token = localStorage.getItem('workpiserv_token');
      const res = await fetch(`${API_URL}/api/orders/${orderId}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('orders.actionFailed'));
      if (optimisticStatus) setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: optimisticStatus } : o)));
      return true;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('orders.actionFailed'));
      return false;
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
          <Package size={48} className="text-muted-foreground mx-auto mb-4" />
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
            {(['all', 'active', 'in_progress', 'delivered', 'completed', 'disputed', 'refunded', 'pending_payment', 'cancelled'] as const).map(key => {
              const count = key === 'all' ? orders.length : orders.filter(o => o.status === key).length;
              const labels: Record<string, string> = {
                all: 'orders.status.all', active: 'orders.status.active', in_progress: 'orders.status.in_progress',
                delivered: 'orders.status.delivered', completed: 'orders.status.completed',
                disputed: 'orders.status.disputed', refunded: 'orders.status.refunded',
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
            <Package size={48} className="text-muted-foreground mx-auto mb-4" />
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
                        onError={(e) => { const t = e.target as HTMLImageElement; t.style.display='none'; const fb = t.parentElement?.querySelector('.img-fallback') as HTMLElement; if(fb) fb.style.display='flex'; }}
                      />
                      <div className="img-fallback w-20 h-14 rounded-lg shrink-0 bg-gradient-to-br from-[#1E1B4B] via-[#2A2566] to-[#443B8E] items-center justify-center hidden">
                        <span className="text-white text-xs font-bold opacity-60">π</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-navy text-sm line-clamp-1">{order.serviceTitle}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{order.freelancer.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                            {t(sc.labelKey)}
                          </span>
                          <Price pi={order.price} className="text-sm font-bold text-brand" inline />
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
                      onError={(e) => { const t = e.target as HTMLImageElement; t.style.display='none'; const fb = t.parentElement?.querySelector('.img-fallback') as HTMLElement; if(fb) fb.style.display='flex'; }}
                    />
                    <div className="img-fallback w-24 h-16 rounded-lg shrink-0 bg-gradient-to-br from-[#1E1B4B] via-[#2A2566] to-[#443B8E] items-center justify-center hidden">
                    <span className="text-white text-xs font-bold opacity-60">π</span>
                  </div>
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
                  <div className="mt-4 bg-escrow-light border border-escrow/30 rounded-xl p-4 flex items-center gap-3">
                    <Shield size={22} className="text-escrow shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-escrow text-sm">{t('orders.escrowTitle')}</p>
                      <p className="text-xs text-muted-foreground">{t('orders.escrowBody').replace('{n}', String(activeOrder.price))}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusConfig(activeOrder.status).bg} ${getStatusConfig(activeOrder.status).color}`}>
                      {t(getStatusConfig(activeOrder.status).labelKey)}
                    </span>
                  </div>

                  <OrderTimeline order={activeOrder} t={t} />
                  <MilestoneTracker
                    order={activeOrder}
                    myId={myId}
                    t={t}
                    acting={acting}
                    onAdd={title => addMilestone(activeOrder.id, title)}
                    onMarkDone={mid => markMilestoneDone(activeOrder.id, mid)}
                    onApprove={mid => approveMilestone(activeOrder.id, mid)}
                  />

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

                  {/* Litige — ouvrable par l'acheteur OU le freelance (commande en cours / livrée) */}
                  {(myId === activeOrder.buyerRawId || myId === activeOrder.freelancerRawId) &&
                    (activeOrder.status === 'in_progress' || activeOrder.status === 'delivered') && (
                    <div className="mt-3">
                      {disputeFor === activeOrder.id ? (
                        <div className="space-y-2 bg-[#FBBF24]/5 border border-[#FBBF24]/30 rounded-xl p-3">
                          <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder={t('orders.disputeReasonPlaceholder')}
                            className="w-full bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg p-2 text-sm resize-none h-20 focus:outline-none focus:border-brand"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={async () => { const ok = await postAction(activeOrder.id, 'dispute', { reason: disputeReason }, 'disputed'); if (ok) { setDisputeFor(null); setDisputeReason(''); } }}
                              disabled={acting}
                              className="btn-primary flex-1 py-2 text-sm disabled:opacity-60"
                            >
                              {acting ? <Loader2 size={14} className="animate-spin mx-auto" /> : t('orders.submitDispute')}
                            </button>
                            <button onClick={() => { setDisputeFor(null); setDisputeReason(''); }} className="flex-1 py-2 text-sm rounded-lg border border-border text-muted-foreground">
                              {t('orders.formCancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setDisputeFor(activeOrder.id)} className="w-full py-2.5 rounded-xl border border-[#FBBF24]/40 text-[#B45309] dark:text-[#FBBF24] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#FBBF24]/10 transition-colors">
                          <AlertTriangle size={16} /> {t('orders.openDispute')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Acheteur — remboursement si jamais livré (le backend vérifie le délai de 7 j) */}
                  {myId === activeOrder.buyerRawId && activeOrder.status === 'in_progress' && (
                    <button
                      onClick={async () => { const ok = await postAction(activeOrder.id, 'request-refund'); if (ok) setOrders(prev => prev.map(o => (o.id === activeOrder.id ? { ...o, status: 'refunding' } : o))); }}
                      disabled={acting}
                      className="w-full mt-3 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-background disabled:opacity-60 transition-colors"
                    >
                      <RotateCcw size={16} /> {t('orders.requestRefund')}
                    </button>
                  )}

                  {/* Freelance — annuler & rembourser l'acheteur */}
                  {myId === activeOrder.freelancerRawId &&
                    (activeOrder.status === 'in_progress' || activeOrder.status === 'delivered') && (
                    <div className="mt-3">
                      {cancelConfirm === activeOrder.id ? (
                        <div className="bg-[#F87171]/5 border border-[#F87171]/30 rounded-xl p-3 space-y-2">
                          <p className="text-sm text-foreground">{t('orders.cancelConfirm')}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => { const ok = await postAction(activeOrder.id, 'cancel', undefined, 'refunding'); if (ok) setCancelConfirm(null); }}
                              disabled={acting}
                              className="flex-1 py-2 text-sm rounded-lg bg-[#F87171] text-white font-medium disabled:opacity-60"
                            >
                              {acting ? <Loader2 size={14} className="animate-spin mx-auto" /> : t('orders.confirmYes')}
                            </button>
                            <button onClick={() => setCancelConfirm(null)} className="flex-1 py-2 text-sm rounded-lg border border-border text-muted-foreground">
                              {t('orders.confirmNo')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setCancelConfirm(activeOrder.id)} className="w-full py-2.5 rounded-xl border border-[#F87171]/40 text-[#DC2626] dark:text-[#F87171] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#F87171]/10 transition-colors">
                          <Ban size={16} /> {t('orders.cancelOrder')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Bannières d'état */}
                  {activeOrder.status === 'disputed' && (
                    <div className="mt-4 text-sm text-[#B45309] dark:text-[#FBBF24] bg-[#FBBF24]/10 rounded-xl py-3 px-4 flex items-center gap-2">
                      <AlertTriangle size={16} className="shrink-0" /> {t('orders.disputedBanner')}
                    </div>
                  )}
                  {activeOrder.status === 'refunding' && (
                    <div className="mt-4 text-sm text-muted-foreground bg-muted rounded-xl py-3 px-4 flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin shrink-0" /> {t('orders.refundingBanner')}
                    </div>
                  )}
                  {activeOrder.status === 'refunded' && (
                    <div className="mt-4 text-sm text-[#DC2626] dark:text-[#F87171] bg-[#F87171]/10 rounded-xl py-3 px-4 flex items-center gap-2">
                      <RotateCcw size={16} className="shrink-0" /> {t('orders.refundedBanner')}
                    </div>
                  )}

                  {activeOrder.status === 'completed' && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#4ADE80] bg-[#4ADE80]/10 rounded-xl py-3">
                      <CheckCircle2 size={16} /> {t('orders.completedBanner')}
                    </div>
                  )}

                  {actionError && (
                    <p className="text-xs text-[#F87171] text-center mt-2">{actionError}</p>
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
