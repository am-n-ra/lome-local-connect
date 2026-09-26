import type { ExistenceLevel, OfferExistence, OfferIntegrity, OfferReputation } from './offer-existence';

export type PublicTrust = 'unclaimed' | 'unconfirmed' | 'confirmed';

export interface SearchOptions {
  category: string;
  /** Search constraint: maximum reduced price in minor units (budget_max). */
  budgetMaxMinor?: number | null;
  /**
   * ISO code of the currency `budgetMaxMinor` is expressed in (D-LOC-3).
   * The server MUST NOT compare two `price_minor` of different currencies:
   * without this, a 2 500 F budget is silently compared to a dollar price.
   */
  budgetCurrency?: string | null;
  /** Local minor units per USD minor, used to normalise a USD-priced offer (D-LOC-3). */
  budgetRatePerUsdMinor?: number | null;
  /** Search constraint: minimum Omni-rented stock (quantité_min). */
  quantiteMin?: number | null;
  /** Search constraint: search radius in kilometres (rayon_km) from the viewport centre. */
  rayonKm?: number | null;
  /** Search constraint: keep only facilities operationally open (Ouvert; operational_state). */
  operationalState?: 'ouvert' | null;
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
  /** NW-13j: true when the facility has an active sponsored ad campaign (boost in buyer search). */
  sponsored?: boolean;
  /** R-E (S-11): the entity behind the place — the offer leads to its offerer. Null on cold-start places (S-05). */
  entityId?: string | null;
  entityName?: string | null;
  entityKind?: 'individu' | 'organisation' | null;
  /** S-06 — max existence level of this place's published offers (a projection, not a second rule). */
  existenceLevel?: ExistenceLevel;
}

/** R-E (S-11) — the OFFERER, as seen publicly. Never carries contact (E-2). */
export interface PublicEntity {
  id: string;
  name: string;
  kind: 'individu' | 'organisation';
  trust: PublicTrust;
  category: string | null;
  address: string | null;
  /** null when the entity has no place (digital). */
  latitude: number | null;
  longitude: number | null;
  /** Published offers — a fact, never an availability promise (E-3). */
  offerCount: number;
  minPriceMinor: number | null;
  currency: string | null;
}

export interface PublicEntityDetail extends PublicEntity {
  offers: PublicProduct[];
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
  /** S-01 — characteristics shown on the offer sheet. Null = not declared. */
  positionKind: OfferPositionKind | null;
  uniquenessKind: OfferUniquenessKind | null;
  handoverKind: OfferHandoverKind | null;
  priceKind: OfferPriceKind | null;
  conditionKind: OfferConditionKind | null;
  /** S-06 — derived existence level 0→4 (never stored). Absent when the surface has no facts. */
  existence?: OfferExistence;
  /** S-32 — automatic integrity, with the failed checks named. */
  integrity?: OfferIntegrity;
  /** S-32 — reputation of THIS offer (S-26 traced it). `score` null = no rating yet. */
  reputation?: OfferReputation;
}

export interface FacilityDetail extends PublicFacility {
  products: PublicProduct[];
}

export type AvailabilityRequestState = 'submitted' | 'responding' | 'responses' | 'expired' | 'cancelled';

export type AvailabilityResponseStatus = 'available' | 'partial' | 'unavailable' | 'corrected';

export type AvailabilityFreshness = 'fresh' | 'stale' | 'expired';

export interface AvailabilityResult {
  requestId: string;
  productId: string;
  facilityId: string;
  status: AvailabilityRequestState;
  expiresAt: string;
  deliveryMode: 'retrait' | 'livraison';
  note: string | null;
  message: string;
  creditCost: number;
  creditsRemaining: number;
  monthlyQuota: number;
  plan: 'free' | 'pro';
}

export interface BuyerCreditSummary {
  accountId: string;
  plan: 'free' | 'pro';
  monthlyQuota: number;
  creditsUsed: number;
  extraCredits: number;
  creditsRemaining: number;
  periodMonth: string;
}

export interface BulkAvailabilityResult {
  requestId: string;
  productId: string;
  facilityIds: string[];
  facilityCount: number;
  status: AvailabilityRequestState;
  expiresAt: string;
  deliveryMode: 'retrait' | 'livraison';
  note: string | null;
  message: string;
  creditCost: number;
  creditsRemaining: number;
  monthlyQuota: number;
  plan: 'free' | 'pro';
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
  deliveryMode: 'retrait' | 'livraison';
  note: string | null;
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
  deliveryMode: 'retrait' | 'livraison';
  note: string | null;
  requestStatus: AvailabilityRequestState;
  createdAt: string;
  expiresAt: string;
  responseCount: number;
  latitude: number;
  longitude: number;
}

export interface BuyerAvailabilityRequestList {
  requests: BuyerAvailabilityRequestSummary[];
}

/** FF-4 — annulation acheteur d'une demande de dispo (Phase A uniquement, sans effet
 *  monétaire). Refusée dès qu'une intention d'achat existe (le verrou est engagé). */
export interface CancelAvailabilityRequestResult {
  requestId: string;
  status: 'cancelled';
  cancelled: boolean;
}

export type TransactionState = 'intent_created' | 'qr_ready' | 'qr_verified' | 'payment_declared' | 'payment_confirmed' | 'fulfilment_pending' | 'fulfilled' | 'received' | 'rated' | 'closed';
export type ExternalPaymentMethod = 'cash' | 'mobile_money';

export interface PurchaseIntentResult {
  intentId: string;
  responseId: string;
  transactionId: string;
  buyerAccountId: string;
  state: string;
  qrToken?: string;
  qrExpiresAt?: string;
}

export interface QrTokenIssueResult {
  transactionId: string;
  token: string;
  expiresAt: string;
}

/** FF-5 — résultat de la révocation d'un QR non encore scanné. */
export interface QrRevocationResult {
  transactionId: string;
  revoked: boolean;
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
  /** Contact vendeur (RAC-1) — exposé UNIQUEMENT dans le contexte d'une transaction
   *  dont l'appelant est membre (après intention d'achat), jamais publiquement. */
  sellerContactPhone: string | null;
  sellerContactWhatsapp: string | null;
  sellerFacilityName: string | null;
}

/** FF-2 — une transaction non terminale de l'utilisateur connecté, pour l'écran
 *  « En cours » : permet de la REPRENDRE après avoir quitté (jamais annulée). */
export interface OpenTransactionSummary {
  transactionId: string;
  state: TransactionState;
  actorRole: 'buyer' | 'seller';
  productId: string;
  productName: string | null;
  facilityId: string;
  facilityName: string | null;
  quantity: number;
  netAmountMinor: number;
  /** Horodatage du dernier événement — sert d'ETA/âge dans la liste. */
  lastEventAt: string;
  createdAt: string;
}

export interface OpenTransactionsResult {
  transactions: OpenTransactionSummary[];
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
  deliveryMode: 'retrait' | 'livraison';
  requestNote: string | null;
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

export type FacilityType = 'fixe' | 'mobile' | 'digital';

export interface SellerCatalogueFacility {
  id: string;
  name: string;
  category: string;
  address: string | null;
  currency: string;
  slotState: 'active' | 'missing';
  operationalState: FacilityOperationalState;
  productCount: number;
  facilityType: FacilityType | null;
  rayonKm: number | null;
  trustState: string;
  /** Contact vendeur — visible uniquement dans le contexte transactionnel (RAC-1). */
  contactPhone: string | null;
  contactWhatsapp: string | null;
}

export interface CreateSellerFacilityResult {
  facilityId: string;
  slotId: string;
  trustState: 'unconfirmed';
  facilityType: FacilityType;
  created: boolean;
}

export type ProductAvailabilityState = 'en_stock' | 'verifie' | 'a_valider' | 'bientot';

export interface SavedSearch {
  id: string;
  query: string;
  constraints: Record<string, unknown>;
  active: boolean;
  createdAt: string;
}

export interface SavedSearchListResult {
  searches: SavedSearch[];
}

export interface SellerCatalogueProduct {
  id: string;
  /** S-25: the OFFER belongs to the entity. The place is optional (mobile/digital/individual). */
  entityId: string;
  entityName: string;
  facilityId: string | null;
  facilityName: string | null;
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
  /** S-01 — the offer's characteristics. Day-1 model: seven characteristics, no separate "types". */
  positionKind: OfferPositionKind | null;
  uniquenessKind: OfferUniquenessKind | null;
  handoverKind: OfferHandoverKind | null;
  priceKind: OfferPriceKind | null;
  conditionKind: OfferConditionKind | null;
}

/** S-01 car.3 — position: fixe / mobile / immatérielle (replaces facility_type on the offer). */
export type OfferPositionKind = 'fixe' | 'mobile' | 'immaterielle';
/** S-13 / D-C6 — the nature of the offer owner: a private individual or an organisation.
 * Same object (S-13), but the trust threshold depends on it: 1 sale for an individual, 3 for a business. */
export type OfferOwnerKind = 'individu' | 'organisation';
/** S-01 car.2 — uniqueness: a renewable offer, or a single piece that disappears after the sale. */
export type OfferUniquenessKind = 'renouvelable' | 'piece_unique';
/** S-01 car.5 — handover: retrait / livraison / immatériel. */
export type OfferHandoverKind = 'retrait' | 'livraison' | 'immateriel';
/** S-01 car.7 — price: fixed or negotiable. */
export type OfferPriceKind = 'fixe' | 'negociable';
/** S-01 car.6 — condition: new or second-hand. */
export type OfferConditionKind = 'neuf' | 'occasion';

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
  catalogReady: boolean;
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

/** Result of the server-side routing proxy (`GET /api/v2/public/routing`).
 * `available: false` is a normal, honest outcome: the caller keeps its own
 * labelled fallback instead of pretending a straight line is a road route. */
/** Which engine answered. Only the server chooses, so the client only reports it. */
export type RoutingProvider = 'mapbox' | 'osrm';

export type RoutingUnavailableReason =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'OUT_OF_ZONE'
  | 'PROVIDER_ERROR'
  // RT-D1: a pair with genuinely no road is not an outage. Reporting it as one
  // would be a false statement about the service, the same defect as labelling a
  // refusal "unavailable".
  | 'NO_ROUTE'
  // RT-D1: this buyer has spent their itinerary budget. Kept distinct from
  // PROVIDER_ERROR so the client can wait instead of showing a fault.
  | 'QUOTA_HOURLY'
  | 'QUOTA_DAILY'
  // RT-D1 (opt-in): the buyer holds no live purchase intent for this session.
  | 'INTENT_REQUIRED';

export interface RoutingStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RoutingAvailable {
  available: true;
  provider: RoutingProvider;
  profile: 'driving' | 'foot';
  distanceMeters: number;
  durationSeconds: number;
  distanceLabel: string;
  durationLabel: string;
  coordinates: [number, number][];
  steps: RoutingStep[];
}

export interface RoutingUnavailable {
  available: false;
  reason: RoutingUnavailableReason;
  message: string;
}

export type RoutingResult = RoutingAvailable | RoutingUnavailable;

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
  zone?: string | null;
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
  email: string | null;
  name: string | null;
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

// ---- Team governance (P2-A) ----
export interface Team {
  id: string;
  name: string;
  zone: string | null;
  description: string | null;
  createdByAccountId: string | null;
  createdAt: string;
  memberCount: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  accountId: string;
  authUserId: string;
  roleInTeam: 'lead' | 'member';
  status: 'active' | 'revoked';
  addedByAccountId: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  roleInTeam: 'lead' | 'member';
  status: 'pending' | 'accepted' | 'revoked';
  invitedByAccountId: string | null;
  createdAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
}

export interface TeamListResult {
  teams: Team[];
  members: TeamMember[];
  invites: TeamInvite[];
}

export interface CreateTeamResult {
  id: string;
  name: string;
  zone: string | null;
}

export interface TeamMemberResult {
  teamId: string;
  accountId: string;
  roleInTeam: 'lead' | 'member';
  status: 'active' | 'revoked';
}

export interface TeamInviteResult {
  id: string;
  teamId: string;
  email: string;
  roleInTeam: 'lead' | 'member';
  status: 'pending' | 'accepted' | 'revoked';
}

export interface MyTeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  teamZone: string | null;
  roleInTeam: 'lead' | 'member';
  status: 'pending' | 'accepted' | 'revoked';
  invitedByAccountId: string | null;
  createdAt: string;
  acceptedAt: string | null;
}

export interface TeamInviteAcceptResult {
  id: string;
  teamId: string;
  roleInTeam: 'lead' | 'member';
  status: 'accepted';
  memberId: string;
}

export interface FacilityZoneAssignment {
  facilityId: string;
  zone: string | null;
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

export type WalletLedgerKind = 'recharge' | 'slot_spend' | 'facility_pro_spend' | 'ad_spend' | 'coupon_credit' | 'bonus_grant' | 'bonus_spend' | 'buyer_pro_spend' | 'reversal';
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
export type SellerBonusUnlockState = 'locked' | 'eligible' | 'granted';
export interface FacilityBonusStatus {
  facilityId: string;
  unlockType: 'pro_test_credit_20_usd';
  distinctBuyerCount: number;
  requiredCount: number;
  status: SellerBonusUnlockState;
  amountMinor: number;
  trustState: 'unclaimed' | 'verification_draft' | 'verification_submitted' | 'admin_review' | 'certified' | 'unconfirmed' | 'confirmed' | 'rejected' | 'suspended';
  qualifyingSales: number;
  bonusUnlockedAt: string | null;
}
export interface FacilityBonusPersistenceResult {
  ledgerEntryId: string;
  walletId: string;
  kind: 'bonus_grant';
  amountMinor: 10000;
  status: 'confirmed';
  facilityId: string;
}
export interface SellerFacilityAnalytics {
  facilityId: string;
  facilityName: string;
  requests: number;
  responsesAvailable: number;
  transactionsStarted: number;
  qrScansVerified: number;
  transactionsClosed: number;
  grossRevenueMinor: number;
  billingCurrency: string;
  scanToVerifyAvgMs: number | null;
}
export type AdCampaignStatus = 'planifiee' | 'active' | 'terminee' | 'pausee';
export interface SellerAdCampaign {
  id: string;
  facilityId: string;
  name: string;
  budgetMinor: number;
  spentMinor: number;
  status: AdCampaignStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}
export interface AdCampaignCreateResult {
  campaign: SellerAdCampaign;
  spendLedgerEntryId: string;
  budgetRemainingMinor: number;
  billingCurrency: string;
}
export interface AdCampaignListResult {
  campaigns: SellerAdCampaign[];
  budgetRemainingMinor: number;
  billingCurrency: string;
}
export interface WalletFacilitySummary {
  facilityId: string;
  facilityName: string;
  plan: 'free' | 'pro_active' | 'pro_expired';
  slotState: 'active';
  proPriceMinor: number;
  billingCurrency: string;
  baseProPriceUsdMinor: number;
  baseBillingCurrency: string;
  proEndsAt: string | null;
  renewalOptIn: boolean;
  daysLeft: number;
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
  purpose: 'wallet' | 'pack';
  packCredits: number | null;
}

export interface BulkPack {
  id: string;
  credits: number;
  priceMinor: number;
  billingCurrency: string;
}
export interface FacilityProActivationResult {
  facilityId: string;
  entitlementId: string;
  plan: 'pro_active';
  endsAt: string;
  spendLedgerEntryId: string;
}
export interface FacilityRenewalStatus {
  facilityId: string;
  facilityName: string;
  plan: 'free' | 'pro_active' | 'pro_expired';
  entitlementId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  renewalOptIn: boolean;
  daysLeft: number;
  proPriceMinor: number;
  billingCurrency: string;
  baseProPriceUsdMinor: number;
  baseBillingCurrency: string;
  walletBalanceMinor: number;
  sufficientFunds: boolean;
}
export interface FacilityRenewalOptInResult {
  facilityId: string;
  renewalOptIn: boolean;
}
export interface FacilityRenewalResult {
  facilityId: string;
  renewed: boolean;
  reason: string;
  newEntitlementId: string | null;
  endsAt: string | null;
  spendLedgerEntryId: string | null;
  status: string;
}

export interface AccountFavorite {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityCategory: string;
  createdAt: string;
}
export interface FavoritesResult {
  favorites: AccountFavorite[];
}

export type BuyerProPlan = 'free' | 'pro_active' | 'pro_expired';
export interface BuyerProStatus {
  accountId: string;
  plan: BuyerProPlan;
  entitlementId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  renewalOptIn: boolean;
  daysLeft: number;
  proPriceMinor: number;
  billingCurrency: string;
  baseProPriceUsdMinor: number;
  baseBillingCurrency: string;
  walletBalanceMinor: number;
  sufficientFunds: boolean;
  compareQuota: number;
}
export interface BuyerProActivationResult {
  accountId: string;
  entitlementId: string;
  plan: 'pro_active';
  endsAt: string;
  spendLedgerEntryId: string;
}
export interface BuyerProOptInResult {
  accountId: string;
  renewalOptIn: boolean;
}
export interface BuyerProRenewalResult {
  accountId: string;
  renewed: boolean;
  reason: string;
  newEntitlementId: string | null;
  endsAt: string | null;
  spendLedgerEntryId: string | null;
  status: string;
}

/** Cible du tracé itinéraire in-app (écran 10 — tracé Evergreen sur la carte). */
export interface RouteTarget {
  longitude: number;
  latitude: number;
  name: string;
}
