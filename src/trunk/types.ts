export type PublicTrust = 'unclaimed' | 'certified' | 'unconfirmed' | 'confirmed';

export interface SearchOptions {
  category: string;
}

export interface PublicFacility {
  id: string;
  name: string;
  category: string;
  address: string | null;
  latitude: number;
  longitude: number;
  trust: PublicTrust;
  plan: 'free' | 'pro_active' | 'pro_expired';
  productCount: number;
  source?: 'database' | 'osm';
}

export interface PublicProduct {
  id: string;
  facilityId: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  priceMinor: number;
  currency: string;
  couponLabel: string | null;
}

export interface FacilityDetail extends PublicFacility {
  products: PublicProduct[];
}

export type AvailabilityRequestState = 'submitted' | 'responding' | 'responses' | 'expired';

export type AvailabilityResponseStatus = 'available' | 'partial' | 'unavailable' | 'corrected';

export type AvailabilityFreshness = 'fresh' | 'stale' | 'expired';

export interface AvailabilityResult {
  requestId: string;
  productId: string;
  facilityId: string;
  status: AvailabilityRequestState;
  expiresAt: string;
  message: string;
}

export interface BuyerAvailabilityResponse {
  id: string;
  requestId: string;
  facilityId: string;
  facilityName: string;
  facilityCategory: string;
  productId: string;
  productName: string;
  status: AvailabilityResponseStatus;
  quantityAvailable: number | null;
  priceMinor: number | null;
  currency: string;
  sellerMessage: string | null;
  observedAt: string;
  freshness: AvailabilityFreshness;
}

export interface AvailabilityResponsesResult {
  requestId: string;
  productId: string;
  facilityId: string;
  requestStatus: AvailabilityRequestState;
  expiresAt: string;
  responses: BuyerAvailabilityResponse[];
}

export interface BuyerAvailabilityRequestSummary {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityCategory: string;
  productId: string;
  productName: string;
  requestedQuantity: number;
  budgetMode: 'unlimited' | 'maximum';
  budgetMinor: number | null;
  requestStatus: AvailabilityRequestState;
  createdAt: string;
  expiresAt: string;
  responseCount: number;
}

export interface BuyerAvailabilityRequestList {
  requests: BuyerAvailabilityRequestSummary[];
}

export type TransactionState = 'intent_created' | 'qr_ready' | 'qr_verified' | 'payment_declared' | 'payment_confirmed' | 'fulfilment_pending' | 'fulfilled' | 'received' | 'rated' | 'closed';
export type ExternalPaymentMethod = 'cash' | 'mobile_money' | 'pay_on_delivery';

export interface PurchaseIntentResult {
  intentId: string;
  responseId: string;
  transactionId: string;
  buyerAccountId: string;
  state: string;
}

export interface QrTokenIssueResult {
  transactionId: string;
  token: string;
  expiresAt: string;
}

export interface QrVerificationResult {
  accepted: boolean;
  transactionId: string;
  verifiedAt?: string;
  nextReplayCount?: number;
  reason?: string;
  facilityId?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPriceMinor?: number;
  couponCode?: string | null;
  netAmountMinor?: number;
}

export interface TransactionRatingResult {
  ratingId: string;
  transactionId: string;
  score: number;
  note: string | null;
  state: 'rated';
}

export interface TransactionTransitionResult {
  accepted: true;
  transactionId: string;
  from: TransactionState;
  to: TransactionState;
  actorRole: 'buyer' | 'seller';
}

export interface TransactionSnapshotResult {
  transactionId: string;
  state: TransactionState;
  actorRole: 'buyer' | 'seller';
  productId: string;
  facilityId: string;
  quantity: number;
  unitPriceMinor: number;
  couponCode: string | null;
  netAmountMinor: number;
}

export interface ExternalPaymentDeclarationResult {
  declarationId: string;
  transactionId: string;
  method: ExternalPaymentMethod;
  buyerAccountId: string;
}

export interface ExternalPaymentConfirmationResult {
  declarationId: string;
  transactionId: string;
  buyerAccountId: string;
  sellerAccountId: string;
  state: 'payment_confirmed';
}

export interface SellerAvailabilityRequest {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityCategory: string;
  facilityTrust: PublicFacility['trust'];
  facilityPlan: PublicFacility['plan'];
  productId: string;
  productName: string;
  requestedQuantity: number;
  budgetMode: 'unlimited' | 'maximum';
  budgetMinor: number | null;
  requestStatus: AvailabilityRequestState;
  createdAt: string;
  expiresAt: string;
  responseStatus: AvailabilityResponseStatus | null;
  responseObservedAt: string | null;
  freshness: AvailabilityFreshness;
}

export interface SellerAvailabilityQueue {
  authorized: boolean;
  requests: SellerAvailabilityRequest[];
}

export type SellerCataloguePublicationState = 'draft' | 'pending_validation' | 'published' | 'sold_out' | 'archived';
export type SellerCatalogueDiscountKind = 'percentage' | 'fixed';

export interface SellerCatalogueProduct {
  id: string;
  facilityId: string;
  facilityName: string;
  name: string;
  description: string | null;
  unit: string;
  priceMinor: number;
  currency: string;
  discountKind: SellerCatalogueDiscountKind | null;
  discountValueMinor: number | null;
  netPriceMinor: number | null;
  publicationState: SellerCataloguePublicationState;
}

export interface SellerCatalogueResult {
  authorized: boolean;
  products: SellerCatalogueProduct[];
}

export interface OperatorRunSummary {
  id: string;
  operation: string;
  provider: string | null;
  outcome: string;
  resultCount: number;
  errorClass: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface OperatorRunsResult {
  authorized: boolean;
  runs: OperatorRunSummary[];
}

export interface PublicFacilityImportResult {
  runId: string;
  facilityId: string;
  sourceRef: string;
  created: boolean;
  trust: 'unclaimed';
}

export type ClaimRequestState = 'draft' | 'submitted' | 'admin_review' | 'needs_more_evidence';

export type EvidenceKind = 'identity' | 'company' | 'facility' | 'product' | 'service' | 'location';

export interface ClaimDraftResult {
  requestId: string;
  facilityId: string;
  state: ClaimRequestState;
  version: number;
  created: boolean;
}

export interface ClaimEvidenceItem {
  evidenceKind: EvidenceKind;
  objectKey: string;
  checksum: string | null;
}

export interface ClaimSubmitResult {
  requestId: string;
  facilityId: string;
  state: 'submitted';
  facilityTrust: 'verification_submitted';
  version: number;
  evidenceCount: number;
  created: boolean;
}

export interface ReviewQueueItem {
  requestId: string;
  facilityId: string;
  facilityName: string;
  facilityTrust: string;
  state: string;
  version: number;
  createdAt: string;
  submittedAt: string | null;
  evidenceCount: number;
  evidenceKinds: string[];
}

export interface ReviewQueueResult {
  authorized: boolean;
  requests: ReviewQueueItem[];
}

export type ReviewOutcome = 'certified' | 'rejected' | 'needs_more_evidence';

export interface ReviewClaimResult {
  requestId: string;
  facilityId: string;
  outcome: ReviewOutcome;
  state: ReviewOutcome;
  facilityTrust: 'unconfirmed' | 'rejected' | 'verification_draft';
  version: number;
}

export interface NotificationSummary {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  state: string;
  createdAt: string;
  seenAt: string | null;
}

export interface NotificationInboxResult {
  notifications: NotificationSummary[];
}

export interface ApiFailure {
  code: string;
  message: string;
  retryable: boolean;
}

export interface ApiResult<T> {
  ok: boolean;
  correlationId: string;
  data?: T;
  error?: ApiFailure;
}


export interface AccountCapabilitiesResult {
  accountId: string;
  seller: boolean;
  operator: boolean;
  reviewer: boolean;
}
