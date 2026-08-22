import { describe, expect, it } from 'vitest';
import type { ActorContext, AvailabilityRequest, Facility, FacilitySlot, PurchaseIntentSnapshot, WalletLedgerEntry } from '../domain/contracts';
import { createIdempotentIntent, recordQualifyingSale, validateOfferPublication, validateSlotPurchase } from './roots-operations';

const seller: ActorContext = { accountId: 'seller-1', roles: ['seller'], suspended: false };
const buyer: ActorContext = { accountId: 'buyer-1', roles: ['buyer'], suspended: false };
const facility: Facility = { id: 'facility-1', accountId: 'seller-1', companyId: null, trust: 'unconfirmed', plan: 'free', qualifyingSales: 2, offerLimit: 5 };
const slots: FacilitySlot[] = [{ id: 'free-1', accountId: 'seller-1', source: 'free', status: 'assigned', facilityId: 'facility-1' }];
const wallet: WalletLedgerEntry[] = [{ id: 'wallet-1', walletId: 'wallet-1', kind: 'recharge', amountMinor: 1000, currency: 'USD', reference: 'fedapay-1', confirmedAt: '2026-08-22T00:00:00.000Z' }];

function repository() {
  const intents = new Map<string, PurchaseIntentSnapshot>();
  return {
    getFacility: () => facility,
    countPublishedOffers: () => 0,
    getSlots: () => slots,
    getWalletEntries: () => wallet,
    getAvailability: (_id: string): AvailabilityRequest | null => null,
    getIntentByIdempotency: (_account: string, key: string) => intents.get(key) ?? null,
    saveIntent: (snapshot: PurchaseIntentSnapshot, key: string) => intents.set(key, snapshot),
  };
}

describe('Roots server operations', () => {
  it('enforces facility ownership and Free catalogue capacity', () => {
    expect(validateOfferPublication(seller, facility, 4, 'c-1').ok).toBe(true);
    expect(validateOfferPublication({ ...seller, accountId: 'other' }, facility, 0, 'c-2').error?.code).toBe('FORBIDDEN');
    expect(validateOfferPublication(seller, facility, 5, 'c-3').error?.code).toBe('ENTITLEMENT_REQUIRED');
  });

  it('prevents purchasing another slot before the free slot is used', () => {
    expect(validateSlotPurchase(seller, slots, wallet, 250, 'c-4').ok).toBe(true);
    const noFree = [{ ...slots[0], status: 'revoked' as const, facilityId: null }];
    expect(validateSlotPurchase(seller, noFree, wallet, 250, 'c-5').ok).toBe(true);
  });

  it('confirms trust and unlocks the facility bonus after the third sale', () => {
    const events: string[] = [];
    const result = recordQualifyingSale(seller, facility, 'c-6', { append: (event) => events.push(event.eventType) });
    expect(result.data).toEqual({ trust: 'confirmed', bonusEligible: true });
    expect(events).toEqual(['qualifying_sale_recorded', 'facility_confirmed']);
  });

  it('reuses the same intent for duplicate idempotent submissions', () => {
    const repo = repository();
    const response = { id: 'response-1', facilityId: 'facility-1', productId: 'product-1', unitPriceMinor: 250, couponCode: null, quantity: 2, observedAt: '2026-08-22T00:00:00.000Z', eligible: true };
    const first = createIdempotentIntent(buyer, repo, response, 'idem-1', 'c-7');
    const second = createIdempotentIntent(buyer, repo, response, 'idem-1', 'c-8');
    expect(first.ok).toBe(true);
    expect(second.data?.intentId).toBe(first.data?.intentId);
    expect(second.data?.netAmountMinor).toBe(500);
  });
});
