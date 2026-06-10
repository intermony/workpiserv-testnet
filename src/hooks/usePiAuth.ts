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
  isNewUser?: boolean;
}

interface UsePiAuthReturn {
  user: PiUser | null;
  loading: boolean;
  error: string | null;
  loggedIn: boolean;
  inPiBrowser: boolean;
  isNewUser: boolean;
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearNewUser: () => void;
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
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const inPiBrowser = isPiBrowser();

  const refreshUser = useCallback(async () => {
    const fresh = await fetchMe();
    if (fresh) {
      setUser(fresh);
      localStorage.setItem('workpiserv_user', JSON.stringify(fresh));
    }
  }, []);

  const login = useCallback(async () => {
    if (!inPiBrowser) return;
    setLoading(true);
    setError(null);

    try {
      const result = await piSDK.authenticate();
      if (result?.user) {
        // Envoyer au backend et récupérer le token
        const res = await fetch(`${API_URL}/api/auth/pi-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pi_uid      : result.user.uid,
            pi_username : result.user.username,
            access_token: result.user.uid,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // Détecter si c'est un nouveau Pioneer
          const firstLoginKey = `wps_first_${result.user.uid}`;
          const alreadySeen = localStorage.getItem(firstLoginKey);
          if (!alreadySeen) {
            setIsNewUser(true);
            localStorage.setItem(firstLoginKey, '1');
          }

          localStorage.setItem('workpiserv_token', data.token);
          localStorage.setItem('workpiserv_user', JSON.stringify(data.user));
          setUser(data.user);
        } else {
          setError('Authentication failed. Please try again.');
          setTimeout(() => setError(null), 5000);
        }
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
    localStorage.removeItem('workpiserv_token');
    localStorage.removeItem('workpiserv_user');
  }, []);

  const clearNewUser = useCallback(() => {
    setIsNewUser(false);
  }, []);

  return {
    user,
    loading,
    error,
    loggedIn: !!localStorage.getItem('workpiserv_token') || user !== null,
    inPiBrowser,
    isNewUser,
    login,
    logout,
    refreshUser,
    clearNewUser,
  };
         }
