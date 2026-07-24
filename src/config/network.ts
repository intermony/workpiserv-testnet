/**
 * src/config/network.ts — WorkPiServ
 * ---------------------------------------------------------------
 * Source de vérité unique côté frontend pour le réseau Pi.
 * Le réseau est déduit du nom d'hôte au chargement — aucun risque
 * qu'un build testnet pointe vers l'API mainnet, et inversement.
 *
 * Utilisation :
 *   import { API_BASE_URL, PI_NETWORK, PI_SANDBOX, apiHeaders } from "@/config/network";
 *
 *   1. Remplacer toute URL d'API codée en dur par API_BASE_URL.
 *   2. Initialiser le SDK Pi avec :  Pi.init({ version: "2.0", sandbox: PI_SANDBOX })
 *   3. Ajouter apiHeaders() aux en-têtes de chaque fetch vers le backend
 *      (le backend rejette toute incohérence en 403 NETWORK_MISMATCH).
 * ---------------------------------------------------------------
 */

export type PiNetwork = "mainnet" | "testnet";

const hostname =
  typeof window !== "undefined" ? window.location.hostname : "";

/**
 * Le hostname reste la protection historique (build testnet.* => testnet,
 * quel que soit l'environnement de build — protège contre l'incident du
 * 03/07/2026 où un build s'était retrouvé sur le mauvais domaine).
 *
 * VITE_PI_SANDBOX permet en plus de forcer le mode testnet sur un domaine
 * qui ne commence pas par "testnet." (ex: workpiserv.com pendant une phase
 * de test volontaire avec de vrais Pionniers). Cette variable ne peut
 * JAMAIS forcer le mode mainnet — elle ne fait qu'ajouter testnet comme
 * possibilité supplémentaire, jamais retirer la protection existante.
 */
const hostnameSaysTestnet = hostname.startsWith("testnet.");
const envForcesSandbox = import.meta.env.VITE_PI_SANDBOX === "true";

/** Réseau actif : testnet si le hostname OU la variable d'env le demande. */
export const PI_NETWORK: PiNetwork =
  hostnameSaysTestnet || envForcesSandbox ? "testnet" : "mainnet";

/** URL de base de l'API backend correspondant au réseau. */
export const API_BASE_URL: string =
  PI_NETWORK === "testnet"
    ? "https://workpiserv-api-testnet.onrender.com"
    : "https://workpiserv-api-mainnet.onrender.com";

/** true sur testnet : le SDK Pi doit être initialisé en mode sandbox. */
export const PI_SANDBOX: boolean = PI_NETWORK === "testnet";

/**
 * En-têtes à joindre à chaque requête vers le backend.
 * Le backend (networkGuard.js) vérifie X-Pi-Network et bloque
 * toute requête dont le réseau déclaré ne correspond pas au sien.
 */
export function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "X-Pi-Network": PI_NETWORK,
    ...extra,
  };
}

/**
 * À appeler après chaque réponse API : si le token est invalide/expiré/révoqué
 * (401 — banni, JWT expiré, etc.), vide la session locale et renvoie vers
 * l'accueil pour forcer une reconnexion propre, au lieu de laisser l'UI dans
 * un état "connecté" fantôme jusqu'à ce qu'une action échoue silencieusement.
 */
export function handleUnauthorized(status: number): void {
  if (status !== 401) return;
  try {
    localStorage.removeItem("workpiserv_token");
    localStorage.removeItem("workpiserv_user");
  } catch { /* ignore */ }
  if (typeof window !== "undefined") window.location.hash = "#/";
}
