/**
 * Plan price labels (seller Pro / buyer Pro), pure and testable.
 *
 * Extracted from `TrunkAppV13` because the unit convention here is easy to get
 * wrong and was wrong: the local side is a **×100** amount (500 000 minor =
 * 5 000 F), so it must go through `formatScaledAmount`, not `formatAmount`.
 * `formatAmount` is the decimals-aware formatter, correct for OFFER prices
 * (raw local units). Mixing them rendered "500 000 F" for a 5 000 F plan
 * (measured 2026-09-27).
 */

import { OMNI_BASE_CURRENCY, OMNI_PLAN_PRICES_USD_MINOR, convertUsdMinorToLocal } from './pricing';
import { formatScaledAmount, type ResolvedCurrency } from './currency';

export type PlanKind = 'sellerPro' | 'buyerPro';

/**
 * "10 $ US/mois ≈ 5 000 F" — canonical USD base plus the user's local equivalent.
 * The local side uses the **user's** resolved currency (D-LOC-2), never the
 * hardcoded pilot constant.
 */
export function planPriceLabel(kind: PlanKind, resolved: ResolvedCurrency): string {
  const usdMinor = OMNI_PLAN_PRICES_USD_MINOR[kind];
  const localMinor = convertUsdMinorToLocal(usdMinor, resolved.currency);
  const usd = Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: OMNI_BASE_CURRENCY,
    maximumFractionDigits: 0,
  }).format(usdMinor / 100);
  return `${usd}/mois${localMinor !== usdMinor ? ` ≈ ${formatScaledAmount(localMinor, resolved)}` : ''}`;
}

/** Compact local price for buttons and reminders ("5 000 F"). Same convention as `planPriceLabel`. */
export function localPlanPriceLabel(kind: PlanKind, resolved: ResolvedCurrency): string {
  const localMinor = convertUsdMinorToLocal(OMNI_PLAN_PRICES_USD_MINOR[kind], resolved.currency);
  return formatScaledAmount(localMinor, resolved);
}
