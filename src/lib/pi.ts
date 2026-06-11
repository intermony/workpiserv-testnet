// بسم الله الرحمن الرحيم
// WorkPiServ Pi Network SDK Integration

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api.onrender.com';

export function isPiBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  // Le SDK (window.Pi) est chargé partout, y compris dans Chrome.
  // Le vrai Pi Browser s'identifie par son user-agent.
  return /PiBrowser/i.test(navigator.userAgent) && !!window.Pi;
}

interface PiAuthResult {
  user: { uid: string; username: string };
  accessToken: string;
}

interface OrderData {
  amount: number;
  memo?: string;
  serviceId: string;
  package?: string;
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
    if (!window.Pi) return false;
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

  async authenticate(): Promise<{ token: string; user: { uid: string; username: string } } | null> {
    if (!this.initialized) await this.init();
    if (!window.Pi) return null;

    const auth = await window.Pi.authenticate(
      ['username', 'payments'],
      this.onIncompletePaymentFound.bind(this)
    ) as PiAuthResult;

    const res = await fetch(`${API_URL}/api/auth/pi-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pi_uid       : auth.user.uid,
        pi_username  : auth.user.username,
        access_token : auth.accessToken || auth.user.uid,
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');

    if (data.token) {
      localStorage.setItem('workpiserv_token', data.token);
      localStorage.setItem('workpiserv_user', JSON.stringify(data.user));
      this.user = data.user;
      return data;
    }
    return null;
  }

  async createPayment(orderData: OrderData, callbacks: PaymentCallbacks) {
    if (!this.initialized || !window.Pi) throw new Error('Pi SDK not initialized');
    const token = localStorage.getItem('workpiserv_token');
    return await (window.Pi as unknown as { createPayment: (data: unknown, cb: unknown) => Promise<unknown> }).createPayment(
      {
        amount   : orderData.amount,
        memo     : orderData.memo || 'WorkPiServ Order',
        metadata : { serviceId: orderData.serviceId, package: orderData.package || 'Standard' }
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          const res = await fetch(`${API_URL}/api/payments/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ paymentId, serviceId: orderData.serviceId, package: orderData.package || 'Standard', requirements: orderData.requirements || '' })
          });
          callbacks.onReadyForServerApproval?.(paymentId, await res.json());
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          const res = await fetch(`${API_URL}/api/payments/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ paymentId, txid })
          });
          callbacks.onReadyForServerCompletion?.(paymentId, txid, await res.json());
        },
        onCancel : () => callbacks.onCancel?.(),
        onError  : (error: unknown) => callbacks.onError?.(error)
      }
    );
  }

  async onIncompletePaymentFound(payment: unknown) {
    try {
      const token = localStorage.getItem('workpiserv_token');
      await fetch(`${API_URL}/api/payments/incomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentId: (payment as { identifier: string }).identifier })
      });
    } catch (err) { console.error('Incomplete payment error:', err); }
  }

  logout() {
    this.user = null;
    localStorage.removeItem('workpiserv_token');
    localStorage.removeItem('workpiserv_user');
  }
}

export const piSDK = new PiSDK();
export default piSDK;
