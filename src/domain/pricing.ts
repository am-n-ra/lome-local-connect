/**
 * Omni canonical pricing — base devise USD (founder correction 2026-09-13).
 *
 * Sticker prices live in USD (internal minor units = cents):
 *   - Seller Pro: $10 /mois
 *   - Buyer Pro:  $5  /mois
 *
 * The wallet ledger + charges run in the market currency (FedaPay is XOF-only
 * for the Lomé pilot), so every local amount is derived from the canonical USD
 * base at the user's location/billing currency. Display layers show the USD
 * sticker with a local equivalent ("5 $/mois ≈ 2 500 F").
 *
 * Additive + pure: no DB, no I/O. Single source of truth for plan pricing.
 */

export const OMNI_BASE_CURRENCY = 'USD' as const;

/** Canonical monthly plan prices in USD minor units (1 USD = 100 minor). */
export const OMNI_PLAN_PRICES_USD_MINOR = {
  sellerPro: 1000, // $10.00 /mois
  buyerPro: 500,   // $5.00 /mois
} as const;

/** Local rate receipts, in local minor units per 1 USD minor (1 USD = 100 usd-minor).
 *  Pilot (Lomé/Togo): 1 USD = 500 XOF → 1 usd-minor = 500 XOF-minor. */
const LOCAL_RATE_PER_USD_MINOR: Record<string, number> = {
  XOF: 500, // 1 USD = 500 XOF
};

/** Default billing currency when the user's location is unknown (Lomé pilot). */
export const OMNI_DEFAULT_LOCAL_CURRENCY = 'XOF' as const;

/** Returns the local minor amount for `usdMinor` at the given billing currency.
 *  Returns the USD amount unchanged when the currency is USD or unknown. */
export function convertUsdMinorToLocal(usdMinor: number, currency: string): number {
  const rate = LOCAL_RATE_PER_USD_MINOR[String(currency).toUpperCase()];
  if (!rate || usdMinor <= 0) return usdMinor;
  return Math.round(usdMinor * rate);
}

/** Canonical USD minor price for a plan, or 0 when unknown. */
export function planBaseUsdMinor(plan: 'sellerPro' | 'buyerPro'): number {
  return OMNI_PLAN_PRICES_USD_MINOR[plan] ?? 0;
}

/**
 * Bulk-credit pack catalog (NW-13i). Packs are bought via a FedaPay Wallet
 * recharge (XOF-only for the Lomé pilot), so prices are expressed in the local
 * currency (XOF minor units). The number granted is a volume unit.
 *
 * **HYPOTHESIS (D-J)** — founder has NOT locked pack pricing yet ("packs bulk à
 * fixer", NW-13b spec line 106). Values below are a reversible hypothesis only
 * (volume discount, ~35–50 F per bulk credit); the mechanism is decoupled from
 * the table. Update this constant when the founder fixes D-J; the API + UI read
 * it as the single source of truth.
 */
export const BULK_PACKS = [
  { id: 'starter', credits: 10, priceMinor: 50000, billingCurrency: 'XOF' },   // 500  F  → 10 crédits
  { id: 'growth', credits: 30, priceMinor: 120000, billingCurrency: 'XOF' },   // 1 200 F → 30 crédits
  { id: 'scale', credits: 100, priceMinor: 350000, billingCurrency: 'XOF' },   // 3 500 F → 100 crédits
] as const;

export type BulkPackId = (typeof BULK_PACKS)[number]['id'];

/** Returns the pack for the given id, or undefined when unknown. */
export function bulkPackById(id: string): (typeof BULK_PACKS)[number] | undefined {
  return BULK_PACKS.find((p) => p.id === id);
}