/**
 * src/components/shared/DeliveryNotificationBanner.tsx — WorkPiServ
 * -----------------------------------------------------------------
 * N1 — Bandeau d'alerte "Nouvelle livraison" affiché en haut de
 * la page Messages quand l'acheteur a des notifications non lues.
 * Tap → marque comme lu + ouvre la conversation concernée.
 * -----------------------------------------------------------------
 */

import { useNavigate } from 'react-router-dom';
import { Package, X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n';
import type { DeliveryNotification } from '@/hooks/useDeliveryNotifications';

interface Props {
  notifications: DeliveryNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  busy?: boolean;
}

export function DeliveryNotificationBanner({ notifications, onDismiss, onClearAll, busy }: Props) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  if (notifications.length === 0) return null;

  const openConversation = (n: DeliveryNotification) => {
    onDismiss(n._id);
    // Ouvre la conversation côté MessagesPage via query param (cf. MessagesPage useEffect)
    navigate(`/messages?to=${encodeURIComponent(n.conversationId)}&name=${encodeURIComponent(n.freelancerName)}&notif=${encodeURIComponent(n._id)}`);
  };

  return (
    <div className="mb-3 rounded-xl border-2 border-[#E11D48] bg-[#E11D48]/5 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#E11D48]/20 bg-[#E11D48]/10">
        <div className="flex items-center gap-2 text-[#E11D48] font-semibold text-xs">
          <Package size={14} />
          {t('notif.delivery.bannerTitle').replace('{n}', String(notifications.length))}
        </div>
        <button
          onClick={onClearAll}
          disabled={busy}
          className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {t('notif.delivery.markAllRead')}
        </button>
      </div>
      <div className="divide-y divide-border">
        {notifications.slice(0, 3).map(n => (
          <div key={n._id} className="flex items-center gap-3 p-3 hover:bg-background transition-colors">
            <div className="w-9 h-9 rounded-full bg-escrow-light flex items-center justify-center shrink-0">
              {busy ? <Loader2 size={16} className="animate-spin text-escrow" /> : <Package size={16} className="text-escrow" />}
            </div>
            <button
              onClick={() => openConversation(n)}
              className="flex-1 text-left min-w-0"
            >
              <p className="text-sm font-medium text-foreground truncate">
                {t('notif.delivery.itemTitle').replace('{name}', n.freelancerName)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {n.serviceTitle} · {n.orderRef}
              </p>
            </button>
            <button
              onClick={() => onDismiss(n._id)}
              disabled={busy}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
              aria-label={t('common.cancel')}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {notifications.length > 3 && (
          <div className="px-3 py-2 text-[11px] text-muted-foreground text-center">
            {t('notif.delivery.more').replace('{n}', String(notifications.length - 3))}
          </div>
        )}
      </div>
    </div>
  );
}
