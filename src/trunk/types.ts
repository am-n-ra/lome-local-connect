export type PublicTrust = 'unclaimed' | 'unconfirmed' | 'confirmed';

export interface SearchOptions {
  category: string;
  /** Search constraint: maximum reduced price in minor units (budget_max). */
  budgetMaxMinor?: number | null;
  /** Search constraint: minimum Omni-rented stock (quantité_min). */
  quantiteMin?: number | null;
  /** Search constraint: search radius in kilometres (rayon_km) from the viewport centre. */
  rayonKm?: number | null;
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
  couponLabel: string | null;
  currency: string;
  /** Omni-rented stock (v3 stock_loué_omni) — drives availability filtering. */
  stockLoueOmni: number;
  /** Original (pre-discount) price in minor units (v3 prix_original). */
  prixOriginal: number;
  /** Discounted price in minor units (v3 prix_réduit) — always below prixOriginal. */
  prixReduit: number;
  /** Mandatory displayed discount percentage (v3 %réduction). */
  pourcentageReduction: number;
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
export type ExternalPaymentMethod = 'cash' | 'mobile_money';

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

export interface TransactionMessage {
  id: string;
  transactionId: string;
  senderRole: 'buyer' | 'seller';
  body: string;
  createdAt: string;
  seenAt: string | null;
}

export interface TransactionMessagesResult {
  transactionId: string;
  messages: TransactionMessage[];
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

export interface SellerCatalogueFacility {
  id: string;
  name: string;
  category: string;
  address: string | null;
  currency: string;
  slotState: 'active' | 'missing';
  productCount: number;
}

export type ProductAvailabilityState = 'en_stock' | 'verifie' | 'a_valider' | 'bientot';

export interface SellerCatalogueProduct {
  id: string;
  facilityId: string;
  facilityName: string;
  name: string;
  description: string | null;
  unit: string;
  currency: string;
  stockLoueOmni: number;
  prixOriginal: number;
  prixReduit: number;
  pourcentageReduction: number;
  publicationState: SellerCataloguePublicationState;
  availabilityState: ProductAvailabilityState;
  availabilityExpiresAt: string | null;
  availabilityProEligible: boolean;
}

export interface ProductStockEvent {
  id: string;
  fromState: ProductAvailabilityState | null;
  toState: ProductAvailabilityState;
  source: 'auto' | 'manual';
  reason: string | null;
  createdAt: string;
}

export interface SellerCatalogueResult {
  authorized: boolean;
  facilities: SellerCatalogueFacility[];
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
  latitude: number;
  longitude: number;
  state: string;
  version: number;
  createdAt: string;
  submittedAt: string | null;
  evidenceCount: number;
  evidenceKinds: string[];
}

export type FacilityOperationalState = 'ouvert' | 'ferme' | 'temporairement_indisponible';

export interface AdminConsoleResult {
  authorized: boolean;
  pendingClaims: number;
  pendingActivations: number;
  operatorRuns: number;
  auditEventsToday: number;
}

export interface AdminAuditEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorAccountId: string | null;
  reason: string | null;
  createdAt: string;
  facilityName: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface AdminAuditListResult {
  authorized: boolean;
  events: AdminAuditEvent[];
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

export type ClaimReviewNotificationOutcome = 'certified' | 'needs_more_evidence' | 'rejected';

export interface NotificationSummary {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  state: string;
  createdAt: string;
  seenAt: string | null;
  reviewOutcome?: ClaimReviewNotificationOutcome;
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


export interface RoleManagementAccount {
  accountId: string;
  authUserId: string;
  roles: Array<'buyer' | 'seller' | 'admin' | 'operator' | 'reviewer'>;
  onboardingState: string;
  suspended: boolean;
  facilityCount: number;
}

export interface RoleManagementResult {
  accountId: string;
  role: 'operator' | 'reviewer';
  status: 'active' | 'revoked';
}

export interface AccountCapabilitiesResult {
  accountId: string;
  roles: Array<'buyer' | 'seller' | 'admin' | 'operator' | 'reviewer'>;
  onboardingState: string;
  suspended: boolean;
  facilityCount: number;
  // Facilities owned by the signed-in account (rule 7 Evergreen pin ring).
  // Optional so stale cached responses without the field stay assignable.
  ownedFacilityIds?: string[];
  capabilities: {
    sellerWorkspace: boolean;
    operatorTools: boolean;
    reviewerWorkspace: boolean;
    adminTools: boolean;
  };
}

export type WalletLedgerKind = 'recharge' | 'slot_spend' | 'facility_pro_spend' | 'ad_spend' | 'coupon_credit' | 'bonus_grant' | 'bonus_spend' | 'reversal';
export interface WalletLedgerSummary {
  id: string;
  kind: WalletLedgerKind;
  amountMinor: number;
  status: 'pending' | 'confirmed' | 'failed' | 'reversed';
  reference: string;
  facilityId: string | null;
  createdAt: string;
  confirmedAt: string | null;
}
export interface WalletFacilitySummary {
  facilityId: string;
  facilityName: string;
  plan: 'free' | 'pro_active' | 'pro_expired';
  slotState: 'active';
  proPriceMinor: number;
  billingCurrency: string;
}
export interface WalletOverviewResult {
  walletId: string;
  currency: string;
  balanceMinor: number;
  facilities: WalletFacilitySummary[];
  entries: WalletLedgerSummary[];
}
export interface WalletRechargeResult {
  rechargeId: string;
  status: 'pending';
  amountMinor: number;
  currency: string;
  checkoutUrl: string;
  providerTransactionId: string;
}
export interface FacilityProActivationResult {
  facilityId: string;
  entitlementId: string;
  plan: 'pro_active';
  endsAt: string;
  spendLedgerEntryId: string;
}

/** Cible du tracé itinéraire in-app (écran 10 — tracé Evergreen sur la carte). */
export interface RouteTarget {
  longitude: number;
  latitude: number;
  name: string;
}
