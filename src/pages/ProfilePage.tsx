import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Wallet, Copy, Check, Pencil, X, LogOut, Package, AlertTriangle, ShieldCheck, Info, Camera,
  MessageCircle, PlusCircle, Shield, Loader2, User as UserIcon,
  MapPin, Star,
} from 'lucide-react';
import { usePiAuth } from '@/hooks/usePiAuth';
import { piSdkAvailable } from '@/lib/pi';
import { useLanguage } from '@/i18n';
import WithdrawCard from '@/components/WithdrawCard';
import RechargeCard from '@/components/RechargeCard';
import AdminA2UCard from '@/components/AdminA2UCard';

import { API_BASE_URL as API_URL, apiHeaders, handleUnauthorized } from '@/config/network';
// Adresse publique Pi (format Stellar) : commence par G, 56 caractères
const PI_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/;

// Style commun des champs de saisie — fond clair neutre, texte sombre lisible
const FIELD_CLASS =
  "w-full rounded-xl px-4 py-3 text-sm border border-[#E8E6DF] " +
  "bg-white text-[#1A1A2E] " +
  "placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand";

function Avatar({ avatar, size = 72 }: { avatar?: string; size?: number }) {
  if (avatar && avatar.startsWith('http')) {
    return (
      <img
        src={avatar}
        alt="Avatar"
        width={size}
        height={size}
        className="rounded-full object-cover border-2 border-brand-light"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-brand-light flex items-center justify-center border-2 border-brand/20"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {avatar || '👤'}
    </div>
  );
}

export default function ProfilePage() {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const { user, loading, loggedIn, login, logout, refreshUser, error: authError } = usePiAuth();
  const { t } = useLanguage();

  // ─── Champs étendus renvoyés par /api/auth/me ──────────────
  const u = user as (typeof user & {
    pi_wallet_address?: string;
    displayName?: string;
    title?: string;
    bio?: string;
    location?: string;
    rating?: number;
    completedOrders?: number;
  }) | null;

  const serverWallet = u?.pi_wallet_address ?? '';

  // ─── Édition des infos du profil (via PUT /api/users/profile) ─
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile]   = useState(false);
  const [profileError, setProfileError]     = useState<string | null>(null);
  const [form, setForm] = useState({ displayName: '', title: '', bio: '', location: '', type: 'both' });

  const openProfileEditor = () => {
    setForm({
      displayName : u?.displayName || '',
      title       : u?.title || '',
      bio         : u?.bio || '',
      location    : u?.location || '',
      type        : u?.type || 'both',
    });
    setProfileError(null);
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);
    try {
      const token = localStorage.getItem('workpiserv_token');
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: apiHeaders({
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }),
        body: JSON.stringify(form),
      });
      if (!res.ok) { handleUnauthorized(res.status); throw new Error(); }
      await refreshUser();
      setEditingProfile(false);
    } catch {
      setProfileError(t('profile.saveFailed'));
    } finally {
      setSavingProfile(false);
    }
  };

  const [editing, setEditing]         = useState(false);
  const [draft, setDraft]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [photoModal, setPhotoModal] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied]           = useState(false);

  useEffect(() => {
    // Rafraîchit le profil à l'arrivée sur la page (wallet à jour)
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadPhoto = async (file: File) => {
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) { setPhotoError('Format invalide (JPG, PNG, WEBP)'); return; }
    if (file.size > 2 * 1024 * 1024) { setPhotoError('Fichier trop volumineux (max 2 MB)'); return; }
    setPhotoUploading(true); setPhotoError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`${API_URL}/api/users/avatar`, {
        method: 'POST',
        headers: apiHeaders({ Authorization: `Bearer ${localStorage.getItem('workpiserv_token')}` }),
        body: formData,
      });
      if (!res.ok) { handleUnauthorized(res.status); throw new Error(); }
      await refreshUser();
      setPhotoModal(false);
    } catch { setPhotoError("Échec de l'upload. Réessayez."); }
    setPhotoUploading(false);
  };

  const saveWallet = async () => {
    const value = draft.trim().toUpperCase();
    if (!PI_ADDRESS_REGEX.test(value)) {
      setWalletError(t('profile.walletInvalid'));
      return;
    }
    setSaving(true);
    setWalletError(null);
    try {
      const token = localStorage.getItem('workpiserv_token');
      const res = await fetch(`${API_URL}/api/users/wallet`, {
        method: 'PUT',
        headers: apiHeaders({
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }),
        body: JSON.stringify({ pi_wallet_address: value }),
      });
      if (!res.ok) { handleUnauthorized(res.status); throw new Error(); }
      await refreshUser();
      setEditing(false);
    } catch {
      setWalletError(t('profile.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(serverWallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard indisponible */ }
  };

  // ─── Profil public d'un autre Pioneer (/profile/:username) ──
  const isOwnProfile = !paramUsername || paramUsername === user?.username;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={36} className="text-brand animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{t('profile.loading')}</p>
        </div>
      </main>
    );
  }

  // Vue publique minimale d'un autre utilisateur
  if (!isOwnProfile) {
    return (
      <main className="min-h-screen pb-24">
        <div className="bg-card border-b border-border">
          <div className="section-container py-8">
            <div className="text-sm text-muted-foreground mb-2">
              <Link to="/" className="text-brand hover:underline">{t('nav.home')}</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{t('nav.profile')}</span>
            </div>
            <div className="flex items-center gap-4">
              <Avatar avatar="👤" />
              <div>
                <h1 className="font-heading font-bold text-2xl text-navy">@{paramUsername}</h1>
                <p className="text-sm text-muted-foreground">{t('profile.pioneer')}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="section-container py-8">
          <Link to="/marketplace" className="btn-primary inline-block">{t('orders.browse')}</Link>
        </div>
      </main>
    );
  }

  // Pas connecté
  if (!loggedIn || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <UserIcon size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="font-semibold text-foreground mb-2">{t('profile.notSignedIn')}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {piSdkAvailable()
              ? t('profile.signInHint')
              : t('profile.openPiBrowser')}
          </p>
          {piSdkAvailable() && (
            <button onClick={() => login()} className="btn-primary">{t('profile.signIn')}</button>
          )}
          {authError && (
            <p className="text-sm text-red-400 mt-3">{t(authError)}</p>
          )}
        </div>
      </main>
    );
  }

  // ─── Complétude du profil (moteur de confiance) ─────────────
  const hasPhoto = !!(user.avatar && user.avatar.startsWith('http'));
  const completionItems = [
    { key: 'photo',    label: t('completion.photo'),    done: hasPhoto,          action: () => { setPhotoModal(true); setPhotoError(''); } },
    { key: 'name',     label: t('completion.name'),     done: !!u?.displayName,   action: openProfileEditor },
    { key: 'title',    label: t('completion.title'),    done: !!u?.title,         action: openProfileEditor },
    { key: 'bio',      label: t('completion.bio'),      done: !!u?.bio,           action: openProfileEditor },
    { key: 'location', label: t('completion.location'), done: !!u?.location,      action: openProfileEditor },
    { key: 'wallet',   label: t('completion.wallet'),   done: !!serverWallet,     action: () => { setDraft(serverWallet); setEditing(true); setWalletError(null); } },
  ];
  const completionDone = completionItems.filter(i => i.done).length;
  const completionPct  = Math.round((completionDone / completionItems.length) * 100);

  return (
    <main className="min-h-screen pb-24 bg-background">
      {/* En-tête */}
      <div className="bg-card border-b border-border">
        <div className="section-container py-8">
          <div className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="text-brand hover:underline">{t('nav.home')}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{t('profile.title')}</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => { setPhotoModal(true); setPhotoError(''); }}
              className="relative group shrink-0">
              <Avatar avatar={user.avatar} />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 flex items-center justify-center transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            </button>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-2xl text-navy truncate">
                {u?.displayName || `@${user.username}`}
              </h1>
              {u?.displayName && (
                <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              )}
              {u?.title && (
                <p className="text-sm text-foreground mt-0.5 truncate">{u.title}</p>
              )}
              <div className="flex items-center flex-wrap gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-brand bg-brand-light px-2.5 py-1 rounded-full capitalize">
                  <Shield size={12} /> {user.type || 'Pioneer'}
                </span>
                {u?.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={12} /> {u.location}
                  </span>
                )}
                {(u?.rating ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Star size={12} className="text-amber-500 fill-amber-500" /> {u?.rating}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-container py-6 space-y-4">
        {/* ── Complétude du profil (moteur de confiance) ── */}
        {completionPct < 100 ? (
          <section className="card-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-navy flex items-center gap-2">
                <ShieldCheck size={18} className="text-brand" /> {t('completion.heading')}
              </h2>
              <span className="font-heading font-bold text-lg text-brand">{completionPct}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-[#0077B6] transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t('completion.hint')}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {completionItems.filter(i => !i.done).map(i => (
                <button
                  key={i.key}
                  onClick={i.action}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand bg-brand-light px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
                >
                  <PlusCircle size={12} /> {i.label}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="card-surface p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#16A34A]/15 flex items-center justify-center shrink-0">
              <Check size={18} className="text-[#16A34A]" />
            </div>
            <div>
              <p className="font-heading font-semibold text-navy text-sm">{t('completion.done')}</p>
              <p className="text-xs text-muted-foreground">{t('completion.doneHint')}</p>
            </div>
          </section>
        )}

        {/* Infos du profil */}
        <section className="card-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-navy flex items-center gap-2">
              <UserIcon size={18} className="text-brand" /> {t('profile.about')}
            </h2>
            {!editingProfile && (
              <button
                onClick={openProfileEditor}
                className="text-sm text-brand font-medium flex items-center gap-1 hover:underline"
              >
                <Pencil size={14} /> {t('common.edit')}
              </button>
            )}
          </div>

          {editingProfile ? (
            <div className="space-y-3">
              <input
                type="text"
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                placeholder={t('profile.displayName')}
                className={FIELD_CLASS}
              />
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder={t('profile.titlePh')}
                className={FIELD_CLASS}
              />
              <textarea
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder={t('profile.bioPh')}
                rows={3}
                className={`${FIELD_CLASS} resize-none`}
              />
              <input
                type="text"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder={t('profile.locationPh')}
                className={FIELD_CLASS}
              />
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className={FIELD_CLASS}
              >
                <option value="both">{t('header.both')}</option>
                <option value="freelancer">{t('profile.typeFreelancer')}</option>
                <option value="client">{t('profile.typeClient')}</option>
              </select>
              {profileError && <p className="text-xs text-red-600">{profileError}</p>}
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={savingProfile} className="btn-primary text-sm flex-1 disabled:opacity-60">
                  {savingProfile ? <Loader2 size={14} className="animate-spin mx-auto" /> : t('common.save')}
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="flex items-center justify-center gap-1 border border-border text-muted-foreground text-sm font-medium px-4 rounded-full hover:bg-background"
                >
                  <X size={14} /> {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : u?.bio ? (
            <p className="text-sm text-muted-foreground whitespace-pre-line">{u.bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('profile.aboutEmpty')}
            </p>
          )}
        </section>
        {/* Solde */}
        <section className="card-surface p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('header.balance')}</p>
            <p className="font-heading font-bold text-2xl text-navy">
              {user.balance ?? 0} <span className="text-brand">π</span>
            </p>
          </div>
          <Link to="/orders" className="btn-primary text-sm">{t('orders.title')}</Link>
        </section>

        {/* Recharge du solde interne (top-up Pi) */}
        <RechargeCard balance={user.balance ?? 0} onCredited={refreshUser} />

        {/* Retrait vers le portefeuille Pi */}
        <WithdrawCard
          balance={user.availableBalance ?? Math.max(0, (user.balance ?? 0) - (user.lockedBalance ?? 0))}
          locked={user.lockedBalance ?? 0}
        />

        {/* Outil admin : test A2U (validation Mainnet) — visible admin uniquement */}
        {user.role === 'admin' && <AdminA2UCard />}


        {/* Wallet */}
        <section className="card-surface p-5 space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-navy flex items-center gap-2">
              <Wallet size={18} className="text-brand" /> {t('profile.wallet')}
            </h2>
            {!editing && (
              <button
                onClick={() => { setDraft(serverWallet); setEditing(true); setWalletError(null); }}
                className="text-sm text-brand font-medium flex items-center gap-1 hover:underline"
              >
                <Pencil size={14} /> {serverWallet ? t('common.edit') : t('common.add')}
              </button>
            )}
          </div>

          {/* ── AVERTISSEMENTS (toujours visibles) ── */}
          <div className="rounded-2xl border border-[#DC2626]/40 bg-[#DC2626]/10 p-4 space-y-2">
            <p className="text-xs font-bold text-[#DC2626] flex items-center gap-1.5">
              <AlertTriangle size={14} className="shrink-0" />
              {t('wallet.warning.title')}
            </p>
            <ul className="space-y-1.5 text-xs text-[#B91C1C] list-none">
              <li className="flex gap-2"><span className="shrink-0">🔐</span>{t('wallet.warning.phrase')}</li>
              <li className="flex gap-2"><span className="shrink-0">✅</span>