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
