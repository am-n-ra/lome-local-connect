import type {
  ActorContext,
  ApiEnvelope,
  AvailabilityRequest,
  AvailabilitySelectionInput,
  Facility,
  FacilitySlot,
  AvailabilityResponse,
  CatalogProduct,
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
  getProduct(id: string): CatalogProduct | null;
  countPublishedOffers(facilityId: string): number;
  getSlots(accountId: string): readonly FacilitySlot[];
  getWalletEntries(accountId: string): readonly WalletLedgerEntry[];
  getAvailability(id: string): AvailabilityRequest | null;
  getAvailabilityResponse(id: string): AvailabilityResponse | null;
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

export function validateAvailabilitySelection(
  actor: ActorContext,
  repository: RootsRepository,
  selection: AvailabilitySelectionInput,
  correlationId: string,
): ApiEnvelope<true> {
  if (actor.suspended) return failure(correlationId, 'FORBIDDEN', 'Account is suspended.');
  if (!actor.roles.includes('buyer')) return failure(correlationId, 'FORBIDDEN', 'Buyer role required.');
  if (!selection.productId || !selection.facilityId || !Number.isInteger(selection.quantity) || selection.quantity <= 0) {
    return failure(correlationId, 'INVALID_INPUT', 'Choose a published product and a positive quantity.');
  }
  if (selection.budgetMode === 'maximum' && (!Number.isInteger(selection.budgetMinor) || selection.budgetMinor! < 0)) {
    return failure(correlationId, 'INVALID_INPUT', 'A maximum budget must be a non-negative integer.');
  }
  const facility = repository.getFacility(selection.facilityId);
  const product = repository.getProduct(selection.productId);
  if (!facility || !product) return failure(correlationId, 'NOT_FOUND', 'The selected facility or product was not found.');
  if (product.facilityId !== facility.id) return failure(correlationId, 'FORBIDDEN', 'Product is outside the selected facility catalogue.');
  if (product.publicationState !== 'published') return failure(correlationId, 'STALE_STATE', 'The selected product is no longer published.');
  return ok(correlationId, true);
}

export function createIdempotentIntent(
  actor: ActorContext,
  repository: RootsRepository,
  responseId: string,
  idempotencyKey: string,
  correlationId: string,
): ApiEnvelope<PurchaseIntentSnapshot> {
  if (actor.suspended) return failure(correlationId, 'FORBIDDEN', 'Account is suspended.');
  if (!actor.roles.includes('buyer')) return failure(correlationId, 'FORBIDDEN', 'Buyer role required.');
  const existing = repository.getIntentByIdempotency(actor.accountId, idempotencyKey);
  if (existing) return ok(correlationId, existing);
  const response = repository.getAvailabilityResponse(responseId);
  if (!response) return failure(correlationId, 'NOT_FOUND', 'Availability response was not found.');
  const request = repository.getAvailability(response.availabilityRequestId);
  if (!request || request.buyerAccountId !== actor.accountId) return failure(correlationId, 'FORBIDDEN', 'Availability response is outside buyer ownership.');
  if (request.productId !== response.productId || !request.facilityScope.includes(response.facilityId)) {
    return failure(correlationId, 'FORBIDDEN', 'Availability response is outside the request scope.');
  }
  if (!response.eligible) return failure(correlationId, 'STALE_STATE', 'Availability response is not eligible for intent.');
  if (!Number.isInteger(response.quantity) || response.quantity <= 0 || !Number.isInteger(response.unitPriceMinor) || response.unitPriceMinor < 0) {
    return failure(correlationId, 'INVALID_INPUT', 'Availability response contains invalid commercial values.');
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
