import { useState, useCallback } from 'react';
import { piSDK, isPiBrowser } from '@/lib/pi';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api.onrender.com';

interface PiUser {
  _id: string;
  uid?: string;
  username: string;
  balance: number;
  type: string;
  unreadNotifications: number;
  unreadMessages: number;
  newOrders: number;
  avatar: string;
}

interface UsePiAuthReturn {
  user: PiUser | null;
  loading: boolean;
  error: string | null;
  loggedIn: boolean;
  inPiBrowser: boolean;
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

async function fetchMe(): Promise<PiUser | null> {
  const token = localStorage.getItem('workpiserv_token');
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export function usePiAuth(): UsePiAuthReturn {
  const [user, setUser] = useState<PiUser | null>(() => {
    try {
      const saved = localStorage.getItem('workpiserv_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inPiBrowser = isPiBrowser();

  const refreshUser = useCallback(async () => {
    const fresh = await fetchMe();
    if (fresh) {
      setUser(fresh);
      localStorage.setItem('workpiserv_user', JSON.stringify(fresh));
    }
  }, []);

  const login = useCallback(async () => {
    if (!inPiBrowser) return; // Modal handled in Header

    setLoading(true);
    setError(null);

    try {
      const result = await piSDK.authenticate();
      if (result?.user) {
        // Fetch full profile from backend
        const full = await fetchMe();
        const userData = full || { ...result.user, balance: 0, type: 'both', unreadNotifications: 0, unreadMessages: 0, newOrders: 0, avatar: result.user.username.charAt(0) };
        setUser(userData as PiUser);
        localStorage.setItem('workpiserv_user', JSON.stringify(userData));
      } else {
        setError('Authentication failed. Please try again.');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }, [inPiBrowser]);

  const logout = useCallback(() => {
    piSDK.logout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    loggedIn: !!localStorage.getItem('workpiserv_token') || user !== null,
    inPiBrowser,
    login,
    logout,
    refreshUser,
  };
  }
