/**
 * Omni currency resolution — single entry point (D-LOC-2).
 *
 * The founder amendment of 2026-09-25 is explicit: "la devise dépend de
 * localization de user". The currency is a property of the user's location,
 * not a global constant. Before this module, `OMNI_DEFAULT_LOCAL_CURRENCY`
 * ('XOF') was read directly inside components, which is exactly what froze the
 * system to the Lomé pilot.
 *
 * The rule this module exists to enforce: **no component reads
 * `OMNI_DEFAULT_LOCAL_CURRENCY` directly**. They call `resolveUserCurrency`
 * and read `.currency` / `.symbol` / `.decimals`.
 *
 * Pure: no DB, no I/O. The market row (when it exists) is passed in.
 */

import { OMNI_DEFAULT_LOCAL_CURRENCY } from './pricing';

export type ResolvedCurrency = {
  /** ISO 4217 code, e.g. 'XOF'. */
  currency: string;
  /** Display symbol, e.g. 'F' / '$'. */
  symbol: string;
  /** Minor-unit decimals: 0 for XOF, 2 for USD. */
  decimals: number;
  /** Local minor units per 1 USD minor unit. `null` = no known rate. */
  ratePerUsdMinor: number | null;
  /** Where this resolution came from — surfaced so the UI never guesses silently. */
  source: 'market' | 'fallback';
};

/**
 * Known market rows. Kept here rather than only in the database because
 * `public.markets` is **absent from the canonical v2 branch** (measured
 * 2026-09-26), so a DB-only source of truth would resolve nothing today.
 * When `markets` lands in v2, `resolveUserCurrency` starts receiving the row
 * and this table becomes the offline fallback — the call sites do not change.
 */
const MARKETS: Record<string, Omit<ResolvedCurrency, 'source'>> = {
  'TG-LOME': { currency: 'XOF', symbol: 'F', decimals: 0, ratePerUsdMinor: 500 },
  GH: { currency: 'GHS', symbol: 'GH₵', decimals: 2, ratePerUsdMinor: null },
  NG: { currency: 'NGN', symbol: '₦', decimals: 2, ratePerUsdMinor: null },
  US: { currency: 'USD', symbol: '$', decimals: 2, ratePerUsdMinor: 100 },
  EU: { currency: 'EUR', symbol: '€', decimals: 2, ratePerUsdMinor: null },
};

const FALLBACK: Omit<ResolvedCurrency, 'source'> = {
  currency: OMNI_DEFAULT_LOCAL_CURRENCY,
  symbol: 'F',
  decimals: 0,
  ratePerUsdMinor: 500,
};

/** Maps a BCP-47 locale region ("fr-TG", "en-GH") to a market key. */
function marketKeyForLocale(locale: string): string | null {
  const region = String(locale).split(/[-_]/)[1]?.toUpperCase();
  if (!region) return null;
  if (region === 'TG') return 'TG-LOME';
  return MARKETS[region] ? region : null;
}

/**
 * Resolve the currency for a user.
 *
 * Precedence: explicit market row > market implied by locale > pilot fallback.
 * The fallback still exists (Lomé pilot unchanged, D-LOC-5) — it simply stops
 * being the *rule*.
 */
export function resolveUserCurrency(input?: {
  market?: { marketCode?: string | null; currencyCode?: string | null; currencySymbol?: string | null; currencyDecimals?: number | null } | null;
  locale?: string | null;
}): ResolvedCurrency {
  const market = input?.market;
  const code = market?.marketCode?.trim().toUpperCase();
  if (code && MARKETS[code]) {
    const known = MARKETS[code];
    return {
      ...known,
      // A market row may override the display facts it owns.
      currency: market?.currencyCode?.trim().toUpperCase() || known.currency,
      symbol: market?.currencySymbol?.trim() || known.symbol,
      decimals: typeof market?.currencyDecimals === 'number' ? market.currencyDecimals : known.decimals,
      source: 'market',
    };
  }

  const fromLocale = input?.locale ? marketKeyForLocale(input.locale) : null;
  if (fromLocale) return { ...MARKETS[fromLocale], source: 'market' };

  return { ...FALLBACK, source: 'fallback' };
}

/** Formats a minor amount in the resolved currency, always showing the symbol (D-LOC-4). */
export function formatAmount(minor: number, resolved: ResolvedCurrency): string {
  const value = resolved.decimals === 0 ? Math.round(minor) : minor / 100;
  const rendered = resolved.decimals === 0
    ? value.toLocaleString('fr-FR')
    : value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${rendered} ${resolved.symbol}`;
}

/**
 * Normalises a minor amount expressed in `from` into `to` minor units, or
 * returns `null` when no rate is known. `null` is deliberate: a budget filter
 * must not silently treat two different currencies as comparable (D-LOC-3).
 */
export function normaliseMinor(
  minor: number,
  from: string,
  to: string,
  ratePerUsdMinor: number | null,
): number | null {
  const f = String(from).trim().toUpperCase();
  const t = String(to).trim().toUpperCase();
  if (f === t) return minor;
  // Only conversions routed through the USD base are known today. Anything
  // else returns null so callers must decide explicitly rather than guess.
  const rate = f === 'USD' ? ratePerUsdMinor : null;
  if (rate === null || t !== 'XOF') return null;
  return Math.round(minor * rate);
}
