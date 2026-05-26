// WorkPiServ Pi Network SDK Integration
// يعمل على Sandbox (Testnet) و Mainnet

const APP_ID = import.meta.env.VITE_PI_APP_ID || 'workpiserv';
const API_URL = 'https://workpiserv-backend.onrender.com';

class PiSDK {
  constructor() {
    this.initialized = false;
    this.user = null;
  }

  async init() {
    if (typeof window === 'undefined' || !window.Pi) {
      console.warn('Pi SDK not loaded');
      return false;
    }

    try {
      // Initialize Pi SDK
      // For Sandbox: Pi.init({ version: "2.0", sandbox: true })
      // For Mainnet: Pi.init({ version: "2.0" })

      const isSandbox = import.meta.env.VITE_PI_SANDBOX === 'true';

      window.Pi.init({
        version: "2.0",
        sandbox: isSandbox
      });

      this.initialized = true;
      console.log(`✅ Pi SDK initialized (${isSandbox ? 'Sandbox' : 'Mainnet'})`);
      return true;
    } catch (err) {
      console.error('Pi init error:', err);
      return false;
    }
  }

  async authenticate() {
    if (!this.initialized) await this.init();
    if (!window.Pi) return null;

    try {
      const scopes = ['username', 'payments'];
      const auth = await window.Pi.authenticate(scopes, this.onIncompletePaymentFound);

      // Send to our backend to verify and get JWT
      const res = await fetch(`${API_URL}/api/auth/pi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          user: auth.user
        })
      });

      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        this.user = data.user;
        return data;
      }

      return null;
    } catch (err) {
      console.error('Pi auth error:', err);
      return null;
    }
  }

  async createPayment(orderData, callbacks) {
    if (!this.initialized || !window.Pi) {
      throw new Error('Pi SDK not initialized');
    }

    try {
      const payment = await window.Pi.createPayment({
        amount: orderData.amount,
        memo: orderData.memo || `WorkPiServ Order #${orderData.orderId}`,
        metadata: {
          orderId: orderData.orderId,
          serviceId: orderData.serviceId
        }
      }, {
        onReadyForServerApproval: async (paymentId) => {
          console.log('Payment ready for approval:', paymentId);

          // Call backend to approve with Pi servers
          const res = await fetch(`${API_URL}/api/payments/approve`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ paymentId })
          });

          if (callbacks.onReadyForServerApproval) {
            callbacks.onReadyForServerApproval(paymentId);
          }
        },

        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log('Payment ready for completion:', paymentId, txid);

          // Call backend to complete and verify
          const res = await fetch(`${API_URL}/api/payments/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ paymentId, txid })
          });

          if (callbacks.onReadyForServerCompletion) {
            callbacks.onReadyForServerCompletion(paymentId, txid);
          }
        },

        onCancel: () => {
          console.log('Payment cancelled');
          if (callbacks.onCancel) callbacks.onCancel();
        },

        onError: (error) => {
          console.error('Payment error:', error);
          if (callbacks.onError) callbacks.onError(error);
        }
      });

      return payment;
    } catch (err) {
      console.error('Create payment error:', err);
      throw err;
    }
  }

  onIncompletePaymentFound(payment) {
    console.log('Incomplete payment found:', payment);
    // Handle incomplete payments (optional)
    return Promise.resolve();
  }

  logout() {
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export const piSDK = new PiSDK();
export default piSDK;
