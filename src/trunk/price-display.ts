/**
 * BRANCHES-PRICE-DISPLAY — what a price shows, decided once.
 *
 * The accepted maquette shows BOTH prices everywhere: the Omni price and the
 * struck-through original, plus the `−N % Omni` badge. The app only ever showed
 * the discounted price, which hides the advantage Omni exists to deliver.
 *
 * One rule, shared by every surface, so they cannot disagree:
 *   - the original + the badge appear ONLY when there is a REAL reduction
 *     (`prixReduit < prixOriginal`);
 *   - the `%` is DERIVED from the two printed prices, never read from a
 *     separate field — so the badge can never disagree with the numbers shown
 *     (no `−0 %`, no struck price equal to the shown price);
 *   - a fixed discount shows its true percentage, not an invented one.
 *
 * Pure: no DB, no I/O, no React.
 */
import { currencyFor, formatMoney } from '../domain/currency';

export type PriceFacts = {
  /** Original (pre-discount) price in minor units. */
  prixOriginal: number;
  /** Discounted price in minor units. */
  prixReduit: number;
  /** ISO currency code the amounts are expressed in. */
  currency: string | null;
};

export type PriceDisplay = {
  /** The Omni (discounted) price, formatted — always shown. */
  price: string;
  /** The struck-through original, formatted — only when there is a real saving. */
  original: string | null;
  /** The reduction percentage, derived from the two prices — only when > 0. */
  discountPct: number | null;
  /** The badge label `−N % Omni` — only when there is a real reduction. */
  promo: string | null;
};

export function priceDisplay(facts: PriceFacts): PriceDisplay {
  const currency = currencyFor(facts.currency).currency;
  const price = formatMoney(facts.prixReduit, currency);
  const hasSaving = facts.prixReduit < facts.prixOriginal;
  // Derived, not declared: the badge always matches the two numbers printed.
  const pct = hasSaving && facts.prixOriginal > 0
    ? Math.round(((facts.prixOriginal - facts.prixReduit) / facts.prixOriginal) * 100)
    : 0;
  return {
    price,
    original: hasSaving ? formatMoney(facts.prixOriginal, currency) : null,
    discountPct: pct > 0 ? pct : null,
    promo: pct > 0 ? `−${pct} % Omni` : null,
  };
}
