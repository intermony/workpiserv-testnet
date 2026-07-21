/**
 * src/hooks/useDeliveryNotifications.ts — WorkPiServ
 * -----------------------------------------------------------------
 * N1 — Notification de livraison Pioneer (option C : endpoint dédié).
 *
 * Source de vérité pour le badge "nouvelle livraison" sur l'onglet
 * Messages de la bottom nav. Polling léger toutes les 60s quand
 * l'utilisateur est authentifié, plus un événement manuel
 * `invalidateNotifications()` exposé pour invalidation immédiate
 * après une action (ex. ouverture d'une conversation).
 *
 * Contrat API backend (cf. server.js — patch livré séparément) :
 *   GET  /api/notifications/unread-count  →  { count: number }
 *   GET  /api/notifications?unread=true   →  Notification[]
 *   POST /api/notifications/:id/read      →  { ok: true }
 *   POST /api/notifications/mark-all-read →  { ok: true, modified: number }
 *
 * Pourquoi 60s et pas plus court : on n'est pas un chat temps réel,
 * on est un système d'escrow. Une livraison est un événement rare
 * et structurant — 60s de polling = 1 requête/min, négligeable.
 * -----------------------------------------------------------------
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL, apiHeaders, handleUnauthorized } from '@/config/network';

export interface DeliveryNotification {
  _id: string;
  userId: string;          // destinataire (l'acheteur)
  orderId: string;         // référence commande
  orderRef: string;        // ex. "#A1B2C3" — affichage
  serviceTitle: string;
  freelancerName: string;
  conversationId: string;  // pour ouvrir direct la bonne conversation
  read: boolean;
  createdAt: string;       // ISO
}

const POLL_MS = 60_000; // 1 min — cf. note dans l'entête

function getToken(): string | null {
  try { return localStorage.getItem('workpiserv_token'); } catch { return null; }
}

export function useDeliveryNotifications() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [latest, setLatest] = useState<DeliveryNotification[]>([]);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUnreadCount(0);
      setLatest([]);
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (res.status === 401) {
        handleUnauthorized(401);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted.current) return;
      setUnreadCount(typeof data?.count === 'number' ? data.count : 0);
    } catch {
      // silencieux — on retentera au prochain poll
    } finally {
      inFlight.current = false;
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?unread=true&limit=10`, {
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (mounted.current && Array.isArray(data)) {
        setLatest(data as DeliveryNotification[]);
      }
    } catch { /* ignore */ }
  }, []);

  // Polling périodique
  useEffect(() => {
    mounted.current = true;
    refresh();
    fetchLatest();
    const id = setInterval(refresh, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [refresh, fetchLatest]);

  /** À appeler quand l'utilisateur ouvre une conversation marquée. */
  const markAsRead = useCallback(async (notificationId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
    } catch { /* ignore */ }
    // Optimiste : on décrémente localement
    setUnreadCount(c => Math.max(0, c - 1));
    setLatest(list => list.filter(n => n._id !== notificationId));
  }, []);

  /** À appeler quand l'utilisateur ouvre l'onglet Messages sans conversation précise. */
  const markAllAsRead = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setUnreadCount(0);
    setLatest([]);
    try {
      await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
    } catch { /* ignore */ }
  }, []);

  return {
    unreadCount,
    latest,
    refresh,
    markAsRead,
    markAllAsRead,
  };
}
