// SolvencyCard — cadran de solvabilité du panneau d'administration WorkπServ
// ─────────────────────────────────────────────────────────────────────────
// Affiche le dernier constat de réconciliation on-chain (invariant :
// solde wallet ≥ escrow actif + soldes utilisateurs), le surplus (≈
// commissions accumulées), l'historique récent, et permet de forcer
// une vérification immédiate.
//
// Endpoints consommés :
//   GET  /api/admin/reconciliation          → { latest, history, config }
//   POST /api/admin/reconciliation/run      → nouveau constat
//
// Props : apiBase = URL du backend ; token = lecteur du JWT admin.
// (Mêmes conventions que FlaggedUsersTab.)

import { useState, useEffect, useCallback } from 'react';
import {
  Scale, ShieldCheck, ShieldAlert, HelpCircle, RefreshCw, PlayCircle,
  Wallet, Lock, Users as UsersIcon, ChevronDown, ChevronUp,
} from 'lucide-react';
import { apiHeaders } from '@/config/network';

// ── Types alignés sur reconciliation.js ──
interface ReconRecord {
  _id: string;
  at: string;
  walletAddress: string;
  walletMicro: number | null;
  escrowMicro: number | null;
  balancesMicro: number | null;
  obligationsMicro: number | null;
  surplusMicro: number | null;
  status: 'OK' | 'DEFICIT' | 'UNVERIFIED';
  note: string;
  trigger: string;
}

interface ReconPayload {
  latest: ReconRecord | null;
  history: ReconRecord[];
  config: {
    network: string;
    walletAddress: string | null;
    alertEmailSet: boolean;
  };
}

// µπ → π (chaîne lisible, 2 décimales, sans perte d'entier significatif)
const toPi = (micro: number | null) =>
  micro === null ? '—' : (micro / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 });

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_UI = {
  OK:         { label: 'Solvabilité vérifiée', Icon: ShieldCheck, badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  DEFICIT:    { label: 'DÉFICIT DÉTECTÉ',      Icon: ShieldAlert, badge: 'bg-red-100 text-red-700',         bar: 'bg-red-500' },
  UNVERIFIED: { label: 'Non vérifiable',        Icon: HelpCircle,  badge: 'bg-amber-100 text-amber-700',     bar: 'bg-amber-400' },
} as const;

export default function SolvencyCard({ apiBase, token }: { apiBase: string; token: () => string }) {
  const [data, setData] = useState<ReconPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json', ...apiHeaders(), Authorization: `Bearer ${token()}` }),
    [token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${apiBase}/api/admin/reconciliation?limit=10`, { headers: headers() });
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      setError('Impossible de charger la réconciliation.');
    }
    setLoading(false);
  }, [apiBase, headers]);

  useEffect(() => { load(); }, [load]);

  const runNow = async () => {
    setRunning(true);
    setError('');
    try {
      const r = await fetch(`${apiBase}/api/admin/reconciliation/run`, { method: 'POST', headers: headers() });
      if (!r.ok) throw new Error();
      await load();
    } catch {
      setError('Échec du lancement de la vérification.');
    }
    setRunning(false);
  };

  const latest = data?.latest ?? null;
  const ui = latest ? STATUS_UI[latest.status] : null;

  return (
    <div className="bg-card rounded-2xl p-4 space-y-3">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand/10">
            <Scale size={18} className="text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">Solvabilité (réconciliation on-chain)</p>
            <p className="text-[11px] text-muted-foreground">
              Invariant : wallet ≥ escrow + soldes Pioneers
              {data?.config?.walletAddress ? ` · ${data.config.walletAddress}` : ''}
            </p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Actualiser">
          <RefreshCw size={15} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-xs rounded-xl p-2.5">{error}</div>}

      {/* Verdict */}
      {latest && ui && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg ${ui.badge}`}>
              <ui.Icon size={14} /> {ui.label}
            </span>
            <span className="text-[11px] text-muted-foreground">{fmtDate(latest.at)} · {latest.trigger}</span>
          </div>

          {/* Surplus en vedette */}
          <div className="text-center py-1">
            <p className="text-2xl font-bold text-navy">
              {latest.surplusMicro !== null ? `${latest.surplusMicro >= 0 ? '+' : ''}${toPi(latest.surplusMicro)} π` : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground">surplus (≈ commissions accumulées)</p>
          </div>

          {/* Décomposition */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="bg-muted rounded-xl p-2">
              <Wallet size={13} className="mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold text-navy">{toPi(latest.walletMicro)} π</p>
              <p className="text-muted-foreground">wallet on-chain</p>
            </div>
            <div className="bg-muted rounded-xl p-2">
              <Lock size={13} className="mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold text-navy">{toPi(latest.escrowMicro)} π</p>
              <p className="text-muted-foreground">en escrow</p>
            </div>
            <div className="bg-muted rounded-xl p-2">
              <UsersIcon size={13} className="mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold text-navy">{toPi(latest.balancesMicro)} π</p>
              <p className="text-muted-foreground">soldes Pioneers</p>
            </div>
          </div>

          {latest.note && <p className="text-[11px] text-muted-foreground text-center">{latest.note}</p>}
        </>
      )}

      {!latest && !loading && !error && (
        <p className="text-xs text-muted-foreground text-center py-2">Aucun constat encore enregistré.</p>
      )}

      {/* Actions */}
      <button onClick={runNow} disabled={running}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand text-white text-sm font-medium disabled:opacity-60 transition-all">
        <PlayCircle size={15} className={running ? 'animate-pulse' : ''} />
        {running ? 'Vérification en cours…' : 'Vérifier maintenant'}
      </button>

      {/* Historique */}
      {data && data.history.length > 1 && (
        <div>
          <button onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-center gap-1 text-[11px] text-muted-foreground py-1">
            Historique ({data.history.length}) {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showHistory && (
            <div className="space-y-1.5 mt-1">
              {data.history.map((h) => {
                const hui = STATUS_UI[h.status];
                return (
                  <div key={h._id} className="flex items-center justify-between gap-2 bg-muted rounded-xl px-3 py-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${hui.badge}`}>
                      <hui.Icon size={11} /> {h.status}
                    </span>
                    <span className="text-[11px] font-medium text-navy">
                      {h.surplusMicro !== null ? `${toPi(h.surplusMicro)} π` : '—'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{fmtDate(h.at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
