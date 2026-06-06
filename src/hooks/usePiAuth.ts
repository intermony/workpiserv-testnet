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
  inPiBrowser: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

// Detect Pi Browser
function detectPiBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.Pi;
}

// Detect user language (system/browser)
function getPiBrowserMessage(): string {
  const lang = navigator.language?.toLowerCase() || 'en';
  
  if (lang.startsWith('ar')) {
    return 'افتح WorkPiServ في تطبيق Pi Browser لتسجيل الدخول والمعاملات الحقيقية';
  }
  if (lang.startsWith('fr')) {
    return 'Ouvrez WorkPiServ dans Pi Browser pour vous connecter et effectuer de vraies transactions';
  }
  // Default English
  return 'Open WorkPiServ in the Pi Browser app to login and make real transactions';
}

// Init Pi SDK if available
if (typeof window !== 'undefined' && window.Pi) {
  try {
    window.Pi.init({ version: '2.0', sandbox: false }); // sandbox: false = production
  } catch (e) {
    console.warn('Pi SDK init:', e);
  }
}

export function usePiAuth(): UsePiAuthReturn {
  const [user, setUser] = useState<PiUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inPiBrowser = detectPiBrowser();

  const login = useCallback(async () => {
    // Not in Pi Browser — show multilingual message
    if (!inPiBrowser) {
      setError(getPiBrowserMessage());
      setTimeout(() => setError(null), 6000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const auth = await window.Pi!.authenticate(
        ['username', 'payments'],
        (payment) => {
          console.warn('Incomplete payment — sending to backend:', payment);
          // TODO: send to backend to resolve incomplete payment
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
  }, [inPiBrowser]);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    loggedIn: isLoggedIn() || user !== null,
    inPiBrowser,
    login,
    logout,
  };
}
