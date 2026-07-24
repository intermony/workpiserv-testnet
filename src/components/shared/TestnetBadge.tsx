import { PI_NETWORK } from "@/config/network";

/**
 * Bandeau visible signalant qu'on est sur le réseau Testnet.
 * Ne s'affiche QUE si PI_NETWORK === "testnet" — s'appuie sur la même
 * détection que le reste de l'app (hostname + VITE_PI_SANDBOX), donc
 * aucun risque qu'il s'affiche par erreur en mainnet, ni qu'il reste
 * caché par erreur en testnet.
 */
export function TestnetBadge() {
  if (PI_NETWORK !== "testnet") return null;

  return (
    <div className="w-full bg-amber-500 text-black text-center text-sm font-bold py-2 px-4 tracking-wide">
      🧪 TESTNET — test environment, no real Pi value at stake
    </div>
  );
}
