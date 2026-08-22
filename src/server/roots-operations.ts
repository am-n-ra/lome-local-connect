import type {
  ActorContext,
  ApiEnvelope,
  AvailabilityRequest,
  Facility,
  FacilitySlot,
  PurchaseIntentSnapshot,
  WalletLedgerEntry,
} from '../domain/contracts';
import {
  canCreateConfirmedTrust,
  canPublishFacility,
  canSpendWallet,
  hasFreeSlot,
  nextTrustAfterSale,
  offerLimitFor,
} from '../domain/invariants';

export interface AuditSink {
  append(event: {
    actorAccountId: string | null;
    eventType: string;
    entityType: string;
    entityId: string;
    correlationId: string;
    reason?: string;
  }): void;
}

export interface RootsRepository {
  getFacility(id: string): Facility | null;
  countPublishedOffers(facilityId: string): number;
  getSlots(accountId: string): readonly FacilitySlot[];
  getWalletEntries(accountId: string): readonly WalletLedgerEntry[];
  getAvailability(id: string): AvailabilityRequest | null;
  getIntentByIdempotency(accountId: string, key: string): PurchaseIntentSnapshot | null;
  saveIntent(snapshot: PurchaseIntentSnapshot, idempotencyKey: string): void;
}

const ok = <T>(correlationId: string, data: T): ApiEnvelope<T> => ({ ok: true, correlationId, data });
const failure = <T>(correlationId: string, code: NonNullable<ApiEnvelope<T>['error']>['code'], message: string, retryable = false): ApiEnvelope<T> => ({
  ok: false,
  correlationId,
  error: { code, message, retryable },
});

export function assertSellerOwnsFacility(
  actor: ActorContext,
  facility: Facility,
  correlationId: string,
): ApiEnvelope<true> {
  if (actor.suspended) return failure(correlationId, 'FORBIDDEN', 'Account is suspended.');
  if (!actor.roles.includes('seller')) return failure(correlationId, 'FORBIDDEN', 'Seller role required.');
  if (facility.accountId !== actor.accountId) return failure(correlationId, 'FORBIDDEN', 'Facility is outside actor ownership.');
  return ok(correlationId, true);
}

export function validateOfferPublication(
  actor: ActorContext,
  facility: Facility,
  publishedOfferCount: number,
  correlationId: string,
): ApiEnvelope<{ remaining: number }> {
  const ownership = assertSellerOwnsFacility(actor, facility, correlationId);
  if (!ownership.ok) return failure(correlationId, ownership.error!.code, ownership.error!.message, ownership.error!.retryable);
  if (!canPublishFacility(facility, publishedOfferCount)) {
    return failure(correlationId, 'ENTITLEMENT_REQUIRED', `Facility offer limit reached (${offerLimitFor(facility.plan, facility.trust)}).`);
  }
  return ok(correlationId, { remaining: Math.max(0, offerLimitFor(facility.plan, facility.trust) - publishedOfferCount - 1) });
}

export function validateSlotPurchase(
  actor: ActorContext,
  slots: readonly FacilitySlot[],
  walletEntries: readonly WalletLedgerEntry[],
  amountMinor: number,
  correlationId: string,
): ApiEnvelope<{ canPurchase: true }> {
  if (actor.suspended) return failure(correlationId, 'FORBIDDEN', 'Account is suspended.');
  if (!actor.roles.includes('seller')) return failure(correlationId, 'FORBIDDEN', 'Seller role required.');
  if (hasFreeSlot(slots)) return failure(correlationId, 'CONFLICT', 'The account must use its free slot before purchasing another slot.');
  if (!canSpendWallet(walletEntries, amountMinor)) return failure(correlationId, 'ENTITLEMENT_REQUIRED', 'Confirmed Omni Wallet funds are insufficient.');
  return ok(correlationId, { canPurchase: true });
}

export function recordQualifyingSale(
  actor: ActorContext,
  facility: Facility,
  correlationId: string,
  audit: AuditSink,
): ApiEnvelope<{ trust: Facility['trust']; bonusEligible: boolean }> {
  const ownership = assertSellerOwnsFacility(actor, facility, correlationId);
  if (!ownership.ok) return failure(correlationId, ownership.error!.code, ownership.error!.message, ownership.error!.retryable);
  const nextTrust = nextTrustAfterSale({ ...facility, qualifyingSales: facility.qualifyingSales + 1 });
  const bonusEligible = facility.qualifyingSales + 1 >= 3;
  audit.append({
    actorAccountId: actor.accountId,
    eventType: 'qualifying_sale_recorded',
    entityType: 'facility',
    entityId: facility.id,
    correlationId,
  });
  if (nextTrust !== facility.trust) {
    audit.append({
      actorAccountId: actor.accountId,
      eventType: 'facility_confirmed',
      entityType: 'facility',
      entityId: facility.id,
      correlationId,
      reason: 'Three qualifying successful Omni sales.',
    });
  }
  return ok(correlationId, { trust: nextTrust, bonusEligible });
}

export function createIdempotentIntent(
  actor: ActorContext,
  repository: RootsRepository,
  response: {
    id: string;
    facilityId: string;
    productId: string;
    unitPriceMinor: number;
    couponCode: string | null;
    quantity: number;
    observedAt: string;
    eligible: boolean;
  },
  idempotencyKey: string,
  correlationId: string,
): ApiEnvelope<PurchaseIntentSnapshot> {
  if (actor.suspended) return failure(correlationId, 'FORBIDDEN', 'Account is suspended.');
  if (!actor.roles.includes('buyer')) return failure(correlationId, 'FORBIDDEN', 'Buyer role required.');
  if (!response.eligible) return failure(correlationId, 'STALE_STATE', 'Availability response is not eligible for intent.');
  const existing = repository.getIntentByIdempotency(actor.accountId, idempotencyKey);
  if (existing) return ok(correlationId, existing);
  if (!Number.isInteger(response.quantity) || response.quantity <= 0) {
    return failure(correlationId, 'INVALID_INPUT', 'Quantity must be a positive integer.');
  }
  const snapshot: PurchaseIntentSnapshot = {
    intentId: `intent-${crypto.randomUUID()}`,
    transactionId: `transaction-${crypto.randomUUID()}`,
    buyerAccountId: actor.accountId,
    facilityId: response.facilityId,
    productId: response.productId,
    quantity: response.quantity,
    unitPriceMinor: response.unitPriceMinor,
    couponCode: response.couponCode,
    netAmountMinor: response.unitPriceMinor * response.quantity,
    responseObservedAt: response.observedAt,
  };
  repository.saveIntent(snapshot, idempotencyKey);
  return ok(correlationId, snapshot);
}

export function canProgressToConfirmed(facility: Facility): boolean {
  return canCreateConfirmedTrust(facility);
}
