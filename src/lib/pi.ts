// بسم الله الرحمن الرحيم
// WorkPiServ Pi Network SDK Integration

import { API_BASE_URL as API_URL, PI_SANDBOX, apiHeaders } from '@/config/network';
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

// ── Réseaux mobiles instables (3G/4G) : timeout par tentative + UN retry ──
// Une requête qui pend sur un socket 3G moribond est avortée à 12 s ;
// une seule nouvelle tentative est faite après 1,5 s. Au-delà, l'échec
// est typé NETWORK_UNSTABLE pour que l'UI affiche un message clair.
const LOGIN_TIMEOUT_MS = 12000;
const LOGIN_RETRY_DELAY_MS = 1500;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class LoginError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message || code);
    this.code = code;
  }
}

interface OrderData {
  amount: number;
  memo?: string;
  serviceId: string;
  package?: string;
  requirements?: string;
  orderId?: string; // commande pré-créée (prix en USD) → transmise à /approve pour vérifier le verrou de taux
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
      const isSandbox = PI_SANDBOX; // déduit du hostname (testnet.* → sandbox)
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

    // Appel backend avec timeout + un retry automatique (GSM instable)
    const loginInit: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiHeaders() },
      body: JSON.stringify({
        pi_uid       : auth.user.uid,
        pi_username  : auth.user.username,
        access_token : auth.accessToken,
      })
    };
    let res: Response | null = null;
    let lastNetworkErr: unknown = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        res = await fetchWithTimeout(`${API_URL}/api/auth/pi-login`, loginInit, LOGIN_TIMEOUT_MS);
        break;
      } catch (e) {
        lastNetworkErr = e; // réseau coupé / timeout — le serveur n'a rien reçu
        if (attempt === 1) await new Promise(r => setTimeout(r, LOGIN_RETRY_DELAY_MS));
      }
    }
    if (!res) {
      console.error('Login: échec réseau après retry —', lastNetworkErr);
      throw new LoginError('NETWORK_UNSTABLE');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new LoginError(data.code || 'AUTH_FAILED', data.error || 'Authentication failed');

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
            body: JSON.stringify({ paymentId, serviceId: orderData.serviceId, package: orderData.package || 'Standard', requirements: orderData.requirements || '', order_id: orderData.orderId })
          });
          callbacks.onReadyForServerApproval?.(paymentId, await res.json());
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          const res = await fetch(`${API_URL}/api/payments/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ paymentId, txid, order_id: orderData.orderId })
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
