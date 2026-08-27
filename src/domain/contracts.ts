export type AccountRole = 'buyer' | 'seller' | 'admin' | 'operator' | 'reviewer';

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
export type FacilitySourceKind = 'created' | 'public_import' | 'claimed';
export type FacilityClaimState = 'unclaimed' | 'claim_pending' | 'claimed' | 'claim_rejected' | 'evidence_requested';
export type FacilityCertificationState = 'verification_draft' | 'under_review' | 'certified' | 'rejected';
export type FacilityCommercialConfidence = 'not_confirmed' | 'confirmed';
export type FacilityPublicationState = 'draft' | 'public_pending_review' | 'public_active' | 'paused' | 'archived';
export type SupportedCurrency = 'XOF' | 'GHS' | 'EUR' | 'USD';
export type DiscountKind = 'percentage' | 'fixed';

export interface ProductOffer {
  kind: DiscountKind;
  valueMinor: number;
  currency: SupportedCurrency;
  validFrom?: string | null;
  validUntil?: string | null;
}
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
  | 'INTERNAL_RECOVERABLE'
  | 'ROLE_REQUIRED';

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
  sourceKind: FacilitySourceKind;
  trust: FacilityTrust;
  claimState: FacilityClaimState;
  certificationState: FacilityCertificationState;
  commercialConfidence: FacilityCommercialConfidence;
  publicationState: FacilityPublicationState;
  plan: FacilityPlan;
  qualifyingSales: number;
  bonusUnlockedAt: string | null;
  offerLimit: number;
}

export interface FacilityCompanyContext {
  companyId: string;
  companyName: string;
  facilityId: string;
  facilityName: string;
  slotId: string | null;
}

export interface SellerConfirmationReward {
  facilityId: string;
  accountId: string;
  qualifyingSales: number;
  threshold: 3;
  amountMinor: number;
  reference: string;
  status: 'locked' | 'available' | 'reserved' | 'spent' | 'reversed' | 'expired';
  eligibleUses: readonly ('facility_pro' | 'omni_service')[];
  unlockedAt: string | null;
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

export interface TransactionStateTransition {
  from: TransactionState;
  to: TransactionState;
  actorRole: AccountRole | 'system';
}

export interface TransactionTransitionResult {
  allowed: true;
  transactionId: string;
  from: TransactionState;
  to: TransactionState;
  actorRole: AccountRole;
}

export interface TransactionMembership {
  transactionId: string;
  accountId: string;
  role: 'buyer' | 'seller';
}

export interface QrVerificationInput {
  transactionId: string;
  presentedTokenHash: string;
  now: string;
}

export interface QrVerificationResult {
  accepted: true;
  transactionId: string;
  verifiedAt: string;
  nextReplayCount: number;
  facilityId?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPriceMinor?: number;
  couponCode?: string | null;
  netAmountMinor?: number;
}
