export type AccountRole = 'buyer' | 'seller' | 'admin';

export type FacilityTrust =
  | 'unclaimed'
  | 'verification_draft'
  | 'verification_submitted'
  | 'admin_review'
  | 'certified'
  | 'unconfirmed'
  | 'confirmed'
  | 'rejected'
  | 'suspended';

export type FacilityPlan = 'free' | 'pro_active' | 'pro_expired';
export type SlotSource = 'free' | 'wallet' | 'workspace';
export type SlotStatus = 'available' | 'assigned' | 'revoked';

export type AvailabilityStatus =
  | 'draft'
  | 'submitted'
  | 'responding'
  | 'available'
  | 'partial'
  | 'unavailable'
  | 'stale'
  | 'expired'
  | 'cancelled'
  | 'failed';

export type TransactionState =
  | 'intent_created'
  | 'qr_ready'
  | 'qr_verified'
  | 'payment_declared'
  | 'payment_confirmed'
  | 'fulfilment_pending'
  | 'fulfilled'
  | 'received'
  | 'rated'
  | 'closed';

export type WalletEntryKind =
  | 'recharge'
  | 'slot_spend'
  | 'facility_pro_spend'
  | 'ad_spend'
  | 'coupon_credit'
  | 'bonus_grant'
  | 'bonus_spend'
  | 'reversal';

export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'STALE_STATE'
  | 'ENTITLEMENT_REQUIRED'
  | 'SOURCE_UNAVAILABLE'
  | 'ROUTE_NOT_AUTHORIZED'
  | 'ROUTE_UNAVAILABLE'
  | 'CONFLICT'
  | 'EXPIRED'
  | 'REPLAYED'
  | 'INTERNAL_RECOVERABLE';

export interface ApiError {
  code: ErrorCode;
  message: string;
  field?: string;
  retryable: boolean;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  correlationId: string;
  data?: T;
  error?: ApiError;
}

export interface ActorContext {
  accountId: string;
  roles: readonly AccountRole[];
  suspended: boolean;
}

export interface Facility {
  id: string;
  accountId: string | null;
  companyId: string | null;
  trust: FacilityTrust;
  plan: FacilityPlan;
  qualifyingSales: number;
  offerLimit: number;
}

export interface FacilitySlot {
  id: string;
  accountId: string;
  source: SlotSource;
  status: SlotStatus;
  facilityId: string | null;
}

export interface WalletLedgerEntry {
  id: string;
  walletId: string;
  kind: WalletEntryKind;
  amountMinor: number;
  currency: string;
  reference: string;
  confirmedAt: string | null;
}

export interface ProductSelection {
  productId: string;
  facilityId: string;
  requestedQuantity: number;
}

export interface CatalogProduct {
  id: string;
  facilityId: string;
  publicationState: 'draft' | 'pending_validation' | 'published' | 'sold_out' | 'archived';
}

export interface AvailabilitySelectionInput {
  productId: string;
  facilityId: string;
  quantity: number;
  budgetMode: 'unlimited' | 'maximum';
  budgetMinor: number | null;
}

export interface AvailabilityRequest {
  id: string;
  buyerAccountId: string;
  productId: string;
  facilityScope: readonly string[];
  requestedQuantity: number;
  budgetMode: 'unlimited' | 'maximum';
  budgetMinor: number | null;
  status: AvailabilityStatus;
  expiresAt: string;
}

export interface AvailabilityResponse {
  id: string;
  availabilityRequestId: string;
  facilityId: string;
  productId: string;
  unitPriceMinor: number;
  couponCode: string | null;
  quantity: number;
  observedAt: string;
  eligible: boolean;
}

export interface PurchaseIntentSnapshot {
  intentId: string;
  transactionId: string;
  buyerAccountId: string;
  facilityId: string;
  productId: string;
  quantity: number;
  unitPriceMinor: number;
  couponCode: string | null;
  netAmountMinor: number;
  responseObservedAt: string;
}

export interface QrTokenRecord {
  transactionId: string;
  tokenHash: string;
  expiresAt: string;
  verifiedAt: string | null;
  replayCount: number;
}
