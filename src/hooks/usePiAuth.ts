import { useState, useCallback } from 'react';
import { loginWithPi, logout as apiLogout, isLoggedIn } from '@/lib/api';

interface PiUser {
  uid: string;
  username: string;
}

interface UsePiAuthReturn {
  user: PiUser | null;
  loading: boolean;
  error: string | null;
  loggedIn: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

export function usePiAuth(): UsePiAuthReturn {
  const [user, setUser] = useState<PiUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async () => {
    // Check Pi SDK availability at click time, not render time
    if (!window.Pi) {
      setError('Please open WorkPiServ inside the Pi Browser app to login.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Init Pi SDK just before authenticate
      window.Pi.init({ version: '2.0', sandbox: true });

      const auth = await window.Pi.authenticate(
        ['username', 'payments'],
        (payment) => {
          console.warn('Incomplete payment found:', payment);
        }
      );

      await loginWithPi(auth.user.uid, auth.user.username, '');
      setUser({ uid: auth.user.uid, username: auth.user.username });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    loggedIn: isLoggedIn() || user !== null,
    login,
    logout,
  };
}
