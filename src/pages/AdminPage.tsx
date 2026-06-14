import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, RefreshCw, BarChart2, Users, Package, X, Send, MessageCircle, Ban, CheckCircle } from 'lucide-react';
import { usePiAuth } from '@/hooks/usePiAuth';

const API = import.meta.env.VITE_API_URL || 'https://workpiserv-api.onrender.com';

interface UserRow {
  _id: string;
  username: string;
  pi_username?: string;
  displayName?: string;
  avatar?: string;
  role?: string;
  banned?: boolean;
  createdAt?: string;
}

interface Stats {
  users: number;
  services: number;
  orders: number;
  completedOrders: number;
  pendingOrders: number;
  piVolume: number;
}

interface ContactModal {
  open: boolean;
  user: UserRow | null;
  message: string;
  sending: boolean;
  sent: boolean;
  error: string;
}

export default function AdminPage() {
  const { user, loggedIn } = usePiAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'stats' | 'users' | 'services'>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [banConfirm, setBanConfirm] = useState<string | null>(null);

  const [contact, setContact] = useState<ContactModal>({
    open: false, user: null, message: '', sending: false, sent: false, error: ''
  });

  const token = () => localStorage.getItem('workpiserv_token') || '';

  const isAdmin = user?.username === 'alibentaher';

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setStats(data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!r.ok) throw new Error();
      setUsers(await r.json());
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (loggedIn && isAdmin) { fetchStats(); fetchUsers(); } }, [loggedIn, isAdmin]);

  const refresh = () => { fetchStats(); if (tab === 'users') fetchUsers(); };

  const banUser = async (userId: string) => {
    try {
      await fetch(`${API}/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` }
      });
      setUsers(u => u.map(x => x._id === userId ? { ...x, banned: !x.banned } : x));
    } catch { /* silent */ }
    setBanConfirm(null);
  };

  // ── CONTACT MODAL ──
  const openContact = (u: UserRow) => setContact({ open: true, user: u, message: '', sending: false, sent: false, error: '' });
  const closeContact = () => setContact(c => ({ ...c, open: false }));

  const sendMessage = async () => {
    if (!contact.message.trim() || !contact.user) return;
    setContact(c => ({ ...c, sending: true, error: '' }));
    try {
      const r = await fetch(`${API}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ recver_id: contact.user._id, text: contact.message.trim() })
      });
      if (!r.ok) throw new Error();
      setContact(c => ({ ...c, sending: false, sent: true, message: '' }));
      setTimeout(() => setContact(c => ({ ...c, open: false, sent: false })), 1800);
    } catch {
      setContact(c => ({ ...c, sending: false, error: "Échec de l'envoi. Réessayez." }));
    }
  };

  if (!loggedIn || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Shield size={48} className="text-gray-300 mx-auto" />
          <p className="text-muted-foreground">Accès réservé à l'administrateur.</p>
          <button onClick={() => navigate('/')} className="btn-primary text-sm">Retour à l'accueil</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
            <Shield size={24} className="text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Panneau d'administration</h1>
            <p className="text-sm text-muted-foreground">WorkπServ</p>
          </div>
        </div>
        <button onClick={refresh} disabled={loading} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <RefreshCw size={18} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-muted p-1 rounded-2xl">
        {([['stats','Statistiques',BarChart2],['users','Utilisateurs',Users],['services','Services',Package]] as const).map(([key,label,Icon]) => (
          <button key={key} onClick={() => { setTab(key); if (key === 'users') fetchUsers(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${tab === key ? 'bg-brand text-white shadow' : 'text-muted-foreground hover:bg-white'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Pioneers inscrits', value: stats.users },
            { label: 'Services actifs', value: stats.services },
            { label: 'Commandes totales', value: stats.orders },
            { label: 'Volume π (terminées)', value: `π ${(stats.piVolume || 0).toFixed(2)}`, highlight: true },
            { label: 'Commandes terminées', value: stats.completedOrders ?? '-' },
            { label: 'Commandes en attente', value: stats.pendingOrders ?? 0 },
          ].map((s, i) => (
            <div key={i} className={`rounded-2xl p-4 ${s.highlight ? 'bg-brand/5 border border-brand/20' : 'bg-card border border-border'}`}>
              <p className={`text-2xl font-bold ${s.highlight ? 'text-brand' : 'text-navy'}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-2">
          {users.length === 0 && !loading && <p className="text-center text-muted-foreground py-8">Aucun utilisateur</p>}
          {users.map(u => {
            const name = u.displayName || u.username || u.pi_username || '?';
            const initial = name.charAt(0).toUpperCase();
            const isSelf = u.username === 'alibentaher' || u.pi_username === 'alibentaher';
            return (
              <div key={u._id} className={`bg-card rounded-2xl p-4 border ${u.banned ? 'border-red-100 opacity-60' : 'border-border'}`}>
                {/* Ligne 1 : avatar + infos complètes */}
                <div className="flex items-center gap-3 mb-3">
                  {u.avatar
                    ? <img src={u.avatar} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    : <span className="w-10 h-10 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center shrink-0">{initial}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy">@{u.username || u.pi_username}</span>
                      {isSelf && <span className="text-[10px] font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">ADMIN</span>}
                      {u.banned && <span className="text-[10px] font-bold bg-red-100 text-red-500 px-2 py-0.5 rounded-full">BANNI</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Inscrit le : {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </p>
                    {u.displayName && <p className="text-xs text-muted-foreground mt-0.5">{u.displayName}</p>}
                  </div>
                </div>
                {/* Ligne 2 : boutons sur toute la largeur */}
                {!isSelf && (
                  <div className="flex gap-2">
                    {/* Bouton Contact */}
                    <button onClick={() => openContact(u)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#100D26]/5 hover:bg-[#100D26]/10 text-navy text-xs font-medium transition-colors">
                      <MessageCircle size={13} /> Écrire
                    </button>
                    {/* Bouton Bannir */}
                    {banConfirm === u._id ? (
                      <div className="flex gap-1">
                        <button onClick={() => banUser(u._id)} className="px-2 py-1.5 rounded-xl bg-red-500 text-white text-xs font-medium">Oui</button>
                        <button onClick={() => setBanConfirm(null)} className="px-2 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs">Non</button>
                      </div>
                    ) : (
                      <button onClick={() => setBanConfirm(u._id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${u.banned ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                        {u.banned ? <><CheckCircle size={13} /> Réactiver</> : <><Ban size={13} /> Bannir</>}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Services tab placeholder */}
      {tab === 'services' && (
        <div className="text-center text-muted-foreground py-12">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p>Modération des services — bientôt disponible</p>
        </div>
      )}

      {/* ── MODAL DE CONTACT ── */}
      {contact.open && contact.user && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeContact} />
          {/* Panel */}
          <div className="relative w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-4 mx-0 sm:mx-4">
            {/* Header modal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {contact.user.avatar
                  ? <img src={contact.user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                  : <span className="w-10 h-10 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-lg">
                      {(contact.user.displayName || contact.user.username || 'π').charAt(0).toUpperCase()}
                    </span>}
                <div>
                  <p className="font-semibold text-navy">@{contact.user.username || contact.user.pi_username}</p>
                  <p className="text-xs text-muted-foreground">Message privé</p>
                </div>
              </div>
              <button onClick={closeContact} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Textarea */}
            {contact.sent ? (
              <div className="flex flex-col items-center py-6 space-y-2">
                <CheckCircle size={40} className="text-green-500" />
                <p className="font-medium text-navy">Message envoyé ✅</p>
                <p className="text-xs text-muted-foreground">Il apparaîtra dans sa messagerie WorkπServ</p>
              </div>
            ) : (
              <>
                <textarea
                  className="w-full border border-border rounded-2xl p-3 text-sm resize-none focus:outline-none focus:border-brand h-32 transition-colors"
                  placeholder="Écrivez votre message ici... (il recevra une notification dans ses Messages)"
                  value={contact.message}
                  onChange={e => setContact(c => ({ ...c, message: e.target.value }))}
                />
                {contact.error && <p className="text-xs text-red-500">{contact.error}</p>}
                <div className="flex gap-3">
                  <button onClick={closeContact} className="flex-1 py-3 rounded-2xl border border-border text-muted-foreground text-sm font-medium hover:bg-background transition-colors">
                    Annuler
                  </button>
                  <button onClick={sendMessage} disabled={contact.sending || !contact.message.trim()}
                    className="flex-1 py-3 rounded-2xl bg-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-brand/90 transition-colors">
                    {contact.sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                    {contact.sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
