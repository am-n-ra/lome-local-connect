import type {
  DiscountKind,
  Facility,
  FacilityPlan,
  FacilitySlot,
  FacilityTrust,
  SupportedCurrency,
  WalletLedgerEntry,
  QualifyingSaleEvaluation,
  QualifyingSaleProof,
} from './contracts';

export const FREE_OFFER_LIMIT = 5;
export const CONFIRMED_SALES_THRESHOLD = 3;
export const SELLER_PRO_PRICE_USD_MINOR = 1_000;
export const SELLER_PRO_TERM_DAYS = 30;
export const SELLER_PRO_ANNUAL_PRICE_USD_MINOR = 10_000;
export const SUPPORTED_DISPLAY_CURRENCIES: readonly SupportedCurrency[] = ['XOF', 'GHS', 'EUR', 'USD'];

export function displayCurrencyForCountry(countryCode: string | null | undefined): SupportedCurrency {
  switch ((countryCode ?? '').trim().toUpperCase()) {
    case 'TG':
    case 'BJ':
      return 'XOF';
    case 'GH':
      return 'GHS';
    case 'FR':
      return 'EUR';
    default:
      return 'USD';
  }
}

export function discountAmountMinor(basePriceMinor: number, kind: DiscountKind, valueMinor: number): number {
  if (!Number.isInteger(basePriceMinor) || basePriceMinor <= 0) throw new Error('INVALID_BASE_PRICE');
  if (!Number.isInteger(valueMinor) || valueMinor <= 0) throw new Error('INVALID_DISCOUNT');
  if (kind === 'percentage') {
    if (valueMinor > 90) throw new Error('DISCOUNT_TOO_LARGE');
    return Math.floor((basePriceMinor * valueMinor) / 100);
  }
  if (valueMinor >= basePriceMinor) throw new Error('DISCOUNT_TOO_LARGE');
  return valueMinor;
}

export function netPriceMinor(basePriceMinor: number, kind: DiscountKind, valueMinor: number): number {
  const amount = discountAmountMinor(basePriceMinor, kind, valueMinor);
  const net = basePriceMinor - amount;
  if (net <= 0) throw new Error('INVALID_NET_PRICE');
  return net;
}

export function offerLimitFor(plan: FacilityPlan, trust: FacilityTrust): number {
  if (plan === 'pro_active') return Number.POSITIVE_INFINITY;
  if (trust === 'certified' || trust === 'unconfirmed' || trust === 'confirmed') {
    return FREE_OFFER_LIMIT;
  }
  return 0;
}

export function canPublishFacility(facility: Facility, currentOfferCount: number): boolean {
  return currentOfferCount < offerLimitFor(facility.plan, facility.trust);
}

export function canCreateConfirmedTrust(facility: Facility): boolean {
  return facility.trust === 'unconfirmed' && facility.qualifyingSales >= CONFIRMED_SALES_THRESHOLD;
}

export function nextTrustAfterSale(facility: Facility): FacilityTrust {
  return canCreateConfirmedTrust(facility) ? 'confirmed' : facility.trust;
}

export function evaluateQualifyingSale(
  facility: Facility,
  proof: QualifyingSaleProof,
): QualifyingSaleEvaluation {
  const unchanged = (reason: QualifyingSaleEvaluation['reason']): QualifyingSaleEvaluation => ({
    eligible: false,
    reason,
    nextQualifyingSales: facility.qualifyingSales,
    confirmsFacility: false,
    unlocksBonus: false,
  });
  if (proof.facilityId !== facility.id) return unchanged('wrong_facility');
  if (facility.qualifyingSales >= CONFIRMED_SALES_THRESHOLD || facility.commercialConfidence === 'confirmed') {
    return unchanged('already_confirmed');
  }
  if (proof.fixture) return unchanged('fixture');
  if (proof.cancelled) return unchanged('cancelled');
  if (!proof.buyerConfirmed) return unchanged('missing_buyer_confirmation');
  if (!proof.sellerVerified) return unchanged('missing_seller_verification');
  if (!proof.paymentDeclared) return unchanged('missing_payment_declaration');
  if (!proof.sellerFulfilled) return unchanged('missing_fulfilment');
  if (!proof.buyerReceived) return unchanged('missing_buyer_receipt');
  const nextQualifyingSales = Math.min(CONFIRMED_SALES_THRESHOLD, facility.qualifyingSales + 1);
  return {
    eligible: true,
    reason: 'eligible',
    nextQualifyingSales,
    confirmsFacility: nextQualifyingSales >= CONFIRMED_SALES_THRESHOLD,
    unlocksBonus: nextQualifyingSales >= CONFIRMED_SALES_THRESHOLD,
  };
}

export function hasFreeSlot(slots: readonly FacilitySlot[]): boolean {
  return slots.some((slot) => slot.source === 'free' && slot.status === 'available');
}

export function hasAssignedFacility(slot: FacilitySlot): boolean {
  return slot.status === 'assigned' && slot.facilityId !== null;
}

export function confirmedWalletBalanceMinor(entries: readonly WalletLedgerEntry[]): number {
  return entries.reduce((balance, entry) => {
    if (!entry.confirmedAt) return balance;
    const signedKinds = new Set<WalletLedgerEntry['kind']>([
        'recharge',
        'bonus_grant',
        'coupon_credit',
        'reversal',
    ]);
    return balance + (signedKinds.has(entry.kind) ? entry.amountMinor : -entry.amountMinor);
  }, 0);
}

export function canSpendWallet(
  entries: readonly WalletLedgerEntry[],
  amountMinor: number,
): boolean {
  return Number.isInteger(amountMinor) && amountMinor > 0 && confirmedWalletBalanceMinor(entries) >= amountMinor;
}

export function assertNoWithdrawal(kind: WalletLedgerEntry['kind']): void {
  if (kind === 'recharge' || kind === 'bonus_grant' || kind === 'reversal') return;
  if (kind === 'slot_spend' || kind === 'facility_pro_spend' || kind === 'ad_spend' || kind === 'coupon_credit' || kind === 'bonus_spend') return;
  throw new Error('WITHDRAWAL_NOT_SUPPORTED');
}
