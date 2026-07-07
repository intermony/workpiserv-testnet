// FlaggedUsersTab — onglet Fraude du panneau d'administration WorkπServ
// ──────────────────────────────────────────────────────────────────────
// Consomme les endpoints /api/admin/fraud/* (moteur 7 patterns, score
// 0–100, auto-ban sev ≥ 4). Fiche Pioneer enrichie au dépliage :
// pays, services publiés, achats, adresse wallet, solde π.
//
// Props : apiBase = URL du backend ; token = lecteur du JWT admin.
// (Mêmes conventions que les autres onglets d'AdminPage.)

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, ShieldCheck, RefreshCw, ChevronDown, ChevronUp,
  MapPin, Package, ShoppingBag, Wallet, Coins, XCircle, ScanSearch, Ban,
} from 'lucide-react';
import { apiHeaders } from '@/config/network';

// ── Types alignés sur adminFraudEndpoints.js ──
interface FlaggedUser {
  userId: string;
  pi_username: string;
  flags: number;
  worst: number;
  patterns: string[];
  lastFlagAt?: string;
  score: number;
}

interface FraudFlag {
  _id: string;
  userId: string;
  pi_username?: string;
  pattern: string;
  severity: number;
  details?: string;
  event?: string;
  status: 'open' | 'dismissed';
  autoBanned?: boolean;
  createdAt?: string;
}

interface PioneerProfile {
  userId: string;
  pi_username: string;
  displayName: string;
  country: string;
  servicesPublished: number;
  purchases: number;
  pi_wallet_address: string;
  balance: number;
  completedOrders: number;
  memberSince?: string;
  banned: boolean;
  role: string;
  score: number;
}

// Libellés français des 7 patterns du moteur.
const PATTERN_LABELS: Record<string, string> = {
  velocity_orders    : 'Rafale de commandes',
  reciprocal_trading : 'Échanges croisés (wash trading)',
  self_dealing       : 'Auto-achat',
  review_farming     : 'Fermes d\u2019avis',
  shared_wallet      : 'Wallet partagé',
  rapid_drain        : 'Drainage rapide',
  price_anomaly      : 'Montant incohérent',
};

const patternLabel = (p: string) => PATTERN_LABELS[p] || p;

// Couleur de la jauge / du badge selon le score de risque.
const scoreTone = (score: number) =>
  score >= 75 ? { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700' }
  : score >= 50 ? { bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' }
  : score >= 25 ? { bar: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700' }
  :               { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const shortAddr = (a: string) => (a && a.length === 56 ? `${a.slice(0, 6)}…${a.slice(-6)}` : a || '—');

export default function FlaggedUsersTab({ apiBase, token }: { apiBase: string; token: () => string }) {
  const [users, setUsers] = useState<FlaggedUser[]>([]);
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PioneerProfile>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);
  const [error, setError] = useState('');

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json', ...apiHeaders(), Authorization: `Bearer ${token()}` }),
    [token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ru, rf] = await Promise.all([
        fetch(`${apiBase}/api/admin/fraud/users`, { headers: headers() }),
        fetch(`${apiBase}/api/admin/fraud/flags?status=open&limit=200`, { headers: headers() }),
      ]);
      if (!ru.ok || !rf.ok) throw new Error();
      setUsers(await ru.json());
      setFlags(await rf.json());
    } catch {
      setError('Impossible de charger les données fraude. Réessayer.');
    }
    setLoading(false);
  }, [apiBase, headers]);

  useEffect(() => { load(); }, [load]);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const r = await fetch(`${apiBase}/api/admin/fraud/users/${userId}/profile`, { headers: headers() });
      if (!r.ok) return;
      const p: PioneerProfile = await r.json();
      setProfiles((prev) => ({ ...prev, [userId]: p }));
    } catch { /* silencieux : la fiche reste repliée sur ses données de base */ }
  }, [apiBase, headers]);

  const toggle = (userId: string) => {
    const next = expanded === userId ? null : userId;
    setExpanded(next);
    if (next && !profiles[next]) loadProfile(next);
  };

  const dismissFlag = async (flagId: string) => {
    try {
      const r = await fetch(`${apiBase}/api/admin/fraud/flags/${flagId}/dismiss`, { method: 'POST', headers: headers() });
      if (!r.ok) throw new Error();
      setFlags((f) => f.filter((x) => x._id !== flagId));
      load(); // recalcul des scores
    } catch { /* silencieux */ }
  };

  const rescan = async (userId: string) => {
    setScanning(userId);
    try {
      await fetch(`${apiBase}/api/admin/fraud/scan/${userId}`, { method: 'POST', headers: headers() });
      await load();
      await loadProfile(userId);
    } catch { /* silencieux */ }
    setScanning(null);
  };

  const openFlagsFor = (userId: string) => flags.filter((f) => String(f.userId) === String(userId));
  const totalOpen = flags.length;
  const autoBanned = flags.filter((f) => f.autoBanned).length;

  return (
    <div className="space-y-4">

      {/* Bandeau de veille */}
      <div className="flex items-center justify-between bg-card rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand/10">
            <ShieldAlert size={20} className="text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">Veille anti-fraude</p>
            <p className="text-xs text-muted-foreground">
              {users.length} compte{users.length > 1 ? 's' : ''} signalé{users.length > 1 ? 's' : ''} · {totalOpen} constat{totalOpen > 1 ? 's' : ''} ouvert{totalOpen > 1 ? 's' : ''}{autoBanned > 0 ? ` · ${autoBanned} auto-ban` : ''}
            </p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Actualiser">
          <RefreshCw size={16} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-2xl p-3">{error}</div>
      )}

      {/* État vide */}
      {!loading && !error && users.length === 0 && (
        <div className="bg-card rounded-2xl p-8 text-center space-y-2">
          <ShieldCheck size={28} className="mx-auto text-emerald-500" />
          <p className="text-sm font-medium text-navy">Aucun compte signalé</p>
          <p className="text-xs text-muted-foreground">Le moteur surveille en continu les commandes, retraits, paiements et wallets.</p>
        </div>
      )}

      {/* Comptes signalés */}
      {users.map((u) => {
        const tone = scoreTone(u.score);
        const isOpen = expanded === u.userId;
        const profile = profiles[u.userId];
        const userFlags = openFlagsFor(u.userId);
        return (
          <div key={u.userId} className="bg-card rounded-2xl overflow-hidden">

            {/* Ligne principale */}
            <button onClick={() => toggle(u.userId)} className="w-full p-4 text-left">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold">
                    {(u.pi_username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">@{u.pi_username || u.userId}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.patterns.map(patternLabel).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${tone.badge}`}>{u.score}/100</span>
                  {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>
              </div>
              {/* Jauge de risque — élément signature, discret et informatif */}
              <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${tone.bar} transition-all`} style={{ width: `${u.score}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sévérité max {u.worst}/5 · {u.flags} constat{u.flags > 1 ? 's' : ''} · dernier le {fmtDate(u.lastFlagAt)}
              </p>
            </button>

            {/* Détail déplié */}
            {isOpen && (
              <div className="border-t border-muted px-4 pb-4 space-y-3">

                {/* Fiche Pioneer enrichie */}
                <div className="pt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin size={13} /><span className="text-navy font-medium">{profile ? (profile.country || 'Pays non renseigné') : '…'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Coins size={13} /><span className="text-navy font-medium">{profile ? `${profile.balance} π` : '…'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Package size={13} /><span className="text-navy font-medium">{profile ? `${profile.servicesPublished} service${profile.servicesPublished > 1 ? 's' : ''} publié${profile.servicesPublished > 1 ? 's' : ''}` : '…'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ShoppingBag size={13} /><span className="text-navy font-medium">{profile ? `${profile.purchases} achat${profile.purchases > 1 ? 's' : ''}` : '…'}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                    <Wallet size={13} />
                    <span className="text-navy font-mono font-medium">{profile ? shortAddr(profile.pi_wallet_address) : '…'}</span>
                    {profile?.banned && (
                      <span className="ml-auto inline-flex items-center gap-1 text-red-600 font-semibold"><Ban size={12} />Banni</span>
                    )}
                  </div>
                  {profile?.memberSince && (
                    <p className="col-span-2 text-[11px] text-muted-foreground">Pioneer depuis le {fmtDate(profile.memberSince)}</p>
                  )}
                </div>

                {/* Constats ouverts */}
                <div className="space-y-2">
                  {userFlags.map((f) => (
                    <div key={f._id} className="flex items-start justify-between gap-2 bg-muted rounded-xl p-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-navy">
                          {patternLabel(f.pattern)} <span className="text-muted-foreground font-normal">· sévérité {f.severity}/5{f.autoBanned ? ' · auto-ban' : ''}</span>
                        </p>
                        {f.details && <p className="text-[11px] text-muted-foreground mt-0.5 break-words">{f.details}</p>}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDate(f.createdAt)}{f.event ? ` · déclencheur : ${f.event}` : ''}</p>
                      </div>
                      <button onClick={() => dismissFlag(f._id)} title="Classer ce constat"
                        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:bg-card hover:text-red-600 transition-colors">
                        <XCircle size={15} />
                      </button>
                    </div>
                  ))}
                  {userFlags.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">Tous les constats de ce compte ont été classés.</p>
                  )}
                </div>

                {/* Actions */}
                <button onClick={() => rescan(u.userId)} disabled={scanning === u.userId}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand text-white text-sm font-medium disabled:opacity-60 transition-all">
                  <ScanSearch size={15} className={scanning === u.userId ? 'animate-pulse' : ''} />
                  {scanning === u.userId ? 'Scan en cours…' : 'Scanner à nouveau'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
