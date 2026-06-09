import { AvatarUpload } from '@/components/AvatarUpload';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Star,
  MessageCircle, Share2, Edit3, LayoutGrid, User, Settings, LogIn, Plus
} from 'lucide-react';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { StarRating } from '@/components/shared/StarRating';
import { ServiceCard } from '@/components/shared/ServiceCard';
import { usePiAuth } from '@/hooks/usePiAuth';
import type { Service } from '@/types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api.onrender.com';

const profileTabs = [
  { key: 'services', label: 'Services', icon: LayoutGrid },
  { key: 'reviews',  label: 'Reviews',  icon: Star },
  { key: 'about',    label: 'About',    icon: User },
  { key: 'settings', label: 'Settings', icon: Settings },
];

interface ProfileData {
  _id: string;
  username: string;
  displayName?: string;
  title?: string;
  bio?: string;
  location?: string;
  avatar?: string;
  memberSince?: string;
  rating?: number;
  completedOrders?: number;
  completionRate?: number;
  responseTime?: string;
  yearsExp?: number;
  skills?: string[];
  languages?: { name: string; level: string; flag: string }[];
  balance?: number;
  type?: string;
  online?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeService(s: any): Service {
  const freelancerId = s.freelancerId || {};
  return {
    id          : s._id || s.id,
    title       : s.title,
    category    : s.category,
    rating      : s.rating || 0,
    reviewCount : s.reviews || 0,
    price       : s.price,
    deliveryDays: s.deliveryDays || 3,
    image       : s.image || '/images/service-default.jpg',
    escrow      : true,
    description : s.description,
    freelancer  : {
      id          : freelancerId._id || '',
      name        : freelancerId.username || 'Pioneer',
      username    : freelancerId.username || '',
      avatar      : freelancerId.avatar || '👤',
      title       : 'Freelancer on WorkπServ',
      verified    : false,
      location    : 'Pi Network',
      memberSince : '',
      rating      : freelancerId.rating || 0,
      orders      : 0,
      completion  : '—',
      responseTime: '—',
      yearsExp    : 0,
    },
  };
}

export default function ProfilePage() {
  const [activeTab, setActiveTab]     = useState('services');
  const [profile, setProfile]         = useState<ProfileData | null>(null);
  const [myServices, setMyServices]   = useState<Service[]>([]);
  const [loading, setLoading]         = useState(true);
  const { user, loggedIn, inPiBrowser, login } = usePiAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      let token: string | null = null;
      try { token = localStorage.getItem('workpiserv_token'); } catch { token = null; }
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          // Fetch this user's services
          const sRes = await fetch(`${API_URL}/api/services?freelancer=${data._id}`);
          if (sRes.ok) {
            const sData = await sRes.json();
            const raw = Array.isArray(sData) ? sData : sData.services || [];
            setMyServices(raw.map(normalizeService));
          }
        }
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  // Not logged in
  if (!loggedIn && !loading) {
    return (
      <main className="min-h-screen pb-20 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={36} className="text-brand" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-navy mb-2">Your Profile</h2>
          <p className="text-gray-500 mb-6">Login with Pi to access your profile</p>
          {inPiBrowser ? (
            <button onClick={login} className="btn-primary flex items-center gap-2 mx-auto">
              <LogIn size={18} /> Login with π
            </button>
          ) : (
            <p className="text-sm text-gray-400">Open WorkπServ in Pi Browser to login</p>
          )}
        </div>
      </main>
    );
  }

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen pb-20">
        <div className="h-48 lg:h-72 bg-gradient-to-br from-navy to-[#312E81] rounded-b-3xl animate-pulse" />
        <div className="section-container -mt-12 relative z-10">
          <div className="card-surface p-6 animate-pulse">
            <div className="flex gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 -mt-20" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-6 bg-gray-200 rounded w-40" />
                <div className="h-4 bg-gray-200 rounded w-60" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const displayName   = profile?.displayName || profile?.username || user?.username || 'Pioneer';
  const username      = profile?.username || user?.username || '';
  const title         = profile?.title || 'Client & Freelancer on WorkπServ';
  const bio           = profile?.bio || 'Welcome to WorkπServ! Start by browsing services or creating your own.';
  const location      = profile?.location || 'Pi Network';
  const memberSince   = profile?.memberSince
    ? new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'June 2026';
  const rating          = profile?.rating || 0;
  const completedOrders = profile?.completedOrders || 0;
  const balance         = profile?.balance || 0;
  const skills          = profile?.skills || [];
  const languages       = profile?.languages || [];

  const stats = [
    { value: rating > 0 ? rating.toFixed(1) : '—', label: 'Rating' },
    { value: completedOrders,                        label: 'Orders' },
    { value: profile?.completionRate ? `${profile.completionRate}%` : '—', label: 'Completion' },
    { value: profile?.responseTime || '—',           label: 'Response' },
    { value: profile?.yearsExp || '—',               label: 'Years' },
  ];

  return (
    <main className="min-h-screen pb-20">
      {/* Cover */}
      <div className="h-48 lg:h-72 bg-gradient-to-br from-navy to-[#312E81] rounded-b-3xl" />

      <div className="section-container -mt-12 lg:-mt-16 relative z-10">
        <ScrollReveal>
          <div className="card-surface p-6 shadow-lg">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="-mt-20 md:-mt-24 mx-auto md:mx-0">
                <AvatarUpload
                  currentAvatar={profile?.avatar}
                  username={username}
                  displayName={displayName}
                  onUpload={async (file) => {
                    let token: string | null = null;
                    try { token = localStorage.getItem('workpiserv_token'); } catch { token = null; }
                    if (!token) throw new Error('Non authentifié');
                    const formData = new FormData();
                    formData.append('avatar', file);
                    const res = await fetch(`${API_URL}/api/users/avatar`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error((err as { message?: string }).message || 'Upload failed');
                    }
                    const data = await res.json();
                    setProfile(prev => prev ? { ...prev, avatar: data.avatarUrl } : prev);
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h1 className="font-heading font-bold text-2xl text-navy">{displayName}</h1>
                  {profile?.online && (
                    <span className="flex items-center gap-1 text-sm text-green-500 font-medium mx-auto md:mx-0">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Online
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">@{username}</p>
                <p className="text-gray-600 mt-1">{title}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {location}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> Member since {memberSince}</span>
                </div>

                {/* Balance */}
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-brand-light rounded-full">
                  <span className="text-sm font-bold text-brand">π {balance.toFixed(2)}</span>
                  <span className="text-xs text-gray-500">balance</span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                  <button className="btn-primary text-sm py-2 px-5 flex items-center gap-2">
                    <MessageCircle size={16} /> Messages
                  </button>
                  <button className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
                    <Share2 size={16} /> Share
                  </button>
                  <button onClick={() => setActiveTab('settings')} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                    <Edit3 size={16} /> Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-100">
              {stats.map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="font-bold text-navy text-lg">{stat.value}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <div className="mt-6 sticky top-16 z-30 bg-[#F3F4F6] pt-2">
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1 overflow-x-auto">
            {profileTabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key ? 'bg-brand-light text-brand' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div>
                  {/* Header with Create button */}
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-navy text-lg">
                      My Services <span className="text-gray-400 text-sm font-normal">({myServices.length})</span>
                    </h2>
                    <button
                      onClick={() => navigate('/create-service')}
                      className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                    >
                      <Plus size={16} /> Create Service
                    </button>
                  </div>

                  {myServices.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {myServices.map((service, index) => (
                        <ServiceCard key={service.id} service={service} index={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="card-surface p-12 text-center">
                      <LayoutGrid size={48} className="text-gray-300 mx-auto mb-4" />
                      <h3 className="font-heading font-bold text-lg text-navy mb-2">No services yet</h3>
                      <p className="text-gray-500 mb-6">Create your first service and start earning Pi</p>
                      <button
                        onClick={() => navigate('/create-service')}
                        className="btn-primary flex items-center gap-2 mx-auto"
                      >
                        <Plus size={18} /> Create a Service
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="card-surface p-6">
                  {rating > 0 ? (
                    <div className="text-center">
                      <div className="text-5xl font-bold text-navy">{rating.toFixed(1)}</div>
                      <StarRating rating={rating} size={24} className="mt-2 justify-center" />
                      <p className="text-sm text-gray-500 mt-1">{completedOrders} completed orders</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star size={48} className="text-gray-300 mx-auto mb-4" />
                      <h3 className="font-heading font-bold text-lg text-navy mb-2">No reviews yet</h3>
                      <p className="text-gray-500">Complete your first order to get reviews</p>
                    </div>
                  )}
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div className="card-surface p-6">
                    <h3 className="font-heading font-bold text-lg text-navy mb-4">About Me</h3>
                    <p className="text-gray-600 leading-relaxed">{bio}</p>
                  </div>
                  {skills.length > 0 && (
                    <div className="card-surface p-6">
                      <h3 className="font-heading font-bold text-lg text-navy mb-4">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.map(skill => (
                          <span key={skill} className="px-4 py-2 border border-brand/30 text-brand text-sm rounded-full">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {languages.length > 0 && (
                    <div className="card-surface p-6">
                      <h3 className="font-heading font-bold text-lg text-navy mb-4">Languages</h3>
                      <div className="space-y-3">
                        {languages.map(lang => (
                          <div key={lang.name} className="flex items-center gap-3">
                            <span className="text-lg">{lang.flag}</span>
                            <span className="text-sm text-gray-700">{lang.name}</span>
                            <span className="text-xs text-gray-400 ml-auto">{lang.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="max-w-2xl">
                  <div className="card-surface p-6">
                    <h3 className="font-heading font-bold text-lg text-navy mb-6">Personal Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Pi Username</label>
                        <input type="text" value={`@${username}`} readOnly className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base bg-gray-50 text-gray-500 cursor-not-allowed" />
                        <p className="text-xs text-gray-400 mt-1">Pi username cannot be changed</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
                        <input type="text" defaultValue={displayName} className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Professional Title</label>
                        <input type="text" defaultValue={title} className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                        <textarea defaultValue={bio} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-y" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                        <input type="text" defaultValue={location} className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all" />
                      </div>
                    </div>
                    <div className="mt-6">
                      <button className="btn-primary w-full py-3">Save Changes</button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
