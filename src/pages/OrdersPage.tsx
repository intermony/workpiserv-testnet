import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Shield, Check, Clock, X, Star,
  Download, MessageCircle, RotateCcw, AlertTriangle, Loader2
} from 'lucide-react';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import type { Order, OrderStatus } from '@/types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api.onrender.com';

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  active:          { label: 'Active',           color: 'text-blue-600',   bg: 'bg-blue-50' },
  pending_payment: { label: 'Pending Payment',  color: 'text-amber-600',  bg: 'bg-amber-50' },
  in_progress:     { label: 'In Progress',      color: 'text-purple-600', bg: 'bg-purple-50' },
  delivered:       { label: 'Delivered',        color: 'text-green-600',  bg: 'bg-green-50' },
  completed:       { label: 'Completed',        color: 'text-green-600',  bg: 'bg-green-50' },
  cancelled:       { label: 'Cancelled',        color: 'text-red-600',    bg: 'bg-red-50' },
};

const statusTabs: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all',             label: 'All' },
  { key: 'active',          label: 'Active' },
  { key: 'in_progress',     label: 'In Progress' },
  { key: 'delivered',       label: 'Delivered' },
  { key: 'completed',       label: 'Completed' },
  { key: 'pending_payment', label: 'Pending' },
  { key: 'cancelled',       label: 'Cancelled' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOrder(o: any): Order {
  return {
    id           : o._id || o.id,
    orderId      : o.orderId || `#${(o._id || o.id).slice(-6).toUpperCase()}`,
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
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/orders`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const raw = Array.isArray(data) ? data : data.orders || [];
        setOrders(raw.map(normalizeOrder));
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeStatus === 'all') return orders;
    return orders.filter(o => o.status === activeStatus);
  }, [activeStatus, orders]);

  const activeOrder = selectedOrder || filteredOrders[0] || null;

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="section-container py-8">
          <ScrollReveal>
            <div className="text-sm text-gray-500 mb-2">
              <Link to="/" className="text-brand hover:underline">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-700">My Orders</span>
            </div>
            <h1 className="font-heading font-bold text-3xl text-navy">My Orders</h1>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="flex gap-2 mt-6 overflow-x-auto scrollbar-hide pb-1">
              {statusTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveStatus(tab.key); setSelectedOrder(null); }}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeStatus === tab.key
                      ? 'bg-brand-light text-brand'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs opacity-70">
                    ({tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length})
                  </span>
                </button>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Content */}
      <div className="section-container py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <Loader2 size={36} className="text-brand animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading your orders...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Order List */}
            <div className="lg:w-[380px] shrink-0 space-y-3">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => {
                  const status = statusConfig[order.status];
                  const isActive = activeOrder?.id === order.id;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      onClick={() => setSelectedOrder(order)}
                      className={`card-surface p-4 cursor-pointer transition-all ${
                        isActive ? 'border-brand ring-1 ring-brand' : 'card-surface-hover'
                      }`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={order.serviceImage}
                          alt={order.serviceTitle}
                          className="w-20 h-14 rounded-lg object-cover shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/images/service-default.jpg'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-navy text-sm line-clamp-1">{order.serviceTitle}</h3>
                          <p className="text-xs text-gray-500 mt-1">{order.freelancer.name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                              {status.label}
                            </span>
                            <span className="text-sm font-bold text-brand">π {order.price}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12 card-surface">
                  <Package size={48} className="text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700">No orders yet</h3>
                  <p className="text-sm text-gray-500 mt-1">When you place an order, it will appear here</p>
                  <Link to="/marketplace" className="btn-primary mt-4 inline-block">Browse Services</Link>
                </div>
              )}
            </div>

            {/* Order Detail */}
            {activeOrder && (
              <div className="flex-1 min-w-0">
                <ScrollReveal>
                  <div className="card-surface p-6">
                    <div className="flex gap-4">
                      <img
                        src={activeOrder.serviceImage}
                        alt={activeOrder.serviceTitle}
                        className="w-24 h-16 rounded-lg object-cover shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/service-default.jpg'; }}
                      />
                      <div className="flex-1">
                        <h2 className="font-semibold text-navy">{activeOrder.serviceTitle}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg">{typeof activeOrder.freelancer.avatar === 'string' && activeOrder.freelancer.avatar.length <= 2 ? activeOrder.freelancer.avatar : '👤'}</span>
                          <span className="text-sm text-gray-600">{activeOrder.freelancer.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                          <span>{activeOrder.orderId}</span>
                          <span>{activeOrder.date}</span>
                          <span className="bg-brand-light text-brand px-2 py-0.5 rounded-full">{activeOrder.package}</span>
                        </div>
                      </div>
                    </div>

                    {/* Escrow Banner */}
                    <div className="mt-4 bg-escrow-light border border-purple-200 rounded-xl p-4 flex items-center gap-3">
                      <Shield size={24} className="text-escrow shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-escrow text-sm">Payment Protected in Escrow</p>
                        <p className="text-xs text-gray-500">Your π {activeOrder.price} is safely held until delivery is confirmed</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[activeOrder.status].bg} ${statusConfig[activeOrder.status].color}`}>
                        {statusConfig[activeOrder.status].label}
                      </span>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Timeline */}
                {(activeOrder.timeline ?? []).length > 0 && (
                  <ScrollReveal className="mt-4">
                    <div className="card-surface p-6">
                      <h3 className="font-semibold text-navy mb-5">Order Timeline</h3>
                      <div className="relative">
                        {(activeOrder.timeline ?? []).map((event, i) => (
                          <div key={i} className="flex gap-4 relative pb-6 last:pb-0">
                            {i < (activeOrder.timeline ?? []).length - 1 && (
                              <div className="absolute left-[5px] top-3 w-0.5 h-full bg-gray-200" />
                            )}
                            <div className="relative z-10">
                              {event.status === 'completed' && (
                                <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                                  <Check size={8} className="text-white" />
                                </div>
                              )}
                              {event.status === 'current' && (
                                <div className="w-3 h-3 rounded-full bg-brand relative">
                                  <span className="absolute inset-0 rounded-full bg-brand animate-timeline-pulse" />
                                </div>
                              )}
                              {event.status === 'pending' && (
                                <div className="w-3 h-3 rounded-full bg-gray-200" />
                              )}
                            </div>
                            <div className="-mt-1">
                              <p className={`text-sm font-medium ${event.status === 'pending' ? 'text-gray-400' : 'text-navy'}`}>
                                {event.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                              {event.date && <p className="text-xs text-gray-400 mt-0.5">{event.date}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>
                )}

                {/* Milestones */}
                {activeOrder.milestones && activeOrder.milestones.length > 0 && (
                  <ScrollReveal className="mt-4">
                    <div className="card-surface p-6">
                      <h3 className="font-semibold text-navy mb-4">Project Milestones</h3>
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{activeOrder.milestones.filter(m => m.status === 'completed').length} of {activeOrder.milestones.length} completed</span>
                          <span>{Math.round((activeOrder.milestones.filter(m => m.status === 'completed').length / activeOrder.milestones.length) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${(activeOrder.milestones.filter(m => m.status === 'completed').length / activeOrder.milestones.length) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {activeOrder.milestones.map((m, i) => (
                          <div key={i} className="flex items-center gap-3 py-2">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                              m.status === 'completed' ? 'bg-green-500' : m.status === 'in_progress' ? 'bg-blue-500' : 'border-2 border-gray-200'
                            }`}>
                              {m.status === 'completed' && <Check size={12} className="text-white" />}
                              {m.status === 'in_progress' && <Clock size={12} className="text-white" />}
                            </div>
                            <span className={`text-sm ${m.status === 'pending' ? 'text-gray-400' : 'text-gray-700'}`}>{m.title}</span>
                            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                              m.status === 'completed' ? 'bg-green-50 text-green-600' :
                              m.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'
                            }`}>
                              {m.status === 'completed' ? 'Done' : m.status === 'in_progress' ? 'Active' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>
                )}

                {/* Deliverables */}
                <ScrollReveal className="mt-4">
                  <div className="card-surface p-6">
                    <h3 className="font-semibold text-navy mb-4">Deliverables</h3>
                    {activeOrder.deliverables && activeOrder.deliverables.length > 0 ? (
                      <div className="space-y-3">
                        {activeOrder.deliverables.map((file, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                            <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                              <Package size={18} className="text-brand" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-navy truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{file.size}</p>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Download size={16} className="text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package size={40} className="text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          {activeOrder.status === 'in_progress'
                            ? 'Work in progress. Deliverables will appear here once submitted.'
                            : activeOrder.status === 'delivered'
                            ? 'Review the deliverables above.'
                            : 'No deliverables for this order.'}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollReveal>

                {/* Action Buttons */}
                <ScrollReveal className="mt-4">
                  <div className="card-surface p-6">
                    <div className="flex flex-col gap-3">
                      {activeOrder.status === 'delivered' && (
                        <>
                          <button className="btn-primary py-3 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600">
                            <Check size={18} /> Accept & Release Payment
                          </button>
                          <button className="btn-secondary py-3 flex items-center justify-center gap-2">
                            <RotateCcw size={18} /> Request Changes
                          </button>
                        </>
                      )}
                      {activeOrder.status === 'in_progress' && (
                        <>
                          <button className="btn-secondary py-3 flex items-center justify-center gap-2">
                            <MessageCircle size={18} /> Message Seller
                          </button>
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="btn-ghost py-3 text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                          >
                            <X size={18} /> Cancel Order
                          </button>
                        </>
                      )}
                      {activeOrder.status === 'completed' && (
                        <>
                          <button className="btn-primary py-3 flex items-center justify-center gap-2">
                            <Star size={18} /> Leave Review
                          </button>
                          <Link
                            to={`/service/${activeOrder.serviceId}`}
                            className="btn-secondary py-3 flex items-center justify-center gap-2 text-center"
                          >
                            Reorder
                          </Link>
                        </>
                      )}
                      {activeOrder.status === 'pending_payment' && (
                        <button className="btn-primary py-3 flex items-center justify-center gap-2">
                          Complete Payment (π {activeOrder.price})
                        </button>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={() => setShowCancelModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 max-w-md w-full mx-4 z-50 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <h3 className="font-semibold text-navy text-lg">Cancel Order</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Are you sure you want to cancel this order? Your payment of π {activeOrder?.price} held in escrow will be refunded to your Pi wallet.
              </p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCancelModal(false)} className="btn-ghost flex-1 py-2.5">
                  Keep Order
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                >
                  Cancel & Refund
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
