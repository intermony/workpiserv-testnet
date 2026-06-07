// بسم الله الرحمن الرحيم
// WorkPiServ Pi Network SDK Integration
// Connecté au backend workpiserv-backend sur Render + MongoDB Atlas

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api.onrender.com';

export function isPiBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('pibrowser') || ua.includes('pi network') || ua.includes('pinetwork');
}

interface PiAuthResult {
  user: { uid: string; username: string };
  accessToken: string;
}

interface OrderData {
  amount: number;
  memo?: string;
  serviceId: string;
  requirements?: string;
}

interface PaymentCallbacks {
  onReadyForServerApproval?: (paymentId: string, data: unknown) => void;
  onReadyForServerCompletion?: (paymentId: string, txid: string, data: unknown) => void;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}

class PiSDK {
  private initialized = false;
  public user: unknown = null;

  async init(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.Pi) {
      console.warn('Pi SDK not available');
      return false;
    }
    try {
      const isSandbox = import.meta.env.VITE_PI_SANDBOX === 'true';
      window.Pi.init({ version: '2.0', sandbox: isSandbox });
      this.initialized = true;
      console.log(`✅ Pi SDK initialized (${isSandbox ? 'Sandbox' : 'Mainnet'})`);
      return true;
    } catch (err) {
      console.error('Pi init error:', err);
      return false;
    }
  }

  async authenticate(): Promise<{ token: string; user: { uid: string; username: string }; isNew?: boolean; piUserId?: string; username?: string } | null> {
    if (!this.initialized) await this.init();
    if (!window.Pi) return null;

    try {
      // 1. Authenticate with Pi SDK — get user + accessToken
      const auth = await window.Pi.authenticate(
        ['username', 'payments'],
        this.onIncompletePaymentFound.bind(this)
      ) as PiAuthResult;

      // 2. Send to backend with REAL accessToken
      const res = await fetch(`${API_URL}/api/auth/pi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: auth.user,
          accessToken: auth.accessToken  // ✅ vrai token, pas vide
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // 3. New user — register automatically (type: 'both')
      if (data.isNew) {
        const regRes = await fetch(`${API_URL}/api/auth/pi/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            piUserId: data.piUserId,
            username: data.username
          })
        });
        const regData = await regRes.json();
        if (regData.token) {
          localStorage.setItem('workpiserv_token', regData.token);
          localStorage.setItem('workpiserv_user', JSON.stringify(regData.user));
          this.user = regData.user;
          return regData;
        }
        return null;
      }

      // 4. Existing user — store token + user
      if (data.token) {
        localStorage.setItem('workpiserv_token', data.token);
        localStorage.setItem('workpiserv_user', JSON.stringify(data.user));
        this.user = data.user;
        return data;
      }

      return null;
    } catch (err) {
      console.error('Pi auth error:', err);
      throw err;
    }
  }

  async createPayment(orderData: OrderData, callbacks: PaymentCallbacks) {
    if (!this.initialized || !window.Pi) throw new Error('Pi SDK not initialized');

    const token = localStorage.getItem('workpiserv_token');

    try {
      const payment = await (window.Pi as unknown as {
        createPayment: (data: unknown, callbacks: unknown) => Promise<unknown>
      }).createPayment(
        {
          amount: orderData.amount,
          memo: orderData.memo || 'WorkPiServ Order',
          metadata: { serviceId: orderData.serviceId }
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            const res = await fetch(`${API_URL}/api/payments/approve`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ paymentId, serviceId: orderData.serviceId, requirements: orderData.requirements || '' })
            });
            const data = await res.json();
            callbacks.onReadyForServerApproval?.(paymentId, data);
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            const res = await fetch(`${API_URL}/api/payments/complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ paymentId, txid })
            });
            const data = await res.json();
            callbacks.onReadyForServerCompletion?.(paymentId, txid, data);
          },
          onCancel: () => callbacks.onCancel?.(),
          onError: (error: unknown) => callbacks.onError?.(error)
        }
      );
      return payment;
    } catch (err) {
      console.error('Create payment error:', err);
      throw err;
    }
  }

  async onIncompletePaymentFound(payment: unknown) {
    console.log('Incomplete payment found:', payment);
    try {
      const token = localStorage.getItem('workpiserv_token');
      await fetch(`${API_URL}/api/payments/incomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ paymentId: (payment as { identifier: string }).identifier })
      });
    } catch (err) {
      console.error('Incomplete payment error:', err);
    }
  }

  logout() {
    this.user = null;
    localStorage.removeItem('workpiserv_token');
    localStorage.removeItem('workpiserv_user');
  }
}

export const piSDK = new PiSDK();
export default piSDK;
