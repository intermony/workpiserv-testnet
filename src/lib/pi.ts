// بسم الله الرحمن الرحيم
// WorkPiServ Pi Network SDK Integration

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api.onrender.com';

// Le SDK est-il chargé ? (vrai partout : Chrome, Pi Browser...)
export function piSdkAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.Pi;
}

export function isMobileDevice(): boolean {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
}

// Le script SDK de Pi (sdk.minepi.com) se charge en parallèle de la page.
// Sur mobile, il peut arriver APRÈS le clic de l'utilisateur : on lui laisse
// jusqu'à `timeoutMs` pour apparaître avant de conclure à son absence.
export function waitForPiSDK(timeoutMs = 5000): Promise<boolean> {
  return new Promise(resolve => {
    if (piSdkAvailable()) { resolve(true); return; }
    const started = Date.now();
    const timer = setInterval(() => {
      if (piSdkAvailable()) { clearInterval(timer); resolve(true); }
      else if (Date.now() - started > timeoutMs) { clearInterval(timer); resolve(false); }
    }, 200);
  });
}

// Détection STRICTE du Pi Browser (utilisée pour l'auto-login uniquement).
// Certaines versions du Pi Browser ne s'identifient pas dans le user-agent :
// dans ce cas le login manuel fonctionne quand même (tentative réelle + timeout).
export function isPiBrowser(): boolean {
  return piSdkAvailable() && /PiBrowser/i.test(navigator.userAgent);
}

// Détection Pi Browser par User-Agent UNIQUEMENT (sans attendre le SDK).
// Fiable dès le premier instant, même si window.Pi n'est pas encore chargé.
// Utilisé pour ne JAMAIS afficher le modal "Ouvrez dans Pi Browser"
// à quelqu'un qui est déjà dans Pi Browser.
export function isPiBrowserUA(): boolean {
  return typeof navigator !== 'undefined' && /PiBrowser/i.test(navigator.userAgent);
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
      ['username', 'payments', 'wallet_address'],
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

  // Recharge du solde interne (top-up U2A).
  // Le backend reconnaît la recharge via metadata.type === 'wallet_topup'
  // sur les routes /api/payments/approve et /api/payments/complete.
  // Le crédit du solde est fait UNE SEULE FOIS côté serveur (atomique).
  async topUpWallet(amount: number, callbacks: PaymentCallbacks) {
    if (!this.initialized) await this.init();
    if (!window.Pi) throw new Error('Pi SDK not initialized');

    // createPayment exige une session Pi VIVANTE avec le scope 'payments'
    // dans l'onglet courant. Sur la page profil chargée depuis un token
    // existant, authenticate() n'est pas rejoué (usePiAuth ne fait qu'un
    // refreshUser). On (re)joue donc l'auth ici : ça établit la session,
    // garantit le scope, et déclenche le handler de paiement incomplet.
    await window.Pi.authenticate(
      ['username', 'payments', 'wallet_address'],
      this.onIncompletePaymentFound.bind(this)
    );

    const token = localStorage.getItem('workpiserv_token');
    return await (window.Pi as unknown as { createPayment: (data: unknown, cb: unknown) => Promise<unknown> }).createPayment(
      {
        amount,
        memo     : 'WorkPiServ — Recharge du solde',
        metadata : { type: 'wallet_topup' }
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          const res = await fetch(`${API_URL}/api/payments/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ paymentId })
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
