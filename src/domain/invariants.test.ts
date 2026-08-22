import { describe, expect, it } from 'vitest';
import type { Facility, FacilitySlot, WalletLedgerEntry } from './contracts';
import {
  FREE_OFFER_LIMIT,
  canCreateConfirmedTrust,
  canPublishFacility,
  confirmedWalletBalanceMinor,
  hasFreeSlot,
  nextTrustAfterSale,
  offerLimitFor,
} from './invariants';

const baseFacility: Facility = {
  id: 'facility-1',
  accountId: 'account-1',
  companyId: 'company-1',
  trust: 'unconfirmed',
  plan: 'free',
  qualifyingSales: 0,
  offerLimit: FREE_OFFER_LIMIT,
};

const slot = (overrides: Partial<FacilitySlot> = {}): FacilitySlot => ({
  id: 'slot-1',
  accountId: 'account-1',
  source: 'free',
  status: 'available',
  facilityId: null,
  ...overrides,
});

const entry = (kind: WalletLedgerEntry['kind'], amountMinor: number, confirmedAt = '2026-08-22T00:00:00.000Z'): WalletLedgerEntry => ({
  id: `${kind}-${amountMinor}`,
  walletId: 'wallet-1',
  kind,
  amountMinor,
  currency: 'USD',
  reference: 'test',
  confirmedAt,
});

describe('Nature Way Roots invariants', () => {
  it('keeps trust separate from Pro catalogue capacity', () => {
    expect(offerLimitFor('pro_active', 'unconfirmed')).toBe(Number.POSITIVE_INFINITY);
    expect(nextTrustAfterSale({ ...baseFacility, plan: 'pro_active', qualifyingSales: 0 })).toBe('unconfirmed');
    expect(nextTrustAfterSale({ ...baseFacility, plan: 'pro_active', qualifyingSales: 3 })).toBe('confirmed');
  });

  it('requires certification before publishing and caps Free offers at five', () => {
    expect(offerLimitFor('free', 'unclaimed')).toBe(0);
    expect(canPublishFacility({ ...baseFacility, trust: 'unconfirmed' }, 4)).toBe(true);
    expect(canPublishFacility({ ...baseFacility, trust: 'unconfirmed' }, 5)).toBe(false);
  });

  it('creates confirmed trust only at three qualifying sales', () => {
    expect(canCreateConfirmedTrust({ ...baseFacility, qualifyingSales: 2 })).toBe(false);
    expect(canCreateConfirmedTrust({ ...baseFacility, qualifyingSales: 3 })).toBe(true);
    expect(canCreateConfirmedTrust({ ...baseFacility, trust: 'certified', qualifyingSales: 3 })).toBe(false);
  });

  it('provides one free slot and derives only confirmed wallet funds', () => {
    expect(hasFreeSlot([slot()])).toBe(true);
    expect(hasFreeSlot([slot({ status: 'assigned', facilityId: 'facility-1' })])).toBe(false);
    expect(confirmedWalletBalanceMinor([entry('recharge', 1000), entry('slot_spend', 250), entry('facility_pro_spend', 300)])).toBe(450);
    expect(confirmedWalletBalanceMinor([entry('recharge', 1000, '')])).toBe(0);
  });
});
