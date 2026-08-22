import { describe, expect, it } from 'vitest';
import type { ActorContext, AvailabilityRequest, AvailabilityResponse, Facility, FacilitySlot, PurchaseIntentSnapshot, WalletLedgerEntry } from '../domain/contracts';
import { createIdempotentIntent, recordQualifyingSale, validateAvailabilitySelection, validateOfferPublication, validateSlotPurchase } from './roots-operations';

const seller: ActorContext = { accountId: 'seller-1', roles: ['seller'], suspended: false };
const buyer: ActorContext = { accountId: 'buyer-1', roles: ['buyer'], suspended: false };
const facility: Facility = { id: 'facility-1', accountId: 'seller-1', companyId: null, trust: 'unconfirmed', plan: 'free', qualifyingSales: 2, offerLimit: 5 };
const slots: FacilitySlot[] = [{ id: 'free-1', accountId: 'seller-1', source: 'free', status: 'assigned', facilityId: 'facility-1' }];
const wallet: WalletLedgerEntry[] = [{ id: 'wallet-1', walletId: 'wallet-1', kind: 'recharge', amountMinor: 1000, currency: 'USD', reference: 'fedapay-1', confirmedAt: '2026-08-22T00:00:00.000Z' }];

function repository() {
  const intents = new Map<string, PurchaseIntentSnapshot>();
  const request: AvailabilityRequest = {
    id: 'availability-1',
    buyerAccountId: 'buyer-1',
    productId: 'product-1',
    facilityScope: ['facility-1'],
    requestedQuantity: 2,
    budgetMode: 'unlimited',
    budgetMinor: null,
    status: 'available',
    expiresAt: '2026-08-23T00:00:00.000Z',
  };
  const response: AvailabilityResponse = {
    id: 'response-1',
    availabilityRequestId: 'availability-1',
    facilityId: 'facility-1',
    productId: 'product-1',
    unitPriceMinor: 250,
    couponCode: null,
    quantity: 2,
    observedAt: '2026-08-22T00:00:00.000Z',
    eligible: true,
  };
  return {
    getFacility: (id: string) => id === facility.id ? facility : null,
    getProduct: (id: string) => id === 'product-1' ? { id: 'product-1', facilityId: 'facility-1', publicationState: 'published' as const } : null,
    countPublishedOffers: () => 0,
    getSlots: () => slots,
    getWalletEntries: () => wallet,
    getAvailability: (id: string): AvailabilityRequest | null => id === request.id ? request : null,
    getAvailabilityResponse: (id: string): AvailabilityResponse | null => id === response.id ? response : null,
    getIntentByIdempotency: (_account: string, key: string) => intents.get(key) ?? null,
    saveIntent: (snapshot: PurchaseIntentSnapshot, key: string) => intents.set(key, snapshot),
  };
}

describe('Roots server operations', () => {
  it('validates buyer availability against the server catalogue and rejects forged facility scope', () => {
    const repo = repository();
    expect(validateAvailabilitySelection(buyer, repo, { productId: 'product-1', facilityId: 'facility-1', quantity: 2, budgetMode: 'unlimited', budgetMinor: null }, 'c-0').ok).toBe(true);
    expect(validateAvailabilitySelection(buyer, repo, { productId: 'product-1', facilityId: 'other-facility', quantity: 2, budgetMode: 'unlimited', budgetMinor: null }, 'c-0b').error?.code).toBe('NOT_FOUND');
    expect(validateAvailabilitySelection(buyer, repo, { productId: 'missing-product', facilityId: 'facility-1', quantity: 2, budgetMode: 'unlimited', budgetMinor: null }, 'c-0c').error?.code).toBe('NOT_FOUND');
    expect(validateAvailabilitySelection(buyer, repo, { productId: 'product-1', facilityId: 'facility-1', quantity: 2, budgetMode: 'maximum', budgetMinor: null }, 'c-0d').error?.code).toBe('INVALID_INPUT');
  });

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
    const first = createIdempotentIntent(buyer, repo, 'response-1', 'idem-1', 'c-7');
    const second = createIdempotentIntent(buyer, repo, 'response-1', 'idem-1', 'c-8');
    expect(first.ok).toBe(true);
    expect(second.data?.intentId).toBe(first.data?.intentId);
    expect(second.data?.netAmountMinor).toBe(500);
  });

  it('rejects buyer intent creation from a response owned by another buyer', () => {
    const repo = repository();
    const response = repo.getAvailabilityResponse('response-1')!;
    const request = repo.getAvailability(response.availabilityRequestId)!;
    const forgedRepository = {
      ...repo,
      getAvailability: () => ({ ...request, buyerAccountId: 'buyer-2' }),
    };
    expect(createIdempotentIntent(buyer, forgedRepository, 'response-1', 'idem-forged', 'c-9').error?.code).toBe('FORBIDDEN');
  });

  it('rejects seller and suspended buyer actors at the protected intent boundary', () => {
    const repo = repository();
    expect(createIdempotentIntent(seller, repo, 'response-1', 'idem-seller', 'c-10').error?.code).toBe('FORBIDDEN');
    expect(createIdempotentIntent({ ...buyer, suspended: true }, repo, 'response-1', 'idem-suspended', 'c-11').error?.code).toBe('FORBIDDEN');
  });
});
