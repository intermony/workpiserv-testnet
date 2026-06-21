import { useState, useEffect, useCallback } from 'react';
import { Send, Loader2, CheckCircle2, XCircle, Users, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/i18n';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api-testnet.onrender.com';
const TEST_AMOUNT = 0.1;

interface PioneerRow {
  _id: string;
  pi_uid?: string;
  pi_username?: string;
  username?: string;
  role?: string;
}

type RowState = { phase: 'idle' | 'sending' | 'done' | 'error'; msg?: string };

const STR = {
  en: {
    title: 'A2U Validation Tool',
    sub: 'Send a small A2U payment (0.1 π) to each pioneer. Goal: reach 5 unique wallets to unlock Mainnet.',
    loading: 'Loading pioneers…',
    empty: 'No pioneers have logged in yet. Ask testers to open the testnet app and sign in once.',
    send: 'Send 0.1 π',
    sending: 'Sending…',
    sent: 'Sent ✓',
    you: 'you',
    paidSession: 'Sent this session',
    refresh: 'Refresh list',
    noUid: 'No Pi uid',
    show: 'Show',
    hide: 'Hide',
  },
  fr: {
    title: 'Outil de validation A2U',
    sub: 'Envoie un petit paiement A2U (0.1 π) à chaque pionnier. Objectif : 5 wallets uniques pour débloquer le Mainnet.',
    loading: 'Chargement des pionniers…',
    empty: 'Aucun pionnier connecté pour l\'instant. Demande aux testeurs d\'ouvrir l\'app testnet et de se connecter une fois.',
    send: 'Envoyer 0.1 π',
    sending: 'Envoi…',
    sent: 'Envoyé ✓',
    you: 'toi',
    paidSession: 'Envoyés cette session',
    refresh: 'Rafraîchir la liste',
    noUid: 'Pas de uid Pi',
    show: 'Afficher',
    hide: 'Masquer',
  },
};

export default function AdminA2UCard({ currentUid }: { currentUid?: string }) {
  const { lang } = useLanguage();
  const s = (STR as Record<string, typeof STR.en>)[lang] || STR.en;

  const [rows, setRows] = useState<PioneerRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<Record<string, RowState>>({});
  const [paid, setPaid] = useState<Set<string>>(new Set());

  const token = () => localStorage.getItem('workpiserv_token') || '';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (r.ok) {
        const data = await r.json();
        setRows(Array.isArray(data) ? data : []);
      }
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) fetchUsers(); }, [open, fetchUsers]);

  const send = async (u: PioneerRow) => {
    if (!u.pi_uid) return;
    setStates((p) => ({ ...p, [u._id]: { phase: 'sending' } }));
    try {
      const r = await fetch(`${API_URL}/api/admin/test-a2u`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ uid: u.pi_uid, amount: TEST_AMOUNT }),
      });
      const data = await r.json();
      if (r.ok && data.success) {
        const txid = data.txid ? String(data.txid).slice(0, 10) + '…' : '';
        setStates((p) => ({ ...p, [u._id]: { phase: 'done', msg: txid } }));
        setPaid((p) => new Set(p).add(u.pi_uid as string));
      } else {
        setStates((p) => ({ ...p, [u._id]: { phase: 'error', msg: data.error || 'Échec' } }));
      }
    } catch {
      setStates((p) => ({ ...p, [u._id]: { phase: 'error', msg: 'Réseau' } }));
    }
  };

  return (
    <section className="card-surface p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading font-semibold text-navy flex items-center gap-2">
          <ShieldCheck size={18} className="text-brand" /> {s.title}
        </h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="btn-primary text-xs px-3 py-2 whitespace-nowrap flex items-center gap-1.5"
        >
          {open ? (<><EyeOff size={14} /> {s.hide}</>) : (<><Eye size={14} /> {s.show}</>)}
        </button>
      </div>

      {open && (
      <>
      <p className="text-xs text-muted-foreground">{s.sub}</p>

      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm text-navy">
          <CheckCircle2 size={15} className="text-[#4ADE80]" />
          {s.paidSession}: <strong>{paid.size}</strong>
        </span>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="text-xs text-brand underline disabled:opacity-50"
        >
          {s.refresh}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 size={15} className="animate-spin" /> {s.loading}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Users size={15} /> {s.empty}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((u) => {
            const st = states[u._id] || { phase: 'idle' as const };
            const isMe = currentUid && u.pi_uid === currentUid;
            return (
              <div
                key={u._id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">
                    @{u.username || u.pi_username || '—'}
                    {isMe && <span className="text-muted-foreground font-normal"> ({s.you})</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {u.pi_uid ? u.pi_uid.slice(0, 14) + '…' : s.noUid}
                  </p>
                  {st.phase === 'done' && (
                    <p className="text-[11px] text-[#4ADE80] flex items-center gap-1">
                      <CheckCircle2 size={11} /> {s.sent} {st.msg}
                    </p>
                  )}
                  {st.phase === 'error' && (
                    <p className="text-[11px] text-[#F87171] flex items-center gap-1">
                      <XCircle size={11} /> {st.msg}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => send(u)}
                  disabled={!u.pi_uid || st.phase === 'sending' || st.phase === 'done'}
                  className="btn-primary text-xs px-3 py-2 whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
                >
                  {st.phase === 'sending' ? (
                    <><Loader2 size={13} className="animate-spin" /> {s.sending}</>
                  ) : st.phase === 'done' ? (
                    <><CheckCircle2 size={13} /> {s.sent}</>
                  ) : (
                    <><Send size={13} /> {s.send}</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}
    </section>
  );
}
