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

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api-testnet.onrender.com';

// Adresse publique Pi (format Stellar) : commence par G, 56 caractères
const PI_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/;

// Style commun des champs de saisie — dégradé mauve harmonisé avec le menu, texte clair lisible
const FIELD_CLASS =
  "w-full rounded-xl px-4 py-3 text-sm border border-[#3C3580] " +
  "bg-gradient-to-br from-[#2E2769] to-[#241E52] text-[#ECE9FF] " +
  "placeholder:text-[#9089C8] focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand";

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
  const { user, loading, loggedIn, login, logout, refreshUser } = usePiAuth();
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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
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
        headers: { Authorization: `Bearer ${localStorage.getItem('workpiserv_token')}` },
        body: formData,
      });
      if (!res.ok) throw new Error();
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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pi_wallet_address: value }),
      });
      if (!res.ok) throw new Error();
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
                className="h-full rounded-full bg-gradient-to-r from-brand to-[#B49BFF] transition-all duration-500"
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
            <div className="w-9 h-9 rounded-full bg-[#4ADE80]/15 flex items-center justify-center shrink-0">
              <Check size={18} className="text-[#4ADE80]" />
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
        <WithdrawCard balance={user.balance ?? 0} />

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
          <div className="rounded-2xl border border-[#F87171]/40 bg-[#F87171]/10 p-4 space-y-2">
            <p className="text-xs font-bold text-[#F87171] flex items-center gap-1.5">
              <AlertTriangle size={14} className="shrink-0" />
              {t('wallet.warning.title')}
            </p>
            <ul className="space-y-1.5 text-xs text-[#FCA5A5] list-none">
              <li className="flex gap-2"><span className="shrink-0">🔐</span>{t('wallet.warning.phrase')}</li>
              <li className="flex gap-2"><span className="shrink-0">✅</span>{t('wallet.warning.publicOnly')}</li>
              <li className="flex gap-2"><span className="shrink-0">⚠️</span>{t('wallet.warning.verify')}</li>
              <li className="flex gap-2"><span className="shrink-0">❌</span>{t('wallet.warning.noRecover')}</li>
            </ul>
          </div>

          {/* ── Explication format ── */}
          <div className="rounded-2xl border border-[#60A5FA]/30 bg-[#60A5FA]/10 p-3 flex gap-2">
            <Info size={14} className="text-[#60A5FA] shrink-0 mt-0.5" />
            <p className="text-xs text-[#93C5FD]">{t('wallet.info.format')}</p>
          </div>

          {/* ── Formulaire ou affichage ── */}
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value.trim().toUpperCase())}
                placeholder="GABC... (56 caractères, commence par G)"
                spellCheck={false}
                autoCapitalize="characters"
                maxLength={56}
                className={`${FIELD_CLASS} font-mono`}
              />
              {/* Compteur de caractères */}
              <div className="flex justify-between items-center">
                <span className={`text-xs font-mono ${draft.length === 56 ? 'text-[#4ADE80]' : 'text-muted-foreground'}`}>
                  {draft.length}/56 {draft.length === 56 ? '✓' : ''}
                </span>
                {draft.length > 0 && !draft.startsWith('G') && (
                  <span className="text-xs text-[#F87171]">⚠️ Doit commencer par G</span>
                )}
              </div>
              {walletError && (
                <p className="text-xs text-[#F87171] flex items-center gap-1">
                  <AlertTriangle size={12} /> {walletError}
                </p>
              )}
              {/* Confirmation avant sauvegarde */}
              {draft.length === 56 && draft.startsWith('G') && (
                <div className="rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/40 p-3">
                  <p className="text-xs text-[#FBBF24] font-medium mb-1">⚠️ {t('wallet.confirm.title')}</p>
                  <code className="text-[10px] text-[#FDE68A] break-all block">{draft}</code>
                  <p className="text-xs text-[#FCD34D] mt-1">{t('wallet.confirm.hint')}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={saveWallet} disabled={saving || draft.length !== 56 || !draft.startsWith('G')}
                  className="btn-primary text-sm flex-1 disabled:opacity-40">
                  {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : t('common.save')}
                </button>
                <button onClick={() => { setEditing(false); setWalletError(null); }}
                  className="flex items-center justify-center gap-1 border border-border text-muted-foreground text-sm font-medium px-4 rounded-full hover:bg-background">
                  <X size={14} /> {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : serverWallet ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-3">
                <ShieldCheck size={16} className="text-[#4ADE80] shrink-0" />
                <code className="text-xs text-foreground truncate flex-1">{serverWallet}</code>
                <button onClick={copyWallet}
                  className="text-muted-foreground hover:text-brand transition-colors shrink-0"
                  aria-label="Copy wallet address">
                  {copied ? <Check size={16} className="text-[#4ADE80]" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">{t('wallet.info.escrow')}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('profile.walletEmpty')}</p>
          )}
        </section>

        {/* Raccourcis */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: 'nav.orders',        icon: Package,       href: '/orders' },
            { label: 'nav.messages',      icon: MessageCircle, href: '/messages' },
            { label: 'profile.shortSell', icon: PlusCircle,    href: '/create-service' },
          ].map(item => (
            <Link
              key={item.label}
              to={item.href}
              className="card-surface-hover p-4 flex flex-col items-center gap-2 text-center"
            >
              <item.icon size={22} className="text-brand" />
              <span className="text-xs font-medium text-foreground">{t(item.label)}</span>
            </Link>
          ))}
        </section>

        {/* Déconnexion */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 border border-[#F87171]/40 text-[#F87171] font-medium text-sm py-3 rounded-full hover:bg-[#F87171]/10 transition-colors"
        >
          <LogOut size={16} /> {t('header.logout')}
        </button>
      </div>

      {/* ── MODAL PHOTO DE PROFIL ── */}
      {photoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPhotoModal(false)} />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-4 mx-0 sm:mx-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-navy flex items-center gap-2">
                <Camera size={18} className="text-brand" /> {t('profile.changePhoto')}
              </h3>
              <button onClick={() => setPhotoModal(false)} className="p-2 rounded-xl hover:bg-background">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            {/* Preview */}
            <div className="flex justify-center">
              <Avatar avatar={user?.avatar} size={96} />
            </div>
            {/* Tips */}
            <div className="rounded-2xl border border-[#60A5FA]/30 bg-[#60A5FA]/10 p-3 text-xs text-[#93C5FD] space-y-1">
              <p>{t('profile.photoTipSquare')}</p>
              <p>{t('profile.photoTipFormat')}</p>
              <p>{t('profile.photoTipSize')}</p>
            </div>
            {photoError && <p className="text-xs text-[#F87171] flex items-center gap-1"><AlertTriangle size={12}/> {photoError}</p>}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
            <div className="flex gap-3">
              <button onClick={() => setPhotoModal(false)}
                className="flex-1 py-3 rounded-2xl border border-border text-muted-foreground text-sm font-medium hover:bg-background">
                {t('common.cancel')}
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={photoUploading}
                className="flex-1 py-3 rounded-2xl bg-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {photoUploading ? <><Loader2 size={14} className="animate-spin" /> {t('profile.uploading')}</> : <><Camera size={14} /> {t('profile.choosePhoto')}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
