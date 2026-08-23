import type {
  Facility,
  FacilityPlan,
  FacilitySlot,
  FacilityTrust,
  WalletLedgerEntry,
} from './contracts';

export const FREE_OFFER_LIMIT = 5;
export const CONFIRMED_SALES_THRESHOLD = 3;

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
