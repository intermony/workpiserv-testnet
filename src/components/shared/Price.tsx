import { usePiPrice } from '@/hooks/usePiPrice';

interface PriceProps {
  /** Montant en Pi (service libellé en PI). Utilise SOIT pi, SOIT usd. */
  pi?: number;
  /** Prix de référence en USD (service libellé en USD). Affiche $ en principal. */
  usd?: number;
  /** Classes du chiffre principal (reprend ton style existant). */
  className?: string;
  /** Classes de la ligne secondaire (équivalent indicatif). */
  usdClassName?: string;
  /** Masquer la ligne secondaire si besoin. */
  showUsd?: boolean;
  /** Mettre les deux montants côte à côte au lieu de l'un sous l'autre. */
  inline?: boolean;
  /** Arrondit le chiffre en Pi (ex: 2 pour un solde « π 12.50 »). Défaut : brut. */
  decimals?: number;
}

/**
 * Affiche un prix avec son équivalent indicatif.
 *
 *   <Price pi={service.price} className="..." />     → « π 100 » + « ≈ $13.00 »
 *   <Price usd={service.price} className="..." />    → « $15 »   + « ≈ 115.38 π »
 *
 * L'unité réellement payée reste le Pi. Pour un prix en USD, le montant en Pi
 * affiché est INDICATIF (le montant ferme est verrouillé au moment de la
 * commande côté serveur). Si le taux n'est pas disponible, seul le montant
 * principal s'affiche.
 */
export default function Price({
  pi,
  usd,
  className = '',
  usdClassName = '',
  showUsd = true,
  inline = false,
  decimals,
}: PriceProps) {
  const { rate, toUsd } = usePiPrice();
  const isUsdPriced = usd != null;

  // Principal + secondaire selon la devise de référence.
  let primary: string;
  let secondary: string | null = null;

  if (isUsdPriced) {
    primary = `$${usd}`;
    if (rate != null && rate > 0) secondary = `≈ ${(usd / rate).toFixed(2)} π`;
  } else {
    const value = pi ?? 0;
    primary = `π ${decimals != null ? value.toFixed(decimals) : value}`;
    const u = toUsd(value);
    if (u != null) secondary = `≈ $${u.toFixed(2)}`;
  }

  const secondaryEl =
    showUsd && secondary ? (
      <span className={`text-muted-foreground font-normal ${usdClassName}`}>{secondary}</span>
    ) : null;

  if (inline) {
    return (
      <span className="inline-flex items-baseline gap-1.5">
        <span className={className}>{primary}</span>
        {secondaryEl && <span className="text-xs">{secondaryEl}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col leading-tight">
      <span className={className}>{primary}</span>
      {secondaryEl && <span className="text-xs">{secondaryEl}</span>}
    </span>
  );
}
