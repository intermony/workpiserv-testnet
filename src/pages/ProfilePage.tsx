import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Wallet, Copy, Check, Pencil, X, LogOut, Package,
  MessageCircle, PlusCircle, Shield, Loader2, User as UserIcon,
  MapPin, Star,
} from 'lucide-react';
import { usePiAuth } from '@/hooks/usePiAuth';
import { piSdkAvailable } from '@/lib/pi';
import { useLanguage } from '@/i18n';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api.onrender.com';

// Adresse publique Pi (format Stellar) : commence par G, 56 caractères
const PI_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/;

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
  const [copied, setCopied]           = useState(false);

  useEffect(() => {
    // Rafraîchit le profil à l'arrivée sur la page (wallet à jour)
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <p className="text-gray-500 text-sm">{t('profile.loading')}</p>
        </div>
      </main>
    );
  }

  // Vue publique minimale d'un autre utilisateur
  if (!isOwnProfile) {
    return (
      <main className="min-h-screen pb-24">
        <div className="bg-white border-b border-gray-200">
          <div className="section-container py-8">
            <div className="text-sm text-gray-500 mb-2">
              <Link to="/" className="text-brand hover:underline">{t('nav.home')}</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-700">{t('nav.profile')}</span>
            </div>
            <div className="flex items-center gap-4">
              <Avatar avatar="👤" />
              <div>
                <h1 className="font-heading font-bold text-2xl text-navy">@{paramUsername}</h1>
                <p className="text-sm text-gray-500">{t('profile.pioneer')}</p>
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
          <h2 className="font-semibold text-gray-700 mb-2">{t('profile.notSignedIn')}</h2>
          <p className="text-sm text-gray-500 mb-4">
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

  return (
    <main className="min-h-screen pb-24 bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200">
        <div className="section-container py-8">
          <div className="text-sm text-gray-500 mb-4">
            <Link to="/" className="text-brand hover:underline">{t('nav.home')}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{t('profile.title')}</span>
          </div>

          <div className="flex items-center gap-4">
            <Avatar avatar={user.avatar} />
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-2xl text-navy truncate">
                {u?.displayName || `@${user.username}`}
              </h1>
              {u?.displayName && (
                <p className="text-sm text-gray-500 truncate">@{user.username}</p>
              )}
              {u?.title && (
                <p className="text-sm text-gray-700 mt-0.5 truncate">{u.title}</p>
              )}
              <div className="flex items-center flex-wrap gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-brand bg-brand-light px-2.5 py-1 rounded-full capitalize">
                  <Shield size={12} /> {user.type || 'Pioneer'}
                </span>
                {u?.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={12} /> {u.location}
                  </span>
                )}
                {(u?.rating ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <Star size={12} className="text-amber-500 fill-amber-500" /> {u?.rating}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-container py-6 space-y-4">
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
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder={t('profile.titlePh')}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
              <textarea
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder={t('profile.bioPh')}
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
              />
              <input
                type="text"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder={t('profile.locationPh')}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
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
                  className="flex items-center justify-center gap-1 border border-gray-300 text-gray-600 text-sm font-medium px-4 rounded-full hover:bg-gray-50"
                >
                  <X size={14} /> {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : u?.bio ? (
            <p className="text-sm text-gray-600 whitespace-pre-line">{u.bio}</p>
          ) : (
            <p className="text-sm text-gray-500">
              {t('profile.aboutEmpty')}
            </p>
          )}
        </section>
        {/* Solde */}
        <section className="card-surface p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('header.balance')}</p>
            <p className="font-heading font-bold text-2xl text-navy">
              {user.balance ?? 0} <span className="text-brand">π</span>
            </p>
          </div>
          <Link to="/orders" className="btn-primary text-sm">{t('orders.title')}</Link>
        </section>

        {/* Wallet */}
        <section className="card-surface p-5">
          <div className="flex items-center justify-between mb-3">
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

          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="G... (56 characters)"
                spellCheck={false}
                autoCapitalize="characters"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
              {walletError && <p className="text-xs text-red-600">{walletError}</p>}
              <div className="flex gap-2">
                <button onClick={saveWallet} disabled={saving} className="btn-primary text-sm flex-1 disabled:opacity-60">
                  {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : t('common.save')}
                </button>
                <button
                  onClick={() => { setEditing(false); setWalletError(null); }}
                  className="flex items-center justify-center gap-1 border border-gray-300 text-gray-600 text-sm font-medium px-4 rounded-full hover:bg-gray-50"
                >
                  <X size={14} /> {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : serverWallet ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <code className="text-xs text-gray-700 truncate flex-1">{serverWallet}</code>
              <button
                onClick={copyWallet}
                className="text-gray-400 hover:text-brand transition-colors shrink-0"
                aria-label="Copy wallet address"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {t('profile.walletEmpty')}
            </p>
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
              <span className="text-xs font-medium text-gray-700">{t(item.label)}</span>
            </Link>
          ))}
        </section>

        {/* Déconnexion */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 font-medium text-sm py-3 rounded-full hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} /> {t('header.logout')}
        </button>
      </div>
    </main>
  );
}
