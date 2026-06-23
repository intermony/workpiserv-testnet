import { useEffect, useState } from 'react';

/**
 * usePiPrice — taux PI/USD pour AFFICHAGE uniquement.
 *
 * ⚠️ Ne jamais utiliser ce taux pour calculer un montant d'escrow ou un
 * paiement réel. Le montant payé/bloqué doit être figé côté backend
 * (rate-lock + snapshot dans le Ledger). Ici c'est purement indicatif.
 *
 * Plus tard : remplacer SOURCE par ton propre endpoint backend
 * (ex: `${API}/rate/pi-usd`) pour que l'affichage et l'escrow partagent
 * la même source et éviter les limites de l'API publique.
 */

// Source publique par défaut (CORS OK, gratuite). À remplacer par ton backend.
const SOURCE =
  'https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd';

const CACHE_KEY = 'wps_pi_usd_rate';
const TTL_MS = 2 * 60 * 1000; // 2 minutes

type Cached = { rate: number; ts: number };

// Cache mémoire partagé entre toutes les instances du hook (1 seul fetch).
let memRate: number | null = null;
let memTs = 0;
let inflight: Promise<number | null> | null = null;

// Initialise depuis localStorage au chargement du module.
try {
  const raw = localStorage.getItem(CACHE_KEY);
  if (raw) {
    const c: Cached = JSON.parse(raw);
    if (typeof c.rate === 'number') {
      memRate = c.rate;
      memTs = c.ts;
    }
  }
} catch {
  /* localStorage indisponible : on ignore */
}

function isFresh() {
  return memRate != null && Date.now() - memTs < TTL_MS;
}

async function fetchRate(): Promise<number | null> {
  if (isFresh()) return memRate;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(SOURCE);
      const data = await res.json();
      const r = data?.['pi-network']?.usd;
      if (typeof r === 'number' && r > 0) {
        memRate = r;
        memTs = Date.now();
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ rate: r, ts: memTs } as Cached),
          );
        } catch {
          /* ignore */
        }
        return r;
      }
      return memRate; // garde l'ancien si la réponse est invalide
    } catch {
      return memRate; // dégradation gracieuse : on garde le cache (ou null)
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function usePiPrice() {
  const [rate, setRate] = useState<number | null>(memRate);
  const [loading, setLoading] = useState<boolean>(!isFresh());

  useEffect(() => {
    let alive = true;
    if (isFresh()) {
      setRate(memRate);
      setLoading(false);
      return;
    }
    fetchRate().then((r) => {
      if (alive) {
        setRate(r);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  /** Convertit un montant en Pi vers USD (null si taux indisponible). */
  const toUsd = (pi: number): number | null =>
    rate != null ? pi * rate : null;

  return { rate, loading, toUsd };
}
