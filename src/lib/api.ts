// WorkPiServ API client - connects to FastAPI backend on Render
// Switch BACKEND_URL for local dev vs production

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api.onrender.com';

// ──────────────────────────────────────────────
// Generic fetch helper with JWT support
// ──────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('workpiserv_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const res = await fetch(`${BACKEND_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────
export async function loginWithPi(piUID: string, piUsername: string, accessToken: string) {
  const data = await apiFetch<{ access_token: string; token_type: string }>('/auth/pi-login', {
    method: 'POST',
    body: JSON.stringify({ pi_uid: piUID, pi_username: piUsername, access_token: accessToken }),
  });
  localStorage.setItem('workpiserv_token', data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem('workpiserv_token');
}

export function isLoggedIn() {
  return !!localStorage.getItem('workpiserv_token');
}

// ──────────────────────────────────────────────
// Services
// ──────────────────────────────────────────────
export async function getServices(params?: {
  category?: string;
  q?: string;
  min?: number;
  max?: number;
  sort?: string;
  page?: number;
}) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.q) query.set('q', params.q);
  if (params?.min !== undefined) query.set('min_price', String(params.min));
  if (params?.max !== undefined) query.set('max_price', String(params.max));
  if (params?.sort) query.set('sort', params.sort);
  if (params?.page) query.set('page', String(params.page));

  return apiFetch<{ services: unknown[]; total: number; pages: number }>(`/services?${query}`);
}

export async function getService(id: string) {
  return apiFetch<unknown>(`/services/${id}`);
}

// ──────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────
export async function getMyOrders() {
  return apiFetch<unknown[]>('/orders/me');
}

export async function createOrder(serviceId: string, packageName: string) {
  return apiFetch<unknown>('/orders', {
    method: 'POST',
    body: JSON.stringify({ service_id: serviceId, package_name: packageName }),
  });
}

// ──────────────────────────────────────────────
// Pi Payments
// ──────────────────────────────────────────────
export async function createPayment(orderId: string, amount: number) {
  return apiFetch<{ payment_id: string; pi_payment_id: string }>('/payments/create', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, amount }),
  });
}

export async function completePayment(paymentId: string, txid: string) {
  return apiFetch<{ success: boolean }>('/payments/complete', {
    method: 'POST',
    body: JSON.stringify({ payment_id: paymentId, txid }),
  });
}
