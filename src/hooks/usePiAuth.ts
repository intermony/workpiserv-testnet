import { useState, useCallback } from 'react';
import { piSDK, isPiBrowser } from '@/lib/pi';

interface PiUser {
  uid: string;
  username: string;
}

interface UsePiAuthReturn {
  user: PiUser | null;
  loading: boolean;
  error: string | null;
  loggedIn: boolean;
  inPiBrowser: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

function getPiBrowserMessage(): string {
  const lang = navigator.language?.toLowerCase() || 'en';
  if (lang.startsWith('ar')) return 'افتح WorkPiServ في تطبيق Pi Browser لتسجيل الدخول والمعاملات الحقيقية';
  if (lang.startsWith('fr')) return 'Ouvrez WorkPiServ dans Pi Browser pour vous connecter et effectuer de vraies transactions';
  return 'Open WorkPiServ in the Pi Browser app to login and make real transactions';
}

export function usePiAuth(): UsePiAuthReturn {
  const [user, setUser] = useState<PiUser | null>(() => {
    // Restore user from localStorage on page reload
    const saved = localStorage.getItem('workpiserv_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inPiBrowser = isPiBrowser();

  const login = useCallback(async () => {
    if (!inPiBrowser) {
      setError(getPiBrowserMessage());
      setTimeout(() => setError(null), 6000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await piSDK.authenticate();
      if (result?.user) {
        setUser({ uid: result.user.uid, username: result.user.username });
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
  };
}
