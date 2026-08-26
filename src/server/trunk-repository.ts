import { neon } from '@neondatabase/serverless';
import { createHash, randomBytes } from 'node:crypto';

import type { QrVerificationResult, TransactionState, WalletEntryKind } from '../domain/contracts';
import { EvidenceStoragePolicyError, FieldPilotPolicyError, hasPrivateBlobConfiguration, verifyPrivateEvidenceObjects } from './evidence-contract';
export { EvidenceStoragePolicyError, FieldPilotPolicyError } from './evidence-contract';
import type { AvailabilityResponseStatus as BuyerAvailabilityResponseStatus, AvailabilityResponsesResult, AvailabilityResult, ClaimEvidenceItem, FacilityDetail, PublicFacility, PublicProduct, SellerCatalogueProduct, TransactionSnapshotResult } from '../trunk/types';

export interface DatabaseClient {
  query(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>;
  transaction?(queries: unknown[], options?: Record<string, unknown>): Promise<unknown[]>;
}

function database(): ReturnType<typeof neon> {
  const url = process.env.V2_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('V2_DATABASE_URL is not configured for the server runtime.');
  return neon(url);
}

const PUBLIC_TRUST_STATES = new Set<PublicFacility['trust']>(['unclaimed', 'certified', 'unconfirmed', 'confirmed']);

const toFacility = (row: Record<string, unknown>): PublicFacility => ({
  id: String(row.id),
  name: String(row.name),
  category: String(row.category ?? 'Local supply'),
  address: row.address ? String(row.address) : null,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  // Internal verification states are never a public trust claim. Before review, the public meaning remains unclaimed.
  trust: PUBLIC_TRUST_STATES.has(String(row.trust_state) as PublicFacility['trust']) ? String(row.trust_state) as PublicFacility['trust'] : 'unclaimed',
  plan: String(row.commercial_plan) as PublicFacility['plan'],
  productCount: Number(row.product_count ?? 0),
});

const retryDatabase = async <T>(operation: () => Promise<T>): Promise<T> => {
  let lastError: unknown;
  for (const delay of [0, 800, 1800]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      return await operation();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Neon database request failed after bounded recovery attempts.');
};

export class AvailabilityPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvailabilityPolicyError';
  }
}

export type QrVerificationPersistenceResult = QrVerificationResult | {
  accepted: false;
  transactionId: string;
  reason: 'NOT_VERIFIED';
};

export class SellerCataloguePolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SellerCataloguePolicyError';
  }
}

export class PurchaseIntentPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PurchaseIntentPolicyError';
  }
}

export interface PurchaseIntentPersistenceResult {
  intentId: string;
  responseId: string;
  transactionId: string;
  buyerAccountId: string;
  state: string;
}

export type AvailabilityResponseStatus = 'available' | 'partial' | 'unavailable';

export interface AvailabilityResponsePersistenceResult {
  responseId: string;
  requestId: string;
  facilityId: string;
  productId: string;
  status: AvailabilityResponseStatus;
  quantityAvailable: number | null;
  priceMinor: number | null;
  observedAt: string;
}

export interface QrTokenIssuePersistenceResult {
  transactionId: string;
  token: string;
  expiresAt: string;
}

export type WalletSpendKind = Extract<WalletEntryKind, 'slot_spend' | 'facility_pro_spend' | 'ad_spend' | 'bonus_spend'>;

export interface WalletSpendPersistenceResult {
  ledgerEntryId: string;
  walletId: string;
  kind: WalletSpendKind;
  amountMinor: number;
  status: 'confirmed';
  facilityId: string;
}

export interface FacilityBonusPersistenceResult {
  ledgerEntryId: string;
  walletId: string;
  kind: 'bonus_grant';
  amountMinor: 2000;
  status: 'confirmed';
  facilityId: string;
}

export interface TransactionTransitionPersistenceResult {
  accepted: true;
  transactionId: string;
  from: TransactionState;
  to: TransactionState;
  actorRole: 'buyer' | 'seller';
}

export interface TransactionRatingPersistenceResult {
  ratingId: string;
  transactionId: string;
  score: number;
  note: string | null;
  state: 'rated';
}

export type ExternalPaymentMethod = 'cash' | 'mobile_money' | 'pay_on_delivery';

export interface ExternalPaymentDeclarationPersistenceResult {
  declarationId: string;
  transactionId: string;
  method: ExternalPaymentMethod;
  buyerAccountId: string;
}

export interface ExternalPaymentConfirmationPersistenceResult {
  declarationId: string;
  transactionId: string;
  buyerAccountId: string;
  sellerAccountId: string;
  state: 'payment_confirmed';
}

export class AvailabilityResponsePolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvailabilityResponsePolicyError';
  }
}

export class SellerAuthorizationPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SellerAuthorizationPolicyError';
  }
}



export interface PublicFacilityImportInput {
  authUserId: string;
  provider: 'openstreetmap';
  attribution: string;
  sourceRef: string;
  name: string;
  category: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  correlationId: string;
}

export interface PublicFacilityImportResult {
  runId: string;
  facilityId: string;
  sourceRef: string;
  created: boolean;
  trust: 'unclaimed';
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

export interface ClaimDraftResult {
  requestId: string;
  facilityId: string;
  state: 'draft' | 'submitted' | 'admin_review' | 'needs_more_evidence';
  version: number;
  created: boolean;
}

export interface ClaimSubmitInput {
  authUserId: string;
  requestId: string;
  version: number;
  evidence: ClaimEvidenceItem[];
  correlationId: string;
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

export type ReviewOutcome = 'certified' | 'rejected' | 'needs_more_evidence';

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

export interface ReviewClaimResult {
  requestId: string;
  facilityId: string;
  outcome: ReviewOutcome;
  state: ReviewOutcome;
  facilityTrust: 'unconfirmed' | 'rejected' | 'verification_draft';
  version: number;
}
export interface SellerActivationCandidate {
  accountId: string;
  authUserId: string;
  onboardingState: string;
  facilityCount: number;
  createdAt: string;
  suspended: boolean;
}
export interface SellerActivationResult {
  accountId: string;
  onboardingState: 'seller_ready';
  activated: true;
}
export interface SellerAccountSuspensionResult {
  accountId: string;
  suspended: boolean;
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
export interface WebPushSubscriptionInput {
  authUserId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
}
export interface WebPushSubscriptionResult {
  subscriptionId: string;
  state: 'granted';
  created: boolean;
}
export interface WebPushSubscriptionRevokeResult {
  revoked: true;
  endpoint: string;
}

export class TransactionPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionPolicyError';
  }
}

export class WalletPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletPolicyError';
  }
}

export const toProduct = (row: Record<string, unknown>): PublicProduct => ({
  id: String(row.id),
  facilityId: String(row.facility_id),
  name: String(row.name),
  description: row.description ? String(row.description) : null,
  category: row.category ? String(row.category) : null,
  unit: String(row.unit ?? 'unit'),
  priceMinor: Number(row.price_minor),
  currency: String(row.currency ?? 'USD'),
  couponLabel: row.coupon_label ? String(row.coupon_label) : null,
});

export function createTrunkRepository(sql: ReturnType<typeof neon> = database()) {
  return {
    async createPublicFacilityImport(input: PublicFacilityImportInput): Promise<PublicFacilityImportResult> {
      if (input.provider !== 'openstreetmap' || !input.sourceRef.trim() || !input.name.trim() || !Number.isFinite(input.latitude) || !Number.isFinite(input.longitude) || input.latitude < -90 || input.latitude > 90 || input.longitude < -180 || input.longitude > 180) {
        throw new FieldPilotPolicyError('The public facility import payload is invalid.');
      }
      const actorRows = await retryDatabase(() => sql`
        select a.id
        from v2_accounts a
        join v2_account_roles ar on ar.account_id = a.id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and ar.role = 'operator'
          and ar.status = 'active'
        limit 1
      `);
      const actor = (actorRows as Record<string, unknown>[])[0];
      if (!actor) throw new FieldPilotPolicyError('An active Omni operator role is required for public imports.');

      let sourceRows = await retryDatabase(() => sql`
        select id from v2_public_sources where provider = ${input.provider} limit 1
      `);
      if (!(sourceRows as Record<string, unknown>[])[0]) {
        sourceRows = await retryDatabase(() => sql`
          insert into v2_public_sources (provider, attribution)
          values (${input.provider}, ${input.attribution})
          returning id
        `);
      }
      const source = (sourceRows as Record<string, unknown>[])[0];
      if (!source) throw new FieldPilotPolicyError('The public source could not be prepared.');

      const rows = await retryDatabase(() => sql`
        with existing as (
          select f.id, false as created
          from v2_facilities f
          join v2_facility_source_refs fr on fr.facility_id = f.id
          where fr.source_id = ${String(source.id)}::uuid
            and fr.source_ref = ${input.sourceRef.trim()}
          limit 1
        ), inserted as (
          insert into v2_facilities
            (account_id, source_kind, source_name, source_ref, name, category, latitude, longitude, address, trust_state)
          select null, 'public_import', ${input.provider}, ${input.sourceRef.trim()}, ${input.name.trim()}, ${input.category?.trim() || null}, ${input.latitude}, ${input.longitude}, ${input.address?.trim() || null}, 'unclaimed'
          where not exists (select 1 from existing)
          returning id, true as created
        ), selected as (
          select id, created from inserted
          union all
          select id, created from existing
          limit 1
        ), refreshed as (
          update v2_facilities f
          set name = ${input.name.trim()},
              category = ${input.category?.trim() || null},
              latitude = ${input.latitude},
              longitude = ${input.longitude},
              address = ${input.address?.trim() || null},
              updated_at = now()
          from selected
          where f.id = selected.id
            and f.account_id is null
            and f.source_kind = 'public_import'
            and f.trust_state = 'unclaimed'
          returning f.id
        ), referenced as (
          insert into v2_facility_source_refs (facility_id, source_id, source_ref, raw_metadata)
          select id, ${String(source.id)}::uuid, ${input.sourceRef.trim()}, ${JSON.stringify({ provider: input.provider, name: input.name.trim(), category: input.category?.trim() || null, latitude: input.latitude, longitude: input.longitude, address: input.address?.trim() || null })}::jsonb
          from selected
          on conflict (source_id, source_ref) do update set raw_metadata = excluded.raw_metadata, last_seen_at = now()
          returning facility_id
        ), run as (
          insert into v2_operator_runs
            (operator_account_id, operation, provider, west, south, east, north, outcome, result_count, correlation_id, finished_at)
          select ${String(actor.id)}::uuid, 'public_import', ${input.provider}, ${input.longitude}, ${input.latitude}, ${input.longitude}, ${input.latitude}, 'success', 1,
            md5(${String(actor.id)} || ':public_import:' || ${input.provider} || ':' || ${input.sourceRef.trim()})::uuid, now()
          on conflict (correlation_id) do update
            set west = excluded.west,
                south = excluded.south,
                east = excluded.east,
                north = excluded.north,
                outcome = excluded.outcome,
                result_count = excluded.result_count,
                finished_at = excluded.finished_at
          returning id
        )
        select run.id as run_id, selected.id as facility_id, selected.created
        from run cross join selected
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The public facility import did not produce a recoverable result.');
      return { runId: String(row.run_id), facilityId: String(row.facility_id), sourceRef: input.sourceRef.trim(), created: row.created === true, trust: 'unclaimed' };
    },

    async listOperatorRuns(input: { authUserId: string }): Promise<{ authorized: boolean; runs: OperatorRunSummary[] }> {
      const authorizationRows = await retryDatabase(() => sql`
        select a.id
        from v2_accounts a
        join v2_account_roles ar on ar.account_id = a.id and ar.role in ('operator', 'reviewer') and ar.status = 'active'
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        limit 1
      `);
      if (!(authorizationRows as Record<string, unknown>[])[0]) return { authorized: false, runs: [] };
      const rows = await retryDatabase(() => sql`
        select r.id, r.operation, r.provider, r.outcome, r.result_count, r.error_class, r.started_at, r.finished_at
        from v2_operator_runs r
        join v2_accounts a on a.id = r.operator_account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        order by r.started_at desc, r.id desc
        limit 100
      `);
      return { authorized: true, runs: (rows as Record<string, unknown>[]).map((row) => ({ id: String(row.id), operation: String(row.operation), provider: row.provider === null ? null : String(row.provider), outcome: String(row.outcome), resultCount: Number(row.result_count), errorClass: row.error_class === null ? null : String(row.error_class), startedAt: new Date(String(row.started_at)).toISOString(), finishedAt: row.finished_at === null ? null : new Date(String(row.finished_at)).toISOString() })) };
    },

    async canUploadClaimEvidence(input: { authUserId: string; requestId: string }): Promise<boolean> {
      const rows = await retryDatabase(() => sql`
        select 1
        from v2_verification_requests vr
        join v2_accounts a on a.id = vr.claimant_account_id
        join v2_facilities f on f.id = vr.facility_id
        where vr.id = ${input.requestId}::uuid
          and a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and f.account_id is null
          and vr.state in ('draft', 'needs_more_evidence')
        limit 1
      `);
      return Boolean((rows as Record<string, unknown>[])[0]);
    },

    async getClaimEvidenceForViewer(input: { authUserId: string; facilityId: string; requestId: string; index: number }): Promise<{ objectKey: string; evidenceKind: string; contentType: string | null; size: number | null } | null> {
      if (!Number.isInteger(input.index) || input.index < 0 || input.index >= 12) throw new FieldPilotPolicyError('The evidence index is invalid.');
      const rows = await retryDatabase(() => sql`
        select ve.object_key, ve.evidence_kind, null::text as content_type, null::integer as size
        from v2_verification_evidence ve
        join v2_verification_requests vr on vr.id = ve.request_id
        join v2_facilities f on f.id = vr.facility_id
        where ve.request_id = ${input.requestId}::uuid
          and vr.facility_id = ${input.facilityId}::uuid
          and ve.visibility in ('private', 'admin_only')
          and (
            exists (
              select 1 from v2_accounts claimant
              where claimant.id = vr.claimant_account_id
                and claimant.auth_user_id = ${input.authUserId}
                and claimant.suspended_at is null
            )
            or exists (
              select 1 from v2_accounts reviewer
              join v2_account_roles ar on ar.account_id = reviewer.id and ar.role = 'reviewer' and ar.status = 'active'
              where reviewer.auth_user_id = ${input.authUserId}
                and reviewer.suspended_at is null
            )
          )
        order by ve.created_at asc, ve.id asc
        offset ${input.index}
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return null;
      return { objectKey: String(row.object_key), evidenceKind: String(row.evidence_kind), contentType: row.content_type === null ? null : String(row.content_type), size: row.size === null ? null : Number(row.size) };
    },

    async createClaimDraft(input: { authUserId: string; facilityId: string }): Promise<ClaimDraftResult> {
      const rows = await retryDatabase(() => sql`
        with account as (
          insert into v2_accounts (auth_user_id, onboarding_state)
          values (${input.authUserId}, 'seller_ready')
          on conflict (auth_user_id) do update set updated_at = now()
          returning id
        ), actor as (
          select id from account
          union all
          select id from v2_accounts where auth_user_id = ${input.authUserId} limit 1
        ), facility as (
          select id from v2_facilities
          where id = ${input.facilityId}::uuid
            and account_id is null
            and trust_state in ('unclaimed', 'verification_draft', 'needs_more_evidence')
          limit 1
        ), existing as (
          select vr.id, vr.facility_id, vr.version, false as created
          from v2_verification_requests vr
          join actor on actor.id = vr.claimant_account_id
          where vr.facility_id = ${input.facilityId}::uuid
            and vr.state in ('draft', 'submitted', 'admin_review', 'needs_more_evidence')
          limit 1
        ), inserted as (
          insert into v2_verification_requests (facility_id, claimant_account_id, state, version)
          select facility.id, actor.id, 'draft', 1
          from facility cross join actor
          where not exists (select 1 from existing)
          returning id, facility_id, version, true as created
        ), selected as (
          select id, facility_id, version, created from inserted
          union all
          select id, facility_id, version, created from existing
          limit 1
        ), marked as (
          update v2_facilities f
          set trust_state = 'verification_draft', updated_at = now()
          from selected
          where f.id = selected.facility_id
            and selected.created
          returning f.id
        )
        select selected.id as request_id, selected.facility_id, selected.version, selected.created,
          coalesce((select state from v2_verification_requests where id = selected.id), 'draft') as state
        from selected
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The facility is unavailable for a claim or already claimed by another account.');
      return { requestId: String(row.request_id), facilityId: String(row.facility_id), state: (row.state ? String(row.state) : 'draft') as ClaimDraftResult['state'], version: Number(row.version), created: row.created === true };
    },

    async cancelClaim(input: { authUserId: string; requestId: string; version: number; correlationId: string }): Promise<{ requestId: string; facilityId: string; state: 'cancelled'; version: number }> {
      if (!Number.isInteger(input.version) || input.version < 1) throw new FieldPilotPolicyError('The claim version is invalid.');
      const rows = await retryDatabase(() => sql`
        with claimant as (
          select id from v2_accounts where auth_user_id = ${input.authUserId} and suspended_at is null limit 1
        ), candidate as (
          select vr.id, vr.facility_id, vr.version, f.trust_state, claimant.id as claimant_id
          from v2_verification_requests vr
          join claimant on claimant.id = vr.claimant_account_id
          join v2_facilities f on f.id = vr.facility_id
          where vr.id = ${input.requestId}::uuid
            and vr.version = ${input.version}
            and vr.state in ('draft', 'needs_more_evidence')
          limit 1
        ), request_update as (
          update v2_verification_requests vr
          set state = 'cancelled', version = vr.version + 1, updated_at = now()
          from candidate
          where vr.id = candidate.id
          returning vr.id, vr.facility_id, vr.version
        ), facility_update as (
          update v2_facilities f
          set trust_state = 'unclaimed', updated_at = now()
          from candidate join request_update on request_update.facility_id = candidate.facility_id
          where f.id = candidate.facility_id and f.account_id is null and f.source_kind = 'public_import'
          returning f.id
        ), history_insert as (
          insert into v2_facility_status_history (facility_id, prior_state, next_state, actor_account_id, reason, request_id, correlation_id)
          select candidate.facility_id, candidate.trust_state, 'unclaimed', candidate.claimant_id, 'claim_cancelled', candidate.id, ${input.correlationId}
          from candidate join request_update on request_update.facility_id = candidate.facility_id
          where exists (select 1 from facility_update)
          returning request_id
        )
        select request_update.id as request_id, request_update.facility_id, request_update.version
        from request_update join history_insert on history_insert.request_id = request_update.id
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The claim cannot be cancelled from this account or version.');
      return { requestId: String(row.request_id), facilityId: String(row.facility_id), state: 'cancelled', version: Number(row.version) };
    },

    async submitClaimEvidence(input: ClaimSubmitInput): Promise<ClaimSubmitResult> {
      const allowedKinds = new Set(['identity', 'company', 'facility', 'product', 'service', 'location']);
      if (!Number.isInteger(input.version) || input.version < 1 || !Array.isArray(input.evidence) || input.evidence.length < 1 || input.evidence.length > 12 || input.evidence.some((item) => !allowedKinds.has(item.evidenceKind) || typeof item.objectKey !== 'string' || !item.objectKey.startsWith('private://omni/') || item.objectKey.length > 512 || /(?:https?:|data:|\s)/i.test(item.objectKey) || (item.checksum !== null && item.checksum !== undefined && (typeof item.checksum !== 'string' || item.checksum.length > 128)))) {
        throw new FieldPilotPolicyError('Provide one to twelve typed private evidence references; raw files and public URLs are not accepted.');
      }
      if (!hasPrivateBlobConfiguration()) throw new EvidenceStoragePolicyError('Private evidence storage is not configured; the claim remains a resumable draft.');
      const candidateRows = await retryDatabase(() => sql`
        select vr.id
        from v2_verification_requests vr
        join v2_accounts a on a.id = vr.claimant_account_id
        join v2_facilities f on f.id = vr.facility_id
        where vr.id = ${input.requestId}::uuid
          and a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and vr.version = ${input.version}
          and vr.state in ('draft', 'needs_more_evidence')
          and f.account_id is null
        limit 1
      `);
      if (!(candidateRows as Record<string, unknown>[])[0]) throw new FieldPilotPolicyError('The claim cannot be submitted from this account or version.');
      const verifiedEvidence = await verifyPrivateEvidenceObjects(input.requestId, input.evidence);
      const evidenceJson = JSON.stringify(verifiedEvidence.map((item) => ({ evidence_kind: item.evidenceKind, object_key: item.objectKey, checksum: item.checksum ?? null })));
      const rows = await retryDatabase(() => sql`
        with claimant as (
          select id from v2_accounts where auth_user_id = ${input.authUserId} and suspended_at is null limit 1
        ), candidate as (
          select vr.id, vr.facility_id, vr.claimant_account_id, vr.version, f.trust_state
          from v2_verification_requests vr
          join claimant on claimant.id = vr.claimant_account_id
          join v2_facilities f on f.id = vr.facility_id
          where vr.id = ${input.requestId}::uuid
            and vr.version = ${input.version}
            and vr.state in ('draft', 'needs_more_evidence')
            and f.account_id is null
          limit 1
        ), evidence_insert as (
          insert into v2_verification_evidence (request_id, evidence_kind, object_key, checksum, visibility)
          select candidate.id, item.evidence_kind, item.object_key, item.checksum, 'private'
          from candidate cross join jsonb_to_recordset(${evidenceJson}::jsonb) as item(evidence_kind text, object_key text, checksum text)
          returning id, request_id
        ), request_update as (
          update v2_verification_requests vr
          set state = 'submitted', version = vr.version + 1, submitted_at = now(), updated_at = now()
          from candidate
          where vr.id = candidate.id and exists (select 1 from evidence_insert)
          returning vr.id, vr.facility_id, vr.version
        ), facility_update as (
          update v2_facilities f
          set trust_state = 'verification_submitted', updated_at = now()
          from candidate join request_update on request_update.facility_id = candidate.facility_id
          where f.id = candidate.facility_id
          returning f.id
        ), history_insert as (
          insert into v2_facility_status_history (facility_id, prior_state, next_state, actor_account_id, reason, request_id, correlation_id)
          select candidate.facility_id, candidate.trust_state, 'verification_submitted', candidate.claimant_account_id, 'claim_submitted', candidate.id, ${input.correlationId}
          from candidate join request_update on request_update.facility_id = candidate.facility_id
          where exists (select 1 from facility_update)
          returning request_id
        ), reviewer_events as (
          insert into v2_notification_events (recipient_account_id, event_type, entity_type, entity_id, dedupe_key, payload, correlation_id)
          select ar.account_id, 'claim_submitted', 'verification_request', request_update.id::text, request_update.id::text || ':submitted:' || request_update.version::text, jsonb_build_object('state', 'submitted'), ${input.correlationId}
          from request_update cross join v2_account_roles ar
          where ar.role = 'reviewer' and ar.status = 'active'
          on conflict (recipient_account_id, dedupe_key) do nothing
          returning id
        ), reviewer_deliveries as (
          insert into v2_notification_deliveries (event_id, channel, state)
          select id, 'in_app', 'queued' from reviewer_events
          on conflict (event_id, channel) do nothing
          returning id
        )
        select request_update.id as request_id, request_update.facility_id, request_update.version, (select count(*) from evidence_insert)::int as evidence_count
        from request_update join facility_update on facility_update.id = request_update.facility_id join history_insert on history_insert.request_id = request_update.id
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The claim cannot be submitted from this account or version.');
      return { requestId: String(row.request_id), facilityId: String(row.facility_id), state: 'submitted', facilityTrust: 'verification_submitted', version: Number(row.version), evidenceCount: Number(row.evidence_count), created: true };
    },

    async listReviewQueue(input: { authUserId: string }): Promise<{ authorized: boolean; requests: ReviewQueueItem[] }> {
      const authorizationRows = await retryDatabase(() => sql`
        select a.id
        from v2_accounts a
        join v2_account_roles ar on ar.account_id = a.id and ar.role = 'reviewer' and ar.status = 'active'
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        limit 1
      `);
      if (!(authorizationRows as Record<string, unknown>[])[0]) return { authorized: false, requests: [] };
      const rows = await retryDatabase(() => sql`
        select vr.id as request_id, vr.facility_id, f.name as facility_name, f.trust_state, vr.state, vr.version, vr.created_at, vr.submitted_at,
          count(ve.id)::int as evidence_count, coalesce(array_agg(distinct ve.evidence_kind) filter (where ve.id is not null), '{}'::text[]) as evidence_kinds
        from v2_verification_requests vr
        join v2_facilities f on f.id = vr.facility_id
        left join v2_verification_evidence ve on ve.request_id = vr.id and ve.visibility in ('private', 'admin_only')
        where vr.state in ('submitted', 'admin_review')
        group by vr.id, f.id
        order by vr.submitted_at nulls last, vr.created_at asc, vr.id asc
        limit 100
      `);
      return { authorized: true, requests: (rows as Record<string, unknown>[]).map((row) => ({ requestId: String(row.request_id), facilityId: String(row.facility_id), facilityName: String(row.facility_name), facilityTrust: String(row.trust_state), state: String(row.state), version: Number(row.version), createdAt: new Date(String(row.created_at)).toISOString(), submittedAt: row.submitted_at === null ? null : new Date(String(row.submitted_at)).toISOString(), evidenceCount: Number(row.evidence_count ?? 0), evidenceKinds: Array.isArray(row.evidence_kinds) ? row.evidence_kinds.map(String) : [] })) };
    },

    async reviewFacilityClaim(input: { authUserId: string; requestId: string; outcome: ReviewOutcome; reason: string; correlationId: string }): Promise<ReviewClaimResult> {
      if (!['certified', 'rejected', 'needs_more_evidence'].includes(input.outcome) || input.reason.trim().length < 3 || input.reason.trim().length > 1000) {
        throw new FieldPilotPolicyError('A review outcome and a bounded reason are required.');
      }
      const rows = await retryDatabase(() => sql`
        with reviewer as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'reviewer' and ar.status = 'active'
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          limit 1
        ), candidate as (
          select vr.id, vr.facility_id, vr.claimant_account_id, vr.version, f.trust_state as facility_trust
          from v2_verification_requests vr
          join v2_facilities f on f.id = vr.facility_id
          cross join reviewer
          where vr.id = ${input.requestId}::uuid
            and vr.state in ('submitted', 'admin_review')
            and exists (select 1 from v2_verification_evidence ve where ve.request_id = vr.id and ve.visibility in ('private', 'admin_only'))
            and vr.claimant_account_id <> reviewer.id
          limit 1
        ), review_insert as (
          insert into v2_verification_reviews (request_id, admin_account_id, outcome, reason)
          select candidate.id, reviewer.id, ${input.outcome}, ${input.reason.trim()}
          from candidate cross join reviewer
          returning request_id
        ), request_update as (
          update v2_verification_requests vr
          set state = ${input.outcome}, version = vr.version + 1, updated_at = now()
          from candidate
          join review_insert on review_insert.request_id = candidate.id
          where vr.id = candidate.id
          returning vr.id, vr.facility_id, vr.version
        ), facility_update as (
          update v2_facilities f
          set trust_state = case when ${input.outcome} = 'needs_more_evidence' then 'verification_draft' when ${input.outcome} = 'certified' then 'unconfirmed' else 'rejected' end,
              account_id = case when ${input.outcome} = 'certified' then candidate.claimant_account_id else f.account_id end,
              updated_at = now()
          from candidate join request_update on request_update.facility_id = candidate.facility_id
          where f.id = candidate.facility_id
          returning f.id
        ), history_insert as (
          insert into v2_facility_status_history (facility_id, prior_state, next_state, actor_account_id, reason, request_id, correlation_id)
          select candidate.facility_id, candidate.facility_trust, case when ${input.outcome} = 'needs_more_evidence' then 'verification_draft' when ${input.outcome} = 'certified' then 'unconfirmed' else 'rejected' end, reviewer.id, ${input.reason.trim()}, candidate.id, ${input.correlationId}
          from candidate cross join reviewer join request_update on request_update.facility_id = candidate.facility_id
          where exists (select 1 from facility_update)
          returning id, facility_id
        ), notification_insert as (
          insert into v2_notification_events (recipient_account_id, event_type, entity_type, entity_id, dedupe_key, payload, correlation_id)
          select candidate.claimant_account_id, 'claim_reviewed', 'verification_request', request_update.id::text, request_update.id::text || ':' || request_update.version::text || ':' || ${input.outcome}, jsonb_build_object('outcome', ${input.outcome}), ${input.correlationId}
          from candidate join request_update on request_update.id = candidate.id
          on conflict (recipient_account_id, dedupe_key) do nothing
          returning id
        ), delivery_insert as (
          insert into v2_notification_deliveries (event_id, channel, state)
          select id, 'in_app', 'queued' from notification_insert
          on conflict (event_id, channel) do nothing
          returning id
        )
        select request_update.id as request_id, request_update.facility_id, ${input.outcome} as outcome, request_update.version,
          case when ${input.outcome} = 'needs_more_evidence' then 'verification_draft' when ${input.outcome} = 'certified' then 'unconfirmed' else 'rejected' end as facility_trust
        from request_update join facility_update on facility_update.id = request_update.facility_id join history_insert on history_insert.facility_id = request_update.facility_id
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The claim is not reviewable by this reviewer or is no longer pending.');
      const facilityTrust = row.facility_trust ? String(row.facility_trust) : input.outcome === 'certified' ? 'unconfirmed' : input.outcome === 'needs_more_evidence' ? 'verification_draft' : 'rejected';
      return { requestId: String(row.request_id), facilityId: String(row.facility_id), outcome: input.outcome, state: input.outcome, facilityTrust: facilityTrust as ReviewClaimResult['facilityTrust'], version: Number(row.version) };
    },

    async listSellerActivationQueue(input: { authUserId: string }): Promise<{ candidates: SellerActivationCandidate[] }> {
      const rows = await retryDatabase(() => sql`
        with reviewer as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'reviewer' and ar.status = 'active'
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        )
        select candidate.id as account_id, candidate.auth_user_id, candidate.onboarding_state,
          count(distinct f.id)::int as facility_count, candidate.created_at, candidate.suspended_at
        from reviewer
        join v2_accounts candidate on true
        join v2_facilities f on f.account_id = candidate.id and f.trust_state in ('unconfirmed', 'confirmed', 'certified')
        group by candidate.id, candidate.auth_user_id, candidate.onboarding_state, candidate.created_at, candidate.suspended_at
        order by candidate.suspended_at nulls first, candidate.created_at asc
        limit 100
      `);
      const reviewerRows = await retryDatabase(() => sql`select 1 from v2_accounts a join v2_account_roles ar on ar.account_id = a.id and ar.role = 'reviewer' and ar.status = 'active' where a.auth_user_id = ${input.authUserId} and a.suspended_at is null limit 1`);
      if (!(rows as Record<string, unknown>[]).length && !(reviewerRows as Record<string, unknown>[]).length) {
        throw new FieldPilotPolicyError('The account is not authorized to review seller activation.');
      }
      return { candidates: (rows as Record<string, unknown>[]).map((row) => ({ accountId: String(row.account_id), authUserId: String(row.auth_user_id), onboardingState: String(row.onboarding_state), facilityCount: Number(row.facility_count), createdAt: new Date(String(row.created_at)).toISOString(), suspended: row.suspended_at !== null })) };
    },
    async activateSellerAccount(input: { authUserId: string; accountId: string; correlationId: string }): Promise<SellerActivationResult> {
      const rows = await retryDatabase(() => sql`
        with reviewer as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'reviewer' and ar.status = 'active'
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ), candidate as (
          select a.id, a.auth_user_id, a.onboarding_state, reviewer.id as reviewer_id
          from v2_accounts a
          cross join reviewer
          where a.id = ${input.accountId}::uuid
            and a.suspended_at is null
            and a.onboarding_state <> 'seller_ready'
            and exists (select 1 from v2_facilities f where f.account_id = a.id and f.trust_state in ('unconfirmed', 'confirmed', 'certified'))
        ), updated as (
          update v2_accounts a
          set onboarding_state = 'seller_ready', updated_at = now()
          from candidate
          where a.id = candidate.id
          returning a.id, a.auth_user_id, candidate.reviewer_id
        ), audit as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
          select reviewer_id, 'seller_account_activated', 'account', id::text, ${input.correlationId}, 'Seller activation approved separately after facility certification.'
          from updated
          returning entity_id
        ), notification_insert as (
          insert into v2_notification_events (recipient_account_id, event_type, entity_type, entity_id, dedupe_key, payload, correlation_id)
          select updated.id, 'seller_account_activated', 'account', updated.id::text, updated.id::text || ':seller_ready', jsonb_build_object('onboardingState', 'seller_ready'), ${input.correlationId}
          from updated join audit on audit.entity_id = updated.id::text
          on conflict (recipient_account_id, dedupe_key) do nothing
          returning id
        )
        select updated.id from updated
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The account is not eligible for separate seller activation.');
      return { accountId: String(row.id), onboardingState: 'seller_ready', activated: true };
    },
    async setSellerAccountSuspension(input: { authUserId: string; accountId: string; suspended: boolean; reason: string; correlationId: string }): Promise<SellerAccountSuspensionResult> {
      const rows = await retryDatabase(() => sql`
        with reviewer as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'reviewer' and ar.status = 'active'
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ), candidate as (
          select a.id, a.suspended_at, reviewer.id as reviewer_id
          from v2_accounts a cross join reviewer
          where a.id = ${input.accountId}::uuid
            and (a.suspended_at is null) is distinct from ${input.suspended}
        ), updated as (
          update v2_accounts a
          set suspended_at = case when ${input.suspended} then now() else null end, updated_at = now()
          from candidate
          where a.id = candidate.id
          returning a.id, candidate.reviewer_id
        ), audit as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
          select reviewer_id, case when ${input.suspended} then 'seller_account_suspended' else 'seller_account_reactivated' end, 'account', id::text, ${input.correlationId}, ${input.reason.trim()}
          from updated
          returning entity_id
        ), notification_insert as (
          insert into v2_notification_events (recipient_account_id, event_type, entity_type, entity_id, dedupe_key, payload, correlation_id)
          select updated.id, case when ${input.suspended} then 'seller_account_suspended' else 'seller_account_reactivated' end, 'account', updated.id::text, updated.id::text || case when ${input.suspended} then ':suspended' else ':reactivated' end || ':' || ${input.correlationId}, jsonb_build_object('suspended', ${input.suspended}), ${input.correlationId}
          from updated join audit on audit.entity_id = updated.id::text
          on conflict (recipient_account_id, dedupe_key) do nothing
          returning id
        )
        select updated.id from updated
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The account is not eligible for this suspension change.');
      return { accountId: String(row.id), suspended: input.suspended };
    },
    async listNotificationInbox(input: { authUserId: string }): Promise<{ notifications: NotificationSummary[] }> {
      const rows = await retryDatabase(() => sql`
        select e.id, e.event_type, e.entity_type, e.entity_id, e.state, e.created_at, e.seen_at
        from v2_notification_events e
        join v2_accounts a on a.id = e.recipient_account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        order by e.created_at desc, e.id desc
        limit 100
      `);
      return { notifications: (rows as Record<string, unknown>[]).map((row) => ({ id: String(row.id), eventType: String(row.event_type), entityType: String(row.entity_type), entityId: String(row.entity_id), state: String(row.state), createdAt: new Date(String(row.created_at)).toISOString(), seenAt: row.seen_at === null ? null : new Date(String(row.seen_at)).toISOString() })) };
    },

    async markNotificationSeen(input: { authUserId: string; notificationId: string }): Promise<{ notificationId: string; seen: true }> {
      const rows = await retryDatabase(() => sql`
        update v2_notification_events e
        set seen_at = coalesce(e.seen_at, now()), state = case when e.state = 'queued' then 'delivered' else e.state end
        from v2_accounts a
        where e.id = ${input.notificationId}::uuid
          and a.id = e.recipient_account_id
          and a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        returning e.id
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The notification is not available to this account.');
      return { notificationId: String(row.id), seen: true };
    },

    async upsertWebPushSubscription(input: WebPushSubscriptionInput): Promise<WebPushSubscriptionResult> {
      if (!/^https:\/\//.test(input.endpoint) || input.endpoint.length > 2048 || !input.p256dh.trim() || !input.auth.trim() || (input.userAgent?.length ?? 0) > 512) {
        throw new FieldPilotPolicyError('The Web Push subscription payload is invalid.');
      }
      const rows = await retryDatabase(() => sql`
        with account as (
          select a.id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ), upserted as (
          insert into v2_web_push_subscriptions (account_id, endpoint, p256dh, auth, user_agent, permission_state, revoked_at, last_seen_at)
          select id, ${input.endpoint}, ${input.p256dh.trim()}, ${input.auth.trim()}, ${input.userAgent?.trim() || null}, 'granted', null, now()
          from account
          on conflict (account_id, endpoint) do update set
            p256dh = excluded.p256dh,
            auth = excluded.auth,
            user_agent = excluded.user_agent,
            permission_state = 'granted',
            revoked_at = null,
            last_seen_at = now()
          returning id, (xmax = 0) as created
        )
        select id, created from upserted
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The subscription account is not available.');
      return { subscriptionId: String(row.id), state: 'granted', created: row.created === true };
    },
    async revokeWebPushSubscription(input: { authUserId: string; endpoint: string }): Promise<WebPushSubscriptionRevokeResult> {
      if (!/^https:\/\//.test(input.endpoint) || input.endpoint.length > 2048) throw new FieldPilotPolicyError('The Web Push endpoint is invalid.');
      const rows = await retryDatabase(() => sql`
        update v2_web_push_subscriptions s
        set permission_state = 'revoked', revoked_at = coalesce(revoked_at, now()), last_seen_at = now()
        from v2_accounts a
        where s.account_id = a.id
          and a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and s.endpoint = ${input.endpoint}
          and s.permission_state = 'granted'
        returning s.endpoint
      `);
      if (!(rows as Record<string, unknown>[])[0]) throw new FieldPilotPolicyError('The subscription is not available to this account.');
      return { revoked: true, endpoint: input.endpoint };
    },
    async listWebPushSubscriptionStatus(input: { authUserId: string }): Promise<{ active: number }> {
      const rows = await retryDatabase(() => sql`
        select count(*)::int as active
        from v2_web_push_subscriptions s
        join v2_accounts a on a.id = s.account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and s.permission_state = 'granted'
          and s.revoked_at is null
      `);
      return { active: Number((rows as Record<string, unknown>[])[0]?.active ?? 0) };
    },
    async listPublicFacilities(bounds?: [number, number, number, number], query?: string, category?: string): Promise<PublicFacility[]> {
      return retryDatabase(async () => {
        const [west, south, east, north] = bounds ?? [-180, -90, 180, 90];
        const queryText = query?.trim() ?? '';
        const categoryText = category?.trim() ?? '';
        const rows = await sql`
          select
            f.id, f.name, f.category, f.address, f.latitude, f.longitude,
            f.trust_state, f.commercial_plan,
            count(p.id)::int as product_count
          from v2_facilities f
          left join v2_products p
            on p.facility_id = f.id and p.publication_state = 'published'
          where f.longitude between ${west} and ${east}
            and f.latitude between ${south} and ${north}
            and (${queryText} = ''
              or f.name ilike '%' || ${queryText} || '%'
              or coalesce(f.category, '') ilike '%' || ${queryText} || '%'
              or exists (
                select 1 from v2_products matched
                where matched.facility_id = f.id
                  and matched.publication_state = 'published'
                  and (matched.name ilike '%' || ${queryText} || '%' or coalesce(matched.category, '') ilike '%' || ${queryText} || '%')
              ))
            and (${categoryText} = '' or coalesce(f.category, '') = ${categoryText})
          group by f.id
          order by f.trust_state = 'unclaimed', f.name
          limit 250
        `;
        return (rows as Record<string, unknown>[]).map(toFacility);
      });
    },

    async getFacilityDetail(id: string): Promise<FacilityDetail | null> {
      const facilities = await retryDatabase(() => sql`
        select
          f.id, f.name, f.category, f.address, f.latitude, f.longitude,
          f.trust_state, f.commercial_plan,
          count(p.id)::int as product_count
        from v2_facilities f
        left join v2_products p
          on p.facility_id = f.id and p.publication_state = 'published'
        where f.id = ${id}::uuid
        group by f.id
        limit 1
      `);
      const row = (facilities as Record<string, unknown>[])[0];
      if (!row) return null;
      const products = await retryDatabase(() => sql`
        select p.id, p.facility_id, p.name, p.description, p.category, p.unit,
               p.price_minor, p.currency,
               null::text as coupon_label
        from v2_products p
        join v2_facilities f on f.id = p.facility_id
        where p.facility_id = ${id}::uuid
          and p.publication_state = 'published'
          and f.trust_state in ('certified', 'unconfirmed', 'confirmed')
        order by p.name
      `);
      return { ...toFacility(row), products: (products as Record<string, unknown>[]).map(toProduct) };
    },

    async rebindDemoSeller(input: { authUserId: string }): Promise<{ authorized: true }> {
      const rows = await retryDatabase(() => sql`
        select
          a.id,
          a.auth_user_id,
          exists (
            select 1 from v2_accounts existing
            where existing.auth_user_id = ${input.authUserId}
              and existing.id <> a.id
          ) as conflicting_auth_binding,
          exists (
            select 1 from v2_facilities f
            where f.id = '20000000-0000-0000-0000-000000000101'::uuid
              and f.account_id = a.id
              and f.name = 'Omni Demo Seller Hub'
              and f.source_ref = 'D-V2-DEMO-FACILITY'
          ) as labeled_demo_facility
        from v2_accounts a
        where a.id = '10000000-0000-0000-0000-000000000101'::uuid
          and a.onboarding_state in ('seller_ready', 'complete')
          and a.suspended_at is null
        limit 1
      `);
      const target = (rows as Record<string, unknown>[])[0];
      if (!target || target.labeled_demo_facility !== true) {
        throw new SellerAuthorizationPolicyError('The labeled Seller demonstration fixture is unavailable.');
      }
      if (target.conflicting_auth_binding === true) {
        throw new SellerAuthorizationPolicyError('This Auth identity is already bound to another Omni account.');
      }
      if (String(target.auth_user_id) === input.authUserId) return { authorized: true };
      const updated = await retryDatabase(() => sql`
        with rebound as (
          update v2_accounts a
          set auth_user_id = ${input.authUserId}
          where a.id = '10000000-0000-0000-0000-000000000101'::uuid
            and a.auth_user_id is distinct from ${input.authUserId}
            and a.onboarding_state in ('seller_ready', 'complete')
            and a.suspended_at is null
            and not exists (
              select 1 from v2_accounts existing
              where existing.auth_user_id = ${input.authUserId}
                and existing.id <> a.id
            )
            and exists (
              select 1 from v2_facilities f
              where f.id = '20000000-0000-0000-0000-000000000101'::uuid
                and f.account_id = a.id
                and f.name = 'Omni Demo Seller Hub'
                and f.source_ref = 'D-V2-DEMO-FACILITY'
            )
          returning a.id
        ), audit as (
          insert into v2_audit_events
            (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select id, 'seller_demo_rebound', 'account', id::text, 'bounded-demo-seller-rebind', 'official-auth-session', now()
          from rebound
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        )
        select id from rebound
      `);
      if (!(updated as Record<string, unknown>[])[0]) {
        throw new SellerAuthorizationPolicyError('The Seller demonstration fixture could not be safely rebound.');
      }
      return { authorized: true };
    },

    async listSellerCatalogue(input: { authUserId: string }): Promise<{ authorized: boolean; products: SellerCatalogueProduct[] }> {
      const authorizationRows = await retryDatabase(() => sql`
        select a.id
        from v2_accounts a
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and a.onboarding_state = 'seller_ready'
        limit 1
      `);
      if (!(authorizationRows as Record<string, unknown>[])[0]) return { authorized: false, products: [] };
      const rows = await retryDatabase(() => sql`
        select
          p.id,
          p.facility_id,
          f.name as facility_name,
          p.name,
          p.description,
          p.unit,
          p.price_minor,
          p.currency,
          p.discount_kind,
          p.discount_value_minor,
          case
            when p.discount_kind = 'percentage' and p.discount_value_minor between 1 and 90
              then p.price_minor - floor((p.price_minor * p.discount_value_minor) / 100.0)
            when p.discount_kind = 'fixed' and p.discount_value_minor > 0 and p.discount_value_minor < p.price_minor
              then p.price_minor - p.discount_value_minor
            else null
          end as net_price_minor,
          p.publication_state
        from v2_products p
        join v2_facilities f on f.id = p.facility_id
        join v2_accounts a on a.id = f.account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and a.onboarding_state = 'seller_ready'
        order by f.name asc, p.updated_at desc, p.id desc
      `);
      const products = (rows as Record<string, unknown>[]).map((row) => ({
        id: String(row.id),
        facilityId: String(row.facility_id),
        facilityName: String(row.facility_name),
        name: String(row.name),
        description: row.description === null ? null : String(row.description),
        unit: String(row.unit),
        priceMinor: Number(row.price_minor),
        currency: String(row.currency),
        discountKind: row.discount_kind === null ? null : row.discount_kind as SellerCatalogueProduct['discountKind'],
        discountValueMinor: row.discount_value_minor === null ? null : Number(row.discount_value_minor),
        netPriceMinor: row.net_price_minor === null ? null : Number(row.net_price_minor),
        publicationState: String(row.publication_state) as SellerCatalogueProduct['publicationState'],
      }));
      return { authorized: true, products };
    },

    async createSellerProductDraft(input: {
      authUserId: string;
      facilityId: string;
      name: string;
      description: string | null;
      unit: string;
      priceMinor: number;
      currency: string;
      discountKind: 'percentage' | 'fixed';
      discountValueMinor: number;
      idempotencyKey: string;
    }): Promise<{ productId: string; facilityId: string; publicationState: 'draft'; netPriceMinor: number }> {
      if (!input.name.trim() || input.name.trim().length > 180 || !Number.isInteger(input.priceMinor) || input.priceMinor <= 0 || !Number.isInteger(input.discountValueMinor) || input.discountValueMinor <= 0) {
        throw new SellerCataloguePolicyError('INVALID_INPUT');
      }
      if (input.discountKind === 'percentage' && input.discountValueMinor > 90) throw new SellerCataloguePolicyError('DISCOUNT_TOO_LARGE');
      if (input.discountKind === 'fixed' && input.discountValueMinor >= input.priceMinor) throw new SellerCataloguePolicyError('DISCOUNT_TOO_LARGE');
      const rows = await retryDatabase(() => sql`
        with seller as (
          select a.id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and a.onboarding_state = 'seller_ready'
        ), owned_facility as (
          select f.id, f.commercial_plan
          from v2_facilities f
          join seller s on s.id = f.account_id
          where f.id = ${input.facilityId}::uuid
        ), slot_check as (
          select 1
          from v2_facility_slots fs
          join seller s on s.id = fs.account_id
          where fs.facility_id = ${input.facilityId}::uuid
            and fs.status = 'assigned'
        ), inserted as (
          insert into v2_products
            (facility_id, name, description, unit, price_minor, currency, discount_kind, discount_value_minor, idempotency_key, publication_state)
          select of.id, ${input.name.trim()}, ${input.description?.trim() || null}, ${input.unit.trim() || 'unit'}, ${input.priceMinor}, ${input.currency.toUpperCase()}, ${input.discountKind}, ${input.discountValueMinor}, ${input.idempotencyKey}, 'draft'
          from owned_facility of
          where exists (select 1 from slot_check)
          on conflict (facility_id, idempotency_key) do nothing
          returning id, facility_id, name, publication_state, price_minor, discount_kind, discount_value_minor
        )
        select * from inserted
        union all
        select p.id, p.facility_id, p.name, p.publication_state, p.price_minor, p.discount_kind, p.discount_value_minor
        from v2_products p
        where p.facility_id = ${input.facilityId}::uuid and p.idempotency_key = ${input.idempotencyKey}
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new SellerCataloguePolicyError('FORBIDDEN_OR_SLOT_REQUIRED');
      if (String(row.discount_kind) !== input.discountKind || Number(row.discount_value_minor) !== input.discountValueMinor || String(row.name ?? input.name) !== input.name.trim()) throw new SellerCataloguePolicyError('IDEMPOTENCY_CONFLICT');
      const discount = input.discountKind === 'percentage' ? Math.floor(input.priceMinor * input.discountValueMinor / 100) : input.discountValueMinor;
      return { productId: String(row.id), facilityId: String(row.facility_id), publicationState: 'draft', netPriceMinor: input.priceMinor - discount };
    },

    async getSellerAvailabilityQueue(input: { authUserId: string }): Promise<{ authorized: boolean; requests: Array<{
      id: string;
      facilityId: string;
      facilityName: string;
      facilityCategory: string;
      productId: string;
      productName: string;
      requestedQuantity: number;
      budgetMode: 'unlimited' | 'maximum';
      budgetMinor: number | null;
      requestStatus: AvailabilityResponsesResult['requestStatus'];
      createdAt: string;
      expiresAt: string;
      responseStatus: AvailabilityResponseStatus | null;
      responseObservedAt: string | null;
      freshness: 'fresh' | 'stale' | 'expired';
    }> }> {
      const sellerRows = await retryDatabase(() => sql`
        select a.id
        from v2_accounts a
        where a.auth_user_id = ${input.authUserId}
          and a.onboarding_state in ('seller_ready', 'complete')
          and a.suspended_at is null
        limit 1
      `);
      const seller = (sellerRows as Record<string, unknown>[])[0];
      if (!seller) return { authorized: false, requests: [] };
      const sellerAccountId = String(seller.id);
      const rows = await retryDatabase(() => sql`
        select
          r.id,
          f.id as facility_id,
          f.name as facility_name,
          f.category as facility_category,
          f.trust_state as facility_trust,
          f.commercial_plan as facility_plan,
          p.id as product_id,
          p.name as product_name,
          r.requested_quantity,
          r.budget_mode,
          r.budget_minor,
          r.status as request_status,
          r.created_at,
          r.expires_at,
          ar.status as response_status,
          ar.observed_at as response_observed_at,
          case
            when r.expires_at <= now() then 'expired'
            when ar.id is null then 'fresh'
            when ar.observed_at < now() - interval '10 minutes' then 'stale'
            else 'fresh'
          end as freshness
        from v2_availability_requests r
        join v2_facilities f on f.id = any(r.facility_scope) and f.account_id = ${sellerAccountId}::uuid
        join v2_products p on p.id = r.product_id and p.facility_id = f.id and p.publication_state = 'published'
        left join v2_availability_responses ar
          on ar.request_id = r.id
         and ar.facility_id = f.id
         and ar.responder_account_id = ${sellerAccountId}::uuid
        where r.expires_at > now() or ar.id is not null
        order by r.created_at desc, r.id desc
        limit 100
      `);
      return {
        authorized: true,
        requests: (rows as Record<string, unknown>[]).map((row) => ({
          id: String(row.id),
          facilityId: String(row.facility_id),
          facilityName: String(row.facility_name),
          facilityCategory: String(row.facility_category ?? 'Local supply'),
          facilityTrust: row.facility_trust as PublicFacility['trust'],
          facilityPlan: row.facility_plan as PublicFacility['plan'],
          productId: String(row.product_id),
          productName: String(row.product_name),
          requestedQuantity: Number(row.requested_quantity),
          budgetMode: row.budget_mode as 'unlimited' | 'maximum',
          budgetMinor: row.budget_minor === null ? null : Number(row.budget_minor),
          requestStatus: row.request_status as AvailabilityResponsesResult['requestStatus'],
          createdAt: new Date(String(row.created_at)).toISOString(),
          expiresAt: new Date(String(row.expires_at)).toISOString(),
          responseStatus: row.response_status === null || row.response_status === undefined ? null : row.response_status as AvailabilityResponseStatus,
          responseObservedAt: row.response_observed_at === null || row.response_observed_at === undefined ? null : new Date(String(row.response_observed_at)).toISOString(),
          freshness: row.freshness as 'fresh' | 'stale' | 'expired',
        })),
      };
    },

    async getBuyerAvailabilityRequests(input: { authUserId: string }): Promise<{ requests: Array<{
      id: string;
      facilityId: string;
      facilityName: string;
      facilityCategory: string;
      productId: string;
      productName: string;
      requestedQuantity: number;
      budgetMode: 'unlimited' | 'maximum';
      budgetMinor: number | null;
      requestStatus: AvailabilityResponsesResult['requestStatus'];
      createdAt: string;
      expiresAt: string;
      responseCount: number;
    }> }> {
      const rows = await retryDatabase(() => sql`
        select
          r.id,
          f.id as facility_id,
          f.name as facility_name,
          f.category as facility_category,
          p.id as product_id,
          p.name as product_name,
          r.requested_quantity,
          r.budget_mode,
          r.budget_minor,
          r.created_at,
          r.expires_at,
          count(ar.id)::int as response_count,
          case
            when r.expires_at <= now() then 'expired'
            when count(ar.id) > 0 then 'responses'
            when r.status = 'responding' then 'responding'
            else 'submitted'
          end as request_status
        from v2_availability_requests r
        join v2_accounts a on a.id = r.buyer_account_id
        join v2_facilities f on f.id = r.facility_scope[1]
        join v2_products p on p.id = r.product_id and p.facility_id = f.id
        left join v2_availability_responses ar on ar.request_id = r.id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        group by r.id, f.id, f.name, f.category, p.id, p.name
        order by r.created_at desc, r.id desc
        limit 50
      `);
      return {
        requests: (rows as Record<string, unknown>[]).map((row) => ({
          id: String(row.id),
          facilityId: String(row.facility_id),
          facilityName: String(row.facility_name),
          facilityCategory: String(row.facility_category ?? 'Local supply'),
          productId: String(row.product_id),
          productName: String(row.product_name),
          requestedQuantity: Number(row.requested_quantity),
          budgetMode: row.budget_mode as 'unlimited' | 'maximum',
          budgetMinor: row.budget_minor === null ? null : Number(row.budget_minor),
          requestStatus: row.request_status as AvailabilityResponsesResult['requestStatus'],
          createdAt: new Date(String(row.created_at)).toISOString(),
          expiresAt: new Date(String(row.expires_at)).toISOString(),
          responseCount: Number(row.response_count),
        })),
      };
    },

    async getAvailabilityResponses(input: { authUserId: string; requestId: string }): Promise<AvailabilityResponsesResult> {
      const rows = await retryDatabase(() => sql`
        with buyer_request as (
          select r.id, r.product_id, r.facility_scope[1] as facility_id, r.expires_at, r.status
          from v2_availability_requests r
          join v2_accounts a on a.id = r.buyer_account_id
          where r.id = ${input.requestId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          limit 1
        )
        select
          br.id as request_id,
          br.product_id,
          br.facility_id,
          br.expires_at,
          br.status as request_status,
          ar.id as response_id,
          ar.facility_id as response_facility_id,
          f.name as facility_name,
          f.category as facility_category,
          p.name as product_name,
          ar.status as response_status,
          ar.quantity_available,
          ar.price_minor,
          coalesce(ar.offer_snapshot ->> 'currency', 'USD') as currency,
          ar.seller_message,
          ar.observed_at,
          case
            when ar.id is null then null
            when ar.observed_at >= br.expires_at then 'expired'
            when ar.observed_at < now() - interval '10 minutes' then 'stale'
            else 'fresh'
          end as freshness
        from buyer_request br
        left join v2_availability_responses ar on ar.request_id = br.id
        left join v2_facilities f on f.id = ar.facility_id
        left join v2_products p on p.id = br.product_id
        order by ar.observed_at desc nulls last, ar.id desc nulls last
      `);
      const typedRows = rows as Record<string, unknown>[];
      const first = typedRows[0];
      if (!first) throw new AvailabilityPolicyError('Availability request was not found or is not owned by this account.');
      const expiresAt = new Date(String(first.expires_at)).toISOString();
      const now = Date.now();
      const responses = typedRows
        .filter((row) => row.response_id !== null && row.response_id !== undefined)
        .map((row) => ({
          id: String(row.response_id),
          requestId: String(row.request_id),
          facilityId: String(row.response_facility_id),
          facilityName: String(row.facility_name ?? 'Facility'),
          facilityCategory: String(row.facility_category ?? 'Local supply'),
          productId: String(row.product_id),
          productName: String(row.product_name ?? 'Catalogue offer'),
          status: String(row.response_status) as BuyerAvailabilityResponseStatus,
          quantityAvailable: row.quantity_available === null ? null : Number(row.quantity_available),
          priceMinor: row.price_minor === null ? null : Number(row.price_minor),
          currency: String(row.currency ?? 'USD'),
          sellerMessage: row.seller_message === null ? null : String(row.seller_message),
          observedAt: new Date(String(row.observed_at)).toISOString(),
          freshness: String(row.freshness) as AvailabilityResponsesResult['responses'][number]['freshness'],
        }));
      const requestStatus: AvailabilityResponsesResult['requestStatus'] = responses.length > 0
        ? 'responses'
        : new Date(expiresAt).getTime() <= now
          ? 'expired'
          : String(first.request_status) === 'responding'
            ? 'responding'
            : 'submitted';
      return {
        requestId: String(first.request_id),
        productId: String(first.product_id),
        facilityId: String(first.facility_id),
        requestStatus,
        expiresAt,
        responses,
      };
    },

    async confirmExternalPayment(input: {
      authUserId: string;
      transactionId: string;
      correlationId: string;
      now: string;
    }): Promise<ExternalPaymentConfirmationPersistenceResult> {
      const rows = await retryDatabase(() => sql`
        with actor as (
          select a.id as actor_account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ),
        locked as (
          select s.transaction_id, m.account_id as seller_account_id, a.actor_account_id,
            coalesce((
              select e.state
              from v2_transaction_events e
              where e.transaction_id = s.transaction_id
              order by e.created_at desc, e.id desc
              limit 1
            ), 'intent_created') as current_state
          from v2_transaction_snapshots s
          join v2_transaction_members m on m.transaction_id = s.transaction_id
          join actor a on a.actor_account_id = m.account_id
          where s.transaction_id = ${input.transactionId}::uuid
            and m.role = 'seller'
          for update of s
        ),
        eligible as (
          select l.transaction_id, l.seller_account_id, l.actor_account_id, d.id as declaration_id, d.buyer_account_id
          from locked l
          join v2_external_payment_declarations d on d.transaction_id = l.transaction_id
          where l.current_state = 'payment_declared'
            and d.seller_acknowledged_at is null
        ),
        acknowledged as (
          update v2_external_payment_declarations d
          set seller_acknowledged_at = ${input.now}::timestamptz
          from eligible e
          where d.id = e.declaration_id
          returning d.id as declaration_id, d.transaction_id, d.buyer_account_id
        ),
        event as (
          insert into v2_transaction_events
            (transaction_id, actor_account_id, state, metadata, created_at)
          select a.transaction_id, e.actor_account_id, 'payment_confirmed', '{}'::jsonb, ${input.now}::timestamptz
          from acknowledged a
          join eligible e on e.transaction_id = a.transaction_id
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        ),
        audit as (
          insert into v2_audit_events
            (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select e.actor_account_id, 'external_payment_confirmed', 'transaction', a.transaction_id::text, ${input.correlationId}, 'seller_acknowledged', ${input.now}::timestamptz
          from acknowledged a
          join eligible e on e.transaction_id = a.transaction_id
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        ),
        replayed as (
          select d.id as declaration_id, l.transaction_id, d.buyer_account_id, l.seller_account_id
          from locked l
          join v2_external_payment_declarations d on d.transaction_id = l.transaction_id
          where l.current_state = 'payment_confirmed'
            and d.seller_acknowledged_at is not null
        )
        select a.declaration_id, a.transaction_id, a.buyer_account_id, e.seller_account_id
        from acknowledged a
        join eligible e on e.transaction_id = a.transaction_id
        union all
        select declaration_id, transaction_id, buyer_account_id, seller_account_id from replayed
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new TransactionPolicyError('Payment confirmation requires a seller member and a buyer declaration in payment-declared state.');
      return {
        declarationId: String(row.declaration_id),
        transactionId: String(row.transaction_id),
        buyerAccountId: String(row.buyer_account_id),
        sellerAccountId: String(row.seller_account_id),
        state: 'payment_confirmed',
      };
    },

    async declareExternalPayment(input: {
      authUserId: string;
      transactionId: string;
      method: ExternalPaymentMethod;
      correlationId: string;
      now: string;
    }): Promise<ExternalPaymentDeclarationPersistenceResult> {
      if (!['cash', 'mobile_money', 'pay_on_delivery'].includes(input.method)) {
        throw new TransactionPolicyError('External payment method is not supported.');
      }
      const rows = await retryDatabase(() => sql`
        with actor as (
          select a.id as actor_account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ),
        locked as (
          select s.transaction_id, m.account_id as buyer_account_id, a.actor_account_id,
            coalesce((
              select e.state
              from v2_transaction_events e
              where e.transaction_id = s.transaction_id
              order by e.created_at desc, e.id desc
              limit 1
            ), 'intent_created') as current_state
          from v2_transaction_snapshots s
          join v2_transaction_members m on m.transaction_id = s.transaction_id
          join actor a on a.actor_account_id = m.account_id
          where s.transaction_id = ${input.transactionId}::uuid
            and m.role = 'buyer'
          for update of s
        ),
        eligible as (
          select * from locked
          where current_state in ('qr_verified', 'payment_declared')
        ),
        declaration as (
          insert into v2_external_payment_declarations
            (transaction_id, buyer_account_id, method, declared_at)
          select e.transaction_id, e.buyer_account_id, ${input.method}, ${input.now}::timestamptz
          from eligible e
          where e.current_state = 'qr_verified'
          on conflict (transaction_id) do update
            set transaction_id = v2_external_payment_declarations.transaction_id
          returning id, transaction_id, buyer_account_id, method
        ),
        event as (
          insert into v2_transaction_events
            (transaction_id, actor_account_id, state, metadata, created_at)
          select d.transaction_id, e.actor_account_id, 'payment_declared', jsonb_build_object('method', d.method), ${input.now}::timestamptz
          from declaration d
          join eligible e on e.transaction_id = d.transaction_id
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        ),
        audit as (
          insert into v2_audit_events
            (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select e.actor_account_id, 'external_payment_declared', 'transaction', d.transaction_id::text, ${input.correlationId}, d.method, ${input.now}::timestamptz
          from declaration d
          join eligible e on e.transaction_id = d.transaction_id
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        ),
        existing as (
          select d.id, d.transaction_id, d.buyer_account_id, d.method
          from v2_external_payment_declarations d
          join eligible e on e.transaction_id = d.transaction_id
        )
        select id, transaction_id, buyer_account_id, method from declaration
        union all
        select id, transaction_id, buyer_account_id, method from existing
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new TransactionPolicyError('Payment declaration requires a buyer member after QR verification.');
      if (String(row.method) !== input.method) {
        throw new TransactionPolicyError('A different external payment method was already declared for this transaction.');
      }
      return {
        declarationId: String(row.id),
        transactionId: String(row.transaction_id),
        method: row.method as ExternalPaymentMethod,
        buyerAccountId: String(row.buyer_account_id),
      };
    },

    async submitTransactionRating(input: {
      authUserId: string;
      transactionId: string;
      score: number;
      note: string | null;
      correlationId: string;
      now: string;
    }): Promise<TransactionRatingPersistenceResult> {
      const note = input.note?.trim() || null;
      if (!Number.isInteger(input.score) || input.score < 1 || input.score > 5) {
        throw new TransactionPolicyError('A rating score between 1 and 5 is required.');
      }
      if (note && note.length > 500) throw new TransactionPolicyError('The rating note must be 500 characters or fewer.');
      const rows = await retryDatabase(() => sql`
        with actor as (
          select a.id as actor_account_id
          from v2_accounts a
          join v2_transaction_members m on m.account_id = a.id and m.role = 'buyer'
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and m.transaction_id = ${input.transactionId}::uuid
        ), locked as (
          select s.transaction_id, a.actor_account_id,
            coalesce((select e.state from v2_transaction_events e where e.transaction_id = s.transaction_id order by e.created_at desc, e.id desc limit 1), 'intent_created') as current_state
          from v2_transaction_snapshots s
          join actor a on true
          where s.transaction_id = ${input.transactionId}::uuid
          for update of s
        ), eligible as (
          select * from locked where current_state in ('received', 'rated')
        ), inserted_rating as (
          insert into v2_ratings (transaction_id, buyer_account_id, score, note, created_at)
          select e.transaction_id, e.actor_account_id, ${input.score}, ${note}, ${input.now}::timestamptz
          from eligible e
          where e.current_state = 'received'
          on conflict (transaction_id) do nothing
          returning id, transaction_id, score, note
        ), rated_event as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
          select e.transaction_id, e.actor_account_id, 'rated', jsonb_build_object('score', r.score), ${input.now}::timestamptz
          from eligible e
          join v2_ratings r on r.transaction_id = e.transaction_id
          where e.current_state = 'received'
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        ), audited as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select e.actor_account_id, 'transaction_rated', 'transaction', e.transaction_id::text, ${input.correlationId}, 'buyer_submitted_rating', ${input.now}::timestamptz
          from eligible e
          where e.current_state in ('received', 'rated')
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        )
        select r.id, r.transaction_id, r.score, r.note
        from v2_ratings r
        join eligible e on e.transaction_id = r.transaction_id
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new TransactionPolicyError('Rating is available only after the Buyer confirms receipt.');
      return { ratingId: String(row.id), transactionId: String(row.transaction_id), score: Number(row.score), note: row.note === null || row.note === undefined ? null : String(row.note), state: 'rated' };
    },

    async transitionTransaction(input: {
      authUserId: string;
      transactionId: string;
      from: TransactionState;
      to: TransactionState;
      actorRole: 'buyer' | 'seller';
      correlationId: string;
      now: string;
    }): Promise<TransactionTransitionPersistenceResult> {
      const rows = await retryDatabase(() => sql`
        with actor as (
          select a.id as actor_account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ),
        locked as (
          select
            s.transaction_id,
            a.actor_account_id,
            coalesce((
              select e.state
              from v2_transaction_events e
              where e.transaction_id = s.transaction_id
              order by e.created_at desc, e.id desc
              limit 1
            ), 'intent_created') as current_state
          from v2_transaction_snapshots s
          join v2_transaction_members m on m.transaction_id = s.transaction_id
          join actor a on a.actor_account_id = m.account_id
          where s.transaction_id = ${input.transactionId}::uuid
            and m.role = ${input.actorRole}::text
          for update of s
        ),
        eligible as (
          select * from locked
          where current_state = ${input.to}
             or (
               current_state = ${input.from}
               and (
                 (${input.actorRole}::text = 'seller' and current_state = 'qr_ready' and ${input.to}::text = 'qr_verified')
                 or (${input.actorRole}::text = 'buyer' and current_state = 'qr_verified' and ${input.to}::text = 'payment_declared')
                 or (${input.actorRole}::text = 'seller' and current_state = 'payment_declared' and ${input.to}::text = 'payment_confirmed')
                 or (${input.actorRole}::text = 'seller' and current_state = 'payment_confirmed' and ${input.to}::text = 'fulfilment_pending')
                 or (${input.actorRole}::text = 'seller' and current_state = 'fulfilment_pending' and ${input.to}::text = 'fulfilled')
                 or (${input.actorRole}::text = 'buyer' and current_state = 'fulfilled' and ${input.to}::text = 'received')
                 or (${input.actorRole}::text = 'buyer' and current_state = 'received' and ${input.to}::text = 'rated')
               )
             )
        ),
        inserted as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
          select e.transaction_id, e.actor_account_id, ${input.to}::text, jsonb_build_object('from', e.current_state, 'actor_role', ${input.actorRole}::text), ${input.now}::timestamptz
          from eligible e
          where e.current_state <> ${input.to}
          on conflict (transaction_id, state) do nothing
          returning transaction_id, state
        ),
        replayed as (
          select e.transaction_id, e.current_state, e.current_state as event_state, e.actor_account_id
          from eligible e
          where e.current_state = ${input.to}
        ),
        result as (
          select i.transaction_id, ${input.from}::text as current_state, i.state as event_state, e.actor_account_id
          from inserted i
          join eligible e on e.transaction_id = i.transaction_id
          union all
          select transaction_id, current_state, event_state, actor_account_id from replayed
        ),
        audited as (
          insert into v2_audit_events
            (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select r.actor_account_id, 'transaction_state_transition', 'transaction', r.transaction_id::text, ${input.correlationId}, ${input.from}::text || '->' || ${input.to}::text, ${input.now}::timestamptz
          from result r
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        )
        select transaction_id, current_state, event_state, actor_account_id from result
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new TransactionPolicyError('Transaction state is stale, membership is invalid, or the actor transition is not allowed.');
      return {
        accepted: true,
        transactionId: String(row.transaction_id),
        from: input.from,
        to: input.to,
        actorRole: input.actorRole,
      };
    },

    async unlockFacilityBonus(input: {
      authUserId: string;
      facilityId: string;
      now: string;
    }): Promise<FacilityBonusPersistenceResult> {
      const reference = `facility-bonus:${input.facilityId}`;
      const rows = await retryDatabase(() => sql`
        with facility as (
          select f.id as facility_id, f.account_id
          from v2_facilities f
          join v2_accounts a on a.id = f.account_id
          where f.id = ${input.facilityId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and f.trust_state = 'confirmed'
            and f.qualifying_sales >= 3
          for update of f
        ),
        wallet as (
          select w.id as wallet_id
          from v2_wallets w
          join facility f on f.account_id = w.account_id
          for update of w
        ),
        existing as (
          select e.id, e.wallet_id, e.facility_id
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.kind = 'bonus_grant'
            and e.reference = ${reference}
        ),
        unlocked as (
          update v2_facilities f
          set bonus_unlocked_at = ${input.now}::timestamptz,
              updated_at = ${input.now}::timestamptz
          from facility eligible
          where f.id = eligible.facility_id
            and f.bonus_unlocked_at is null
          returning f.id as facility_id
        ),
        grant as (
          insert into v2_wallet_ledger_entries
            (wallet_id, kind, amount_minor, status, reference, facility_id, created_at, confirmed_at)
          select w.wallet_id, 'bonus_grant', 2000, 'confirmed', ${reference}, u.facility_id, ${input.now}::timestamptz, ${input.now}::timestamptz
          from wallet w
          join unlocked u on true
          on conflict (wallet_id, kind, reference) do nothing
          returning id, wallet_id, facility_id
        )
        select id, wallet_id, facility_id from grant
        union all
        select id, wallet_id, facility_id from existing
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new WalletPolicyError('Facility bonus requires confirmed trust, three qualifying sales and an owned wallet.');
      return {
        ledgerEntryId: String(row.id),
        walletId: String(row.wallet_id),
        kind: 'bonus_grant',
        amountMinor: 2000,
        status: 'confirmed',
        facilityId: String(row.facility_id),
      };
    },

    async spendWallet(input: {
      authUserId: string;
      facilityId: string;
      kind: WalletSpendKind;
      amountMinor: number;
      reference: string;
      now: string;
    }): Promise<WalletSpendPersistenceResult> {
      if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0 || !input.reference.trim()) {
        throw new WalletPolicyError('Wallet spend amount and reference are invalid.');
      }
      const rows = await retryDatabase(() => sql`
        with wallet as (
          select w.id as wallet_id, a.id as account_id
          from v2_wallets w
          join v2_accounts a on a.id = w.account_id
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and exists (
              select 1 from v2_facilities f
              where f.id = ${input.facilityId}::uuid
                and f.account_id = a.id
            )
          for update of w
        ),
        existing as (
          select e.id, e.wallet_id, e.kind, e.amount_minor, e.status, e.facility_id
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.kind = ${input.kind}
            and e.reference = ${input.reference}
        ),
        balance as (
          select coalesce(sum(
            case when e.kind in ('recharge', 'bonus_grant', 'reversal', 'coupon_credit')
              then e.amount_minor else -e.amount_minor end
          ), 0)::int as balance_minor
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.status = 'confirmed'
        ),
        inserted as (
          insert into v2_wallet_ledger_entries
            (wallet_id, kind, amount_minor, status, reference, facility_id, created_at, confirmed_at)
          select w.wallet_id, ${input.kind}, ${input.amountMinor}, 'confirmed', ${input.reference}, ${input.facilityId}::uuid, ${input.now}::timestamptz, ${input.now}::timestamptz
          from wallet w
          cross join balance b
          where b.balance_minor >= ${input.amountMinor}
            and not exists (select 1 from existing)
          on conflict (wallet_id, kind, reference) do nothing
          returning id, wallet_id, kind, amount_minor, status, facility_id
        )
        select id, wallet_id, kind, amount_minor, status, facility_id from inserted
        union all
        select id, wallet_id, kind, amount_minor, status, facility_id from existing
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new WalletPolicyError('Wallet is unavailable, facility ownership is invalid, or confirmed funds are insufficient.');
      if (
        String(row.kind) !== input.kind
        || Number(row.amount_minor) !== input.amountMinor
        || String(row.facility_id) !== input.facilityId
      ) {
        throw new WalletPolicyError('The wallet reference is already used for a different spend.');
      }
      return {
        ledgerEntryId: String(row.id),
        walletId: String(row.wallet_id),
        kind: row.kind as WalletSpendKind,
        amountMinor: Number(row.amount_minor),
        status: 'confirmed',
        facilityId: String(row.facility_id),
      };
    },

    async respondAvailability(input: {
      authUserId: string;
      requestId: string;
      facilityId: string;
      productId: string;
      status: AvailabilityResponseStatus;
      quantityAvailable: number | null;
      priceMinor: number | null;
      sellerMessage: string | null;
      idempotencyKey: string;
      correlationId: string;
    }): Promise<AvailabilityResponsePersistenceResult> {
      if (!['available', 'partial', 'unavailable'].includes(input.status)) {
        throw new AvailabilityResponsePolicyError('Choose an allowed availability response status.');
      }
      if (input.status === 'unavailable') {
        if (input.quantityAvailable !== 0 || input.priceMinor !== null) {
          throw new AvailabilityResponsePolicyError('An unavailable response must have zero quantity and no price.');
        }
      } else if (!Number.isInteger(input.quantityAvailable) || Number(input.quantityAvailable) < 1 || !Number.isInteger(input.priceMinor) || Number(input.priceMinor) < 0) {
        throw new AvailabilityResponsePolicyError('An available or partial response requires a positive quantity and non-negative price.');
      }
      if (input.sellerMessage && input.sellerMessage.length > 1000) {
        throw new AvailabilityResponsePolicyError('The seller message is too long.');
      }
      const rows = await retryDatabase(() => sql`
        with seller as (
          select a.id as seller_account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.onboarding_state in ('seller_ready', 'complete')
            and a.suspended_at is null
        ),
        existing as (
          select ar.id, ar.request_id, ar.facility_id, ar.status,
                 ar.quantity_available, ar.price_minor, ar.observed_at,
                 ar.responder_account_id
          from v2_availability_responses ar
          join seller s on s.seller_account_id = ar.responder_account_id
          where ar.idempotency_key = ${input.idempotencyKey}
        ),
        eligible as (
          select r.id as request_id, f.id as facility_id, p.id as product_id,
                 s.seller_account_id,
                 ${input.quantityAvailable}::int as quantity_available,
                 ${input.priceMinor}::int as price_minor
          from v2_availability_requests r
          join v2_facilities f on f.id = ${input.facilityId}::uuid
          join v2_products p on p.id = ${input.productId}::uuid and p.facility_id = f.id
          join seller s on s.seller_account_id = f.account_id
          where r.id = ${input.requestId}::uuid
            and f.id = any(r.facility_scope)
            and p.publication_state = 'published'
            and r.product_id = p.id
            and ${input.quantityAvailable} <= p.quantity_allocated_omni
        ),
        inserted as (
          insert into v2_availability_responses
            (request_id, facility_id, responder_account_id, status, quantity_available, price_minor, offer_snapshot, seller_message, idempotency_key)
          select e.request_id, e.facility_id, e.seller_account_id, ${input.status}, e.quantity_available, e.price_minor,
                 jsonb_build_object('unit_price_minor', e.price_minor, 'currency', 'USD'), ${input.sellerMessage}, ${input.idempotencyKey}
          from eligible e
          where not exists (select 1 from existing)
          on conflict (responder_account_id, idempotency_key) where idempotency_key is not null do nothing
          returning id, request_id, facility_id, status, quantity_available, price_minor, observed_at, responder_account_id
        ),
        result as (
          select i.id, i.request_id, i.facility_id, r.product_id, i.status, i.quantity_available, i.price_minor, i.observed_at, i.responder_account_id
          from inserted i
          join v2_availability_requests r on r.id = i.request_id
          union all
          select e.id, e.request_id, e.facility_id, r.product_id, e.status, e.quantity_available, e.price_minor, e.observed_at, e.responder_account_id
          from existing e
          join v2_availability_requests r on r.id = e.request_id
        ),
        audit as (
          insert into v2_audit_events
            (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select r.responder_account_id, 'availability_response_created', 'availability_response', r.id::text, ${input.correlationId}, r.status, now()
          from result r
          where exists (select 1 from inserted i where i.id = r.id)
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        )
        select id, request_id, facility_id, product_id, status, quantity_available, price_minor, observed_at
        from result
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new AvailabilityResponsePolicyError('The seller is not authorized for this request, facility or product.');
      const responseShapeMatches = String(row.request_id) === input.requestId
        && String(row.facility_id) === input.facilityId
        && String(row.product_id) === input.productId
        && String(row.status) === input.status
        && (row.quantity_available === null ? null : Number(row.quantity_available)) === input.quantityAvailable
        && (row.price_minor === null ? null : Number(row.price_minor)) === input.priceMinor;
      if (!responseShapeMatches) {
        throw new AvailabilityResponsePolicyError('The idempotency key is already used for a different availability response.');
      }
      return {
        responseId: String(row.id),
        requestId: String(row.request_id),
        facilityId: String(row.facility_id),
        productId: String(row.product_id),
        status: row.status as AvailabilityResponseStatus,
        quantityAvailable: row.quantity_available === null ? null : Number(row.quantity_available),
        priceMinor: row.price_minor === null ? null : Number(row.price_minor),
        observedAt: new Date(String(row.observed_at)).toISOString(),
      };
    },

    async issueBuyerQrToken(input: {
      authUserId: string;
      transactionId: string;
      correlationId: string;
    }): Promise<QrTokenIssuePersistenceResult> {
      const token = randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const rows = await retryDatabase(() => sql`
        with buyer as (
          select a.id as buyer_account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ),
        eligible as (
          select s.transaction_id, m.account_id as buyer_account_id
          from v2_transaction_snapshots s
          join v2_transaction_members m on m.transaction_id = s.transaction_id and m.role = 'buyer'
          join buyer b on b.buyer_account_id = m.account_id
          where s.transaction_id = ${input.transactionId}::uuid
            and coalesce((select e.state from v2_transaction_events e where e.transaction_id = s.transaction_id order by e.created_at desc, e.id desc limit 1), 'intent_created') in ('intent_created', 'qr_ready')
        ),
        inserted as (
          insert into v2_qr_tokens (transaction_id, token_hash, expires_at, verified_at, replay_count)
          select e.transaction_id, ${tokenHash}, ${expiresAt}::timestamptz, null, 0
          from eligible e
          on conflict (transaction_id) do update
            set token_hash = excluded.token_hash,
                expires_at = excluded.expires_at,
                verified_at = null,
                replay_count = 0
          returning transaction_id, expires_at
        ),
        event as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
          select i.transaction_id, e.buyer_account_id, 'qr_ready', jsonb_build_object('issuer', 'buyer'), now()
          from inserted i
          join eligible e on e.transaction_id = i.transaction_id
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        ),
        audit as (
          insert into v2_audit_events
            (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select e.buyer_account_id, 'qr_issued', 'transaction', i.transaction_id::text, ${input.correlationId}, 'buyer_issued', now()
          from inserted i
          join eligible e on e.transaction_id = i.transaction_id
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        )
        select transaction_id, expires_at from inserted
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new TransactionPolicyError('Buyer QR issuance requires an authorized buyer transaction in intent-created state.');
      return {
        transactionId: String(row.transaction_id),
        token,
        expiresAt: new Date(String(row.expires_at)).toISOString(),
      };
    },

    async issueQrToken(input: {
      authUserId: string;
      transactionId: string;
      correlationId: string;
    }): Promise<QrTokenIssuePersistenceResult> {
      const token = randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const rows = await retryDatabase(() => sql`
        with seller as (
          select a.id as seller_account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.onboarding_state in ('seller_ready', 'complete')
            and a.suspended_at is null
        ),
        eligible as (
          select s.transaction_id, m.account_id as seller_account_id
          from v2_transaction_snapshots s
          join v2_transaction_members m on m.transaction_id = s.transaction_id and m.role = 'seller'
          join seller a on a.seller_account_id = m.account_id
          where s.transaction_id = ${input.transactionId}::uuid
            and coalesce((select e.state from v2_transaction_events e where e.transaction_id = s.transaction_id order by e.created_at desc, e.id desc limit 1), 'intent_created') = 'intent_created'
        ),
        inserted as (
          insert into v2_qr_tokens (transaction_id, token_hash, expires_at)
          select e.transaction_id, ${tokenHash}, ${expiresAt}::timestamptz
          from eligible e
          on conflict (transaction_id) do nothing
          returning transaction_id, expires_at
        ),
        event as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
          select i.transaction_id, e.seller_account_id, 'qr_ready', '{}'::jsonb, now()
          from inserted i
          join eligible e on e.transaction_id = i.transaction_id
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        ),
        audit as (
          insert into v2_audit_events
            (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select e.seller_account_id, 'qr_issued', 'transaction', i.transaction_id::text, ${input.correlationId}, 'seller_issued', now()
          from inserted i
          join eligible e on e.transaction_id = i.transaction_id
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        )
        select transaction_id, expires_at from inserted
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new TransactionPolicyError('QR issuance requires an authorized seller transaction in intent-created state.');
      return {
        transactionId: String(row.transaction_id),
        token,
        expiresAt: new Date(String(row.expires_at)).toISOString(),
      };
    },

    async createPurchaseIntent(input: {
      authUserId: string;
      responseId: string;
      idempotencyKey: string;
    }): Promise<PurchaseIntentPersistenceResult> {
      const rows = await retryDatabase(() => sql`
        with buyer as (
          select a.id as buyer_account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ),
        existing as (
          select pi.id, pi.response_id, pi.transaction_id, pi.buyer_account_id, pi.state
          from v2_purchase_intents pi
          join buyer b on b.buyer_account_id = pi.buyer_account_id
          where pi.idempotency_key = ${input.idempotencyKey}
        ),
        eligible as (
          select
            ar.id as response_id,
            r.id as request_id,
            r.buyer_account_id,
            f.account_id as seller_account_id,
            ar.facility_id,
            r.product_id,
            least(r.requested_quantity, ar.quantity_available) as quantity,
            ar.price_minor,
            nullif(ar.offer_snapshot ->> 'coupon_code', '') as coupon_code,
            ar.observed_at
          from v2_availability_responses ar
          join v2_availability_requests r on r.id = ar.request_id
          join v2_facilities f on f.id = ar.facility_id
          join buyer b on b.buyer_account_id = r.buyer_account_id
          where ar.id = ${input.responseId}::uuid
            and ar.status in ('available', 'partial', 'corrected')
            and ar.quantity_available is not null
            and ar.quantity_available > 0
            and ar.price_minor is not null
            and ar.price_minor >= 0
            and ar.facility_id = any(r.facility_scope)
            and f.account_id is not null
        ),
        intent_upsert as (
          insert into v2_purchase_intents
            (buyer_account_id, response_id, transaction_id, idempotency_key, state)
          select b.buyer_account_id, e.response_id, gen_random_uuid(), ${input.idempotencyKey}, 'active'
          from buyer b
          cross join eligible e
          where not exists (select 1 from existing)
          on conflict (buyer_account_id, idempotency_key)
          do update set idempotency_key = excluded.idempotency_key
          returning id, response_id, transaction_id, buyer_account_id, state
        ),
        intent_result as (
          select id, response_id, transaction_id, buyer_account_id, state from intent_upsert
          union all
          select id, response_id, transaction_id, buyer_account_id, state from existing
        ),
        snapshot_insert as (
          insert into v2_transaction_snapshots
            (transaction_id, intent_id, buyer_account_id, facility_id, product_id, quantity, unit_price_minor, coupon_code, net_amount_minor, response_observed_at)
          select i.transaction_id, i.id, e.buyer_account_id, e.facility_id, e.product_id, e.quantity, e.price_minor, e.coupon_code, e.quantity * e.price_minor, e.observed_at
          from intent_upsert i
          join eligible e on e.response_id = i.response_id
          on conflict (transaction_id) do nothing
          returning transaction_id
        ),
        member_insert as (
          insert into v2_transaction_members (transaction_id, account_id, role)
          select i.transaction_id, e.buyer_account_id, 'buyer'
          from intent_upsert i
          join eligible e on e.response_id = i.response_id
          union all
          select i.transaction_id, e.seller_account_id, 'seller'
          from intent_upsert i
          join eligible e on e.response_id = i.response_id
          on conflict (transaction_id, account_id, role) do nothing
          returning transaction_id
        ),
        event_insert as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata)
          select i.transaction_id, null, 'intent_created', jsonb_build_object('response_id', e.response_id)
          from intent_upsert i
          join eligible e on e.response_id = i.response_id
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        )
        select id, response_id, transaction_id, buyer_account_id, state
        from intent_result
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new PurchaseIntentPolicyError('No eligible availability response belongs to the authenticated buyer.');
      if (String(row.response_id) !== input.responseId) {
        throw new PurchaseIntentPolicyError('The idempotency key is already used for a different purchase intent.');
      }
      return {
        intentId: String(row.id),
        responseId: String(row.response_id),
        transactionId: String(row.transaction_id),
        buyerAccountId: String(row.buyer_account_id),
        state: String(row.state),
      };
    },

    async verifyQrToken(input: {
      authUserId: string;
      transactionId: string;
      tokenHash: string;
      now: string;
    }): Promise<QrVerificationPersistenceResult> {
      const rows = await retryDatabase(() => sql`
        with eligible as (
          select q.transaction_id, q.token_hash, a.id as actor_account_id,
            s.facility_id, s.product_id, p.name as product_name, s.quantity, s.unit_price_minor, s.coupon_code, s.net_amount_minor,
            coalesce((
              select e.state
              from v2_transaction_events e
              where e.transaction_id = q.transaction_id
              order by e.created_at desc, e.id desc
              limit 1
            ), 'intent_created') as current_state
          from v2_qr_tokens q
          join v2_transaction_snapshots s on s.transaction_id = q.transaction_id
          join v2_products p on p.id = s.product_id
          join v2_transaction_members m on m.transaction_id = q.transaction_id and m.role = 'seller'
          join v2_accounts a on a.id = m.account_id
          where q.transaction_id = ${input.transactionId}::uuid
            and q.token_hash = ${input.tokenHash}
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and q.verified_at is null
            and q.replay_count = 0
            and q.expires_at > ${input.now}::timestamptz
            and coalesce((
              select e.state
              from v2_transaction_events e
              where e.transaction_id = q.transaction_id
              order by e.created_at desc, e.id desc
              limit 1
            ), 'intent_created') = 'qr_ready'
          for update of q
        ),
        updated as (
          update v2_qr_tokens q
          set verified_at = ${input.now}::timestamptz,
              replay_count = q.replay_count + 1
          from eligible e
          where q.transaction_id = e.transaction_id
            and q.token_hash = e.token_hash
          returning q.transaction_id, q.verified_at, q.replay_count, e.actor_account_id
        ),
        event as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
          select transaction_id, actor_account_id, 'qr_verified', '{}'::jsonb, ${input.now}::timestamptz
          from updated
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        ),
        audit as (
          insert into v2_audit_events
            (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select actor_account_id, 'qr_verified', 'transaction', transaction_id::text, ${input.transactionId}, 'seller_verified', ${input.now}::timestamptz
          from updated
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        )
        select u.transaction_id, u.verified_at, u.replay_count,
          s.facility_id, s.product_id, p.name as product_name, s.quantity, s.unit_price_minor, s.coupon_code, s.net_amount_minor
        from updated u
        join v2_transaction_snapshots s on s.transaction_id = u.transaction_id
        join v2_products p on p.id = s.product_id
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return { accepted: false, transactionId: input.transactionId, reason: 'NOT_VERIFIED' };
      return {
        accepted: true,
        transactionId: String(row.transaction_id),
        verifiedAt: new Date(String(row.verified_at)).toISOString(),
        nextReplayCount: Number(row.replay_count),
        facilityId: String(row.facility_id),
        productId: String(row.product_id),
        productName: String(row.product_name ?? 'Offre catalogue'),
        quantity: Number(row.quantity),
        unitPriceMinor: Number(row.unit_price_minor),
        couponCode: row.coupon_code === null || row.coupon_code === undefined ? null : String(row.coupon_code),
        netAmountMinor: Number(row.net_amount_minor),
      };
    },

    async getTransaction(input: { authUserId: string; transactionId: string }): Promise<TransactionSnapshotResult | null> {
      const rows = await retryDatabase(() => sql`
        select
          s.transaction_id,
          s.product_id,
          s.facility_id,
          s.quantity,
          s.unit_price_minor,
          s.coupon_code,
          s.net_amount_minor,
          m.role as actor_role,
          coalesce((
            select e.state
            from v2_transaction_events e
            where e.transaction_id = s.transaction_id
            order by e.created_at desc, e.id desc
            limit 1
          ), 'intent_created') as current_state
        from v2_transaction_snapshots s
        join v2_transaction_members m on m.transaction_id = s.transaction_id
        join v2_accounts a on a.id = m.account_id
        where s.transaction_id = ${input.transactionId}::uuid
          and a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return null;
      return {
        transactionId: String(row.transaction_id),
        state: String(row.current_state) as TransactionSnapshotResult['state'],
        actorRole: String(row.actor_role) as TransactionSnapshotResult['actorRole'],
        productId: String(row.product_id),
        facilityId: String(row.facility_id),
        quantity: Number(row.quantity),
        unitPriceMinor: Number(row.unit_price_minor),
        couponCode: row.coupon_code === null || row.coupon_code === undefined ? null : String(row.coupon_code),
        netAmountMinor: Number(row.net_amount_minor),
      };
    },

    async createAvailabilityRequest(input: {
      authUserId: string;
      productId: string;
      facilityId: string;
      quantity: number;
      budgetMode: 'unlimited' | 'maximum';
      budgetMinor: number | null;
      idempotencyKey: string;
    }): Promise<AvailabilityResult> {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const rows = await retryDatabase(() => sql`
        with valid_selection as (
          select p.id as product_id, f.id as facility_id
          from v2_products p
          join v2_facilities f on f.id = ${input.facilityId}::uuid and p.facility_id = f.id
          where p.id = ${input.productId}::uuid
            and p.publication_state = 'published'
            and f.trust_state in ('certified', 'unconfirmed', 'confirmed')
        ),
        account as (
          insert into v2_accounts (auth_user_id, onboarding_state)
          select ${input.authUserId}, 'buyer_ready'
          where exists (select 1 from valid_selection)
          on conflict (auth_user_id) do update set updated_at = now()
          returning id
        ),
        wallet as (
          insert into v2_wallets (account_id)
          select id from account
          on conflict (account_id) do update set account_id = excluded.account_id
          returning account_id
        ),
        request_insert as (
          insert into v2_availability_requests
            (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, budget_minor, status, idempotency_key, expires_at)
          select a.id, s.product_id, array[s.facility_id], ${input.quantity}, ${input.budgetMode}, ${input.budgetMinor}, 'submitted', ${input.idempotencyKey}, ${expiresAt}::timestamptz
          from account a
          cross join valid_selection s
          join wallet w on w.account_id = a.id
          on conflict (buyer_account_id, idempotency_key) do nothing
          returning id, product_id, facility_scope[1] as facility_id, requested_quantity, budget_mode, budget_minor, status, expires_at
        ),
        request_result as (
          select id, product_id, facility_id, requested_quantity, budget_mode, budget_minor, status, expires_at
          from request_insert
          union all
          select r.id, r.product_id, r.facility_scope[1] as facility_id, r.requested_quantity, r.budget_mode, r.budget_minor, r.status, r.expires_at
          from v2_availability_requests r
          where r.buyer_account_id = (select id from account)
            and r.idempotency_key = ${input.idempotencyKey}
        )
        select * from request_result limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new AvailabilityPolicyError('The selected product is not published at the requested facility.');
      if (
        String(row.product_id) !== input.productId
        || String(row.facility_id) !== input.facilityId
        || Number(row.requested_quantity) !== input.quantity
        || String(row.budget_mode) !== input.budgetMode
        || (row.budget_minor === null ? null : Number(row.budget_minor)) !== input.budgetMinor
      ) {
        throw new AvailabilityPolicyError('The idempotency key is already used for a different availability request.');
      }
      return {
        requestId: String(row.id),
        productId: String(row.product_id),
        facilityId: String(row.facility_id),
        status: String(row.status) as AvailabilityResult['status'],
        expiresAt: new Date(String(row.expires_at)).toISOString(),
        message: 'Request sent. The facility can now confirm the live availability.',
      };
    },
  };
}
