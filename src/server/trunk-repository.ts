import { neon } from '@neondatabase/serverless';
import { createHash, randomBytes } from 'node:crypto';
import { BULK_PACKS, bulkPackById, convertUsdMinorToLocal, OMNI_BASE_CURRENCY, OMNI_DEFAULT_LOCAL_CURRENCY, OMNI_PLAN_PRICES_USD_MINOR } from '../domain/pricing';
import { CONFIRMED_SALES_THRESHOLD, FREE_OFFER_LIMIT, INDIVIDUAL_CONFIRMED_SALES_THRESHOLD } from '../domain/invariants';

import type { QrVerificationResult, TransactionState, WalletEntryKind } from '../domain/contracts';
import { EvidenceStoragePolicyError, FieldPilotPolicyError, hasPrivateBlobConfiguration, verifyPrivateEvidenceObjects } from './evidence-contract';
export { EvidenceStoragePolicyError, FieldPilotPolicyError } from './evidence-contract';
import type { AdCampaignCreateResult, AdCampaignListResult, AvailabilityResponseStatus as BuyerAvailabilityResponseStatus, AvailabilityResponsesResult, AvailabilityResult, AccountFavorite, BuyerCreditSummary, BuyerProActivationResult, BuyerProOptInResult, BuyerProRenewalResult, BuyerProStatus, BulkAvailabilityResult, CancelAvailabilityRequestResult, ClaimEvidenceItem, CreateSellerFacilityResult, FavoritesResult, FacilityDetail, FacilityRenewalOptInResult, FacilityRenewalResult, FacilityRenewalStatus, FacilityType, MyTeamInvite, PublicEntity, PublicEntityDetail, PublicFacility, PublicProduct, SellerAdCampaign, SellerCatalogueFacility, SellerCatalogueProduct, Team, TeamInvite, TeamListResult, TeamMember, TeamMemberResult, TeamInviteResult, TeamInviteAcceptResult, CreateTeamResult, FacilityZoneAssignment, TransactionMessage, TransactionSnapshotResult, WalletOverviewResult } from '../trunk/types';
import { createFedaPayCheckout, fetchFedaPayTransaction, isFedaPayConfigured } from './fedapay-adapter';
import { qrExpiryFrom, resolveQrTtlMinutes } from '../trunk/transaction-time';

export interface DatabaseClient {
  query(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>;
  transaction?(queries: unknown[], options?: Record<string, unknown>): Promise<unknown[]>;
}

function database(): ReturnType<typeof neon> {
  const url = process.env.V2_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('V2_DATABASE_URL is not configured for the server runtime.');
  return neon(url);
}

const PUBLIC_TRUST_STATES = new Set<PublicFacility['trust']>(['unclaimed', 'unconfirmed', 'confirmed']);

const toEntity = (row: Record<string, unknown>): PublicEntity => ({
  id: String(row.id),
  name: String(row.name),
  kind: String(row.kind) === 'individu' ? 'individu' : 'organisation',
  // D-01: `certified` is an INTERNAL milestone and must never be a public claim — the
  // same convention `toFacility` already applies. Anything not publicly claimable reads
  // as `unconfirmed` (an entity was created by someone, unlike a cold-start place).
  trust: PUBLIC_TRUST_STATES.has(String(row.trust_state) as PublicFacility['trust'])
    ? String(row.trust_state) as PublicEntity['trust']
    : 'unconfirmed',
  category: row.category === null || row.category === undefined ? null : String(row.category),
  address: row.address === null || row.address === undefined ? null : String(row.address),
  latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
  longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
  offerCount: Number(row.offer_count ?? 0),
  minPriceMinor: row.min_price_minor === null || row.min_price_minor === undefined ? null : Number(row.min_price_minor),
  currency: row.currency === null || row.currency === undefined ? null : String(row.currency),
});

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
  // R-E (S-11): the entity behind the place. A place may exist without one (cold-start, S-05).
  entityId: row.entity_id === null || row.entity_id === undefined ? null : String(row.entity_id),
  entityName: row.entity_name === null || row.entity_name === undefined ? null : String(row.entity_name),
  entityKind: row.entity_kind === null || row.entity_kind === undefined ? null : String(row.entity_kind) as PublicFacility['entityKind'],
  // NW-13j: an active sponsored campaign exists when the aggregate row says so.
  sponsored: row.sponsored !== undefined ? Boolean(row.sponsored) : (row.sponsored_campaign_id !== undefined && row.sponsored_campaign_id !== null),
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

export class InsufficientCreditsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientCreditsError';
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

export class BuyerSearchPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BuyerSearchPolicyError';
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
  qrToken: string | null;
  qrExpiresAt: string | null;
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

export type WalletSpendKind = Extract<WalletEntryKind, 'slot_spend' | 'facility_pro_spend' | 'ad_spend' | 'bonus_spend' | 'buyer_pro_spend'>;

export interface WalletSpendPersistenceResult {
  ledgerEntryId: string;
  walletId: string;
  kind: WalletSpendKind;
  amountMinor: number;
  status: 'confirmed';
  facilityId: string;
}

export interface WalletRechargePersistenceResult {
  rechargeId: string;
  accountId: string;
  amountMinor: number;
  currency: string;
  status: 'pending';
  providerTransactionId: string;
  checkoutUrl: string;
  purpose: 'wallet' | 'pack';
  packCredits: number | null;
}

export interface BulkPackCatalogItem {
  id: string;
  credits: number;
  priceMinor: number;
  billingCurrency: string;
}

export interface FacilityProActivationPersistenceResult {
  facilityId: string;
  entitlementId: string;
  endsAt: string;
  spendLedgerEntryId: string;
}

export interface FacilityBonusPersistenceResult {
  ledgerEntryId: string;
  walletId: string;
  kind: 'bonus_grant';
  amountMinor: 10000;
  status: 'confirmed';
  facilityId: string;
}

export interface FacilityBonusStatus {
  facilityId: string;
  unlockType: 'pro_test_credit_20_usd';
  distinctBuyerCount: number;
  requiredCount: number;
  status: 'locked' | 'eligible' | 'granted';
  amountMinor: number;
  trustState: 'unclaimed' | 'verification_draft' | 'verification_submitted' | 'admin_review' | 'certified' | 'unconfirmed' | 'confirmed' | 'rejected' | 'suspended';
  qualifyingSales: number;
  bonusUnlockedAt: string | null;
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

export type ExternalPaymentMethod = 'cash' | 'mobile_money';

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
  latitude: number;
  longitude: number;
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
export interface AccountContextResult {
  accountId: string;
  roles: Array<'buyer' | 'seller' | 'admin' | 'operator' | 'reviewer'>;
  onboardingState: string;
  suspended: boolean;
  facilityCount: number;
  // Ids of the facilities owned by this account (rule 7 Evergreen pin ring).
  // Owned data only — no product, stock or revenue detail leaves the server.
  ownedFacilityIds: string[];
  capabilities: {
    sellerWorkspace: boolean;
    operatorTools: boolean;
    reviewerWorkspace: boolean;
    adminTools: boolean;
  };
}

export type ManagedStaffRole = 'operator' | 'reviewer';

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
  role: ManagedStaffRole;
  status: 'active' | 'revoked';
}

export type FacilityOperationalState = 'ouvert' | 'ferme' | 'temporairement_indisponible';

export const FACILITY_OPERATIONAL_STATES: readonly FacilityOperationalState[] = ['ouvert', 'ferme', 'temporairement_indisponible'];

export interface AdminConsoleResult {
  authorized: boolean;
  pendingClaims: number;
  pendingActivations: number;
  operatorRuns: number;
  auditEventsToday: number;
}

export interface FacilityOperationalStateResult {
  facilityId: string;
  operationalState: FacilityOperationalState;
}

export interface SalesCounterCorrectionResult {
  facilityId: string;
  qualifyingSales: number;
  previousQualifyingSales: number;
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

export const toProduct = (row: Record<string, unknown>): PublicProduct => {
  const priceMinor = Number(row.price_minor ?? 0);
  const discountValueMinor = row.discount_value_minor === null || row.discount_value_minor === undefined ? 0 : Number(row.discount_value_minor);
  const percentage = row.discount_kind === 'percentage' ? Math.round(discountValueMinor) : 0;
  const discountAmount = percentage > 0 ? Math.floor((priceMinor * percentage) / 100) : 0;
  const prixReduit = Math.max(0, priceMinor - discountAmount);
  return {
    id: String(row.id),
    facilityId: String(row.facility_id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    category: row.category ? String(row.category) : null,
    unit: String(row.unit ?? 'unit'),
    couponLabel: row.coupon_label ? String(row.coupon_label) : null,
    currency: String(row.currency ?? 'XOF'),
    stockLoueOmni: row.quantity_allocated_omni === null || row.quantity_allocated_omni === undefined ? 0 : Math.max(0, Number(row.quantity_allocated_omni) - Number(row.quantity_reserved_omni ?? 0)),
    prixOriginal: priceMinor,
    prixReduit,
    pourcentageReduction: percentage,
    positionKind: (['fixe', 'mobile', 'immaterielle'].includes(String(row.position_kind)) ? String(row.position_kind) : null) as PublicProduct['positionKind'],
    uniquenessKind: (['renouvelable', 'piece_unique'].includes(String(row.uniqueness_kind)) ? String(row.uniqueness_kind) : null) as PublicProduct['uniquenessKind'],
    handoverKind: (['retrait', 'livraison', 'immateriel'].includes(String(row.handover_kind)) ? String(row.handover_kind) : null) as PublicProduct['handoverKind'],
    priceKind: (['fixe', 'negociable'].includes(String(row.price_kind)) ? String(row.price_kind) : null) as PublicProduct['priceKind'],
    conditionKind: (['neuf', 'occasion'].includes(String(row.condition_kind)) ? String(row.condition_kind) : null) as PublicProduct['conditionKind'],
  };
};

const OFFER_POSITION_KINDS = ['fixe', 'mobile', 'immaterielle'] as const;
const OFFER_UNIQUENESS_KINDS = ['renouvelable', 'piece_unique'] as const;
const OFFER_HANDOVER_KINDS = ['retrait', 'livraison', 'immateriel'] as const;
const OFFER_PRICE_KINDS = ['fixe', 'negociable'] as const;
const OFFER_CONDITION_KINDS = ['neuf', 'occasion'] as const;

/**
 * S-01 — normalise an offer's characteristics. `null` means "not declared yet" and is allowed
 * (the columns are nullable by design); any *present* value must be one of the allowed ones.
 * A wrong value throws rather than silently writing a value the DB CHECK would reject later.
 */
function normalizeOfferCharacteristics(input: {
  positionKind?: string | null;
  uniquenessKind?: string | null;
  handoverKind?: string | null;
  priceKind?: string | null;
  conditionKind?: string | null;
}): {
  positionKind: string | null;
  uniquenessKind: string | null;
  handoverKind: string | null;
  priceKind: string | null;
  conditionKind: string | null;
} {
  const pick = (value: string | null | undefined, allowed: readonly string[]): string | null => {
    if (value === null || value === undefined || value === '') return null;
    if (!allowed.includes(value)) throw new SellerCataloguePolicyError('INVALID_INPUT');
    return value;
  };
  return {
    positionKind: pick(input.positionKind, OFFER_POSITION_KINDS),
    uniquenessKind: pick(input.uniquenessKind, OFFER_UNIQUENESS_KINDS),
    handoverKind: pick(input.handoverKind, OFFER_HANDOVER_KINDS),
    priceKind: pick(input.priceKind, OFFER_PRICE_KINDS),
    conditionKind: pick(input.conditionKind, OFFER_CONDITION_KINDS),
  };
}

export function createTrunkRepository(sql: ReturnType<typeof neon> = database()) {
  return {
    async getAccountContext(input: { authUserId: string }): Promise<AccountContextResult | null> {
      const rows = await retryDatabase(() => sql`
        select a.id, a.onboarding_state, a.suspended_at,
          count(distinct f.id)::int as facility_count,
          coalesce(array_agg(distinct f.id) filter (where f.id is not null), '{}') as facility_ids,
          coalesce(array_agg(distinct ar.role) filter (where ar.role is not null and ar.status = 'active'), '{}') as roles
        from v2_accounts a
        left join v2_account_roles ar on ar.account_id = a.id and ar.status = 'active'
        left join v2_facilities f on f.account_id = a.id
        where a.auth_user_id = ${input.authUserId}
        group by a.id, a.onboarding_state, a.suspended_at
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return null;
      const roles = Array.isArray(row.roles) ? row.roles.map(String).filter((role): role is AccountContextResult['roles'][number] => ['buyer', 'seller', 'admin', 'operator', 'reviewer'].includes(role)) : [];
      const suspended = row.suspended_at !== null;
      return {
        accountId: String(row.id),
        roles,
        onboardingState: String(row.onboarding_state),
        suspended,
        facilityCount: Number(row.facility_count ?? 0),
        ownedFacilityIds: Array.isArray(row.facility_ids) ? row.facility_ids.map(String) : [],
        capabilities: {
          sellerWorkspace: !suspended && String(row.onboarding_state) === 'seller_ready',
          operatorTools: !suspended && roles.includes('operator'),
          reviewerWorkspace: !suspended && roles.includes('reviewer'),
          adminTools: !suspended && roles.includes('admin'),
        },
      };
    },
    async listRoleManagementAccounts(input: { authUserId: string }): Promise<{ authorized: boolean; accounts: RoleManagementAccount[] }> {
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' AND ar.status = 'active'
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        )
        select candidate.id as account_id, candidate.auth_user_id, candidate.onboarding_state, candidate.suspended_at,
          u.email, u.name,
          count(distinct f.id)::int as facility_count,
          coalesce(array_agg(distinct ar.role) filter (where ar.role is not null and ar.status = 'active'), '{}') as roles
        from admin
        cross join v2_accounts candidate
        left join neon_auth."user" u on u.id::text = candidate.auth_user_id
        left join v2_account_roles ar on ar.account_id = candidate.id
        left join v2_facilities f on f.account_id = candidate.id
        group by candidate.id, candidate.auth_user_id, candidate.onboarding_state, candidate.suspended_at, u.email, u.name
        order by candidate.created_at asc, candidate.id asc
        limit 200
      `);
      const accounts = (rows as Record<string, unknown>[]).map((row) => ({
        accountId: String(row.account_id),
        authUserId: String(row.auth_user_id),
        email: row.email ? String(row.email) : null,
        name: row.name ? String(row.name) : null,
        roles: (Array.isArray(row.roles) ? row.roles.map(String) : []).filter((role): role is RoleManagementAccount['roles'][number] => ['buyer', 'seller', 'admin', 'operator', 'reviewer'].includes(role)),
        onboardingState: String(row.onboarding_state),
        suspended: row.suspended_at !== null,
        facilityCount: Number(row.facility_count ?? 0),
      }));
      const authorized = accounts.length > 0;
      return { authorized, accounts };
    },
    async setManagedStaffRole(input: { authUserId: string; accountId: string; role: ManagedStaffRole; status: 'active' | 'revoked'; reason: string; correlationId: string }): Promise<RoleManagementResult> {
      if (!['operator', 'reviewer'].includes(input.role) || !['active', 'revoked'].includes(input.status) || input.reason.trim().length < 3 || input.reason.trim().length > 1000) {
        throw new FieldPilotPolicyError('A valid managed role, status and bounded reason are required.');
      }
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' AND ar.status = 'active'
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        ), target as (
          select a.id, admin.id as admin_id
          from v2_accounts a cross join admin
          where a.id = ${input.accountId}::uuid
            and a.suspended_at is null
            and a.id <> admin.id
        ), upserted as (
          insert into v2_account_roles (account_id, role, status, granted_by_account_id, revoked_at)
          select target.id, ${input.role}, ${input.status}, target.admin_id, case when ${input.status} = 'revoked' then now() else null end
          from target
          on conflict (account_id, role) do update set status = excluded.status, granted_by_account_id = excluded.granted_by_account_id, revoked_at = excluded.revoked_at
          returning account_id, role, status
        ), audit as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
          select target.admin_id, case when ${input.status} = 'active' then 'staff_role_granted' else 'staff_role_revoked' end, 'account_role', upserted.account_id::text, ${input.correlationId}, ${input.reason.trim()}
          from upserted join target on target.id = upserted.account_id
          returning entity_id
        )
        select upserted.account_id, upserted.role, upserted.status
        from upserted join audit on audit.entity_id = upserted.account_id::text
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The Admin session is not authorized or the target account is unavailable.');
      return { accountId: String(row.account_id), role: String(row.role) as ManagedStaffRole, status: String(row.status) as 'active' | 'revoked' };
    },

    async listMyTeamInvites(input: { authUserId: string }): Promise<{ authorized: boolean; invites: MyTeamInvite[] }> {
        const accountRows = await retryDatabase(() => sql`
          select a.id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        `);
        if (!(accountRows as Record<string, unknown>[])[0]) return { authorized: false, invites: [] };
        const rows = await retryDatabase(() => sql`
          select ti.id, ti.team_id, t.name as team_name, t.zone as team_zone, ti.role_in_team, ti.status,
            ti.invited_by_account_id, ti.created_at, ti.accepted_at
          from v2_accounts a
          join neon_auth."user" u on u.id::text = a.auth_user_id
          join v2_team_invites ti on lower(ti.email) = lower(u.email)
          join v2_teams t on t.id = ti.team_id
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and ti.status = 'pending'
          order by ti.created_at desc, ti.id
          limit 50
        `);
        return {
          authorized: true,
          invites: (rows as Record<string, unknown>[]).map((row) => ({
            id: String(row.id),
            teamId: String(row.team_id),
            teamName: String(row.team_name),
            teamZone: row.team_zone === null || row.team_zone === undefined ? null : String(row.team_zone),
            roleInTeam: String(row.role_in_team) as 'lead' | 'member',
            status: String(row.status) as 'pending' | 'accepted' | 'revoked',
            invitedByAccountId: row.invited_by_account_id === null || row.invited_by_account_id === undefined ? null : String(row.invited_by_account_id),
            createdAt: String(row.created_at),
            acceptedAt: row.accepted_at === null || row.accepted_at === undefined ? null : String(row.accepted_at),
          })),
        };
      },

      async acceptTeamInvite(input: { authUserId: string; inviteId: string; correlationId: string }): Promise<TeamInviteAcceptResult> {
        const rows = await retryDatabase(() => sql`
          with me as (
            select a.id as account_id, lower(u.email) as my_email
            from v2_accounts a
            join neon_auth."user" u on u.id::text = a.auth_user_id
            where a.auth_user_id = ${input.authUserId}
              and a.suspended_at is null
            limit 1
          ), invite as (
            select ti.id as invite_id, ti.team_id, ti.role_in_team
            from v2_team_invites ti
            join me on lower(ti.email) = me.my_email
            where ti.id = ${input.inviteId}::uuid
              and ti.status = 'pending'
              and not exists (
                select 1 from v2_team_members tm
                join me on me.account_id = tm.account_id
                where tm.team_id = ti.team_id and tm.status = 'active'
              )
            limit 1
          ), membership as (
            insert into v2_team_members (team_id, account_id, role_in_team, status)
            select invite.team_id, me.account_id, invite.role_in_team, 'active'
            from invite cross join me
            on conflict (team_id, account_id) do update set status = 'active', revoked_at = null
            returning id as member_id, team_id
          ), accept as (
            update v2_team_invites ti
            set status = 'accepted', accepted_at = now()
            from invite
            where ti.id = invite.invite_id
            returning ti.id as id, invite.team_id as team_id
          ), audit as (
            insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
            select me.account_id, 'team_invite_accepted', 'team_invite', accept.id::text, ${input.correlationId}, 'Accepted invitation to join team'
            from accept cross join me
            returning entity_id
          )
          select accept.id as id, accept.team_id as team_id, membership.member_id as member_id, invite.role_in_team as role_in_team
          from invite
          join membership on true
          join accept on true
          join audit on audit.entity_id = accept.id::text
        `);
        const row = (rows as Record<string, unknown>[])[0];
        if (!row) throw new FieldPilotPolicyError('The invitation is not available for this account or is no longer pending.');
        return { id: String(row.id), teamId: String(row.team_id), roleInTeam: String(row.role_in_team) as 'lead' | 'member', status: 'accepted', memberId: String(row.member_id) };
      },

      async assignFacilityZone(input: { authUserId: string; facilityId: string; zone: string | null; correlationId: string }): Promise<FacilityZoneAssignment> {
        const zone = input.zone === null ? null : input.zone.trim();
        const rows = await retryDatabase(() => sql`
          with admin as (
            select a.id
            from v2_accounts a
            join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' and ar.status = 'active'
            where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
            limit 1
          ), updated as (
            update v2_facilities f
            set zone = ${zone}, updated_at = now()
            from admin
            where f.id = ${input.facilityId}::uuid
            returning f.id, f.zone
          ), audit as (
            insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
            select admin.id, 'facility_zone_assigned', 'facility', updated.id::text, ${input.correlationId}, ${'Assigned zone ' + (zone ?? '∅')}
            from updated cross join admin
            returning entity_id
          )
          select updated.id as facility_id, updated.zone
          from updated
          where exists (select 1 from audit where audit.entity_id = updated.id::text)
        `);
        const row = (rows as Record<string, unknown>[])[0];
        if (!row) throw new FieldPilotPolicyError('The Admin session is not authorized or the facility is unavailable.');
        return { facilityId: String(row.facility_id), zone: row.zone === null || row.zone === undefined ? null : String(row.zone) };
      },

    async listTeams(input: { authUserId: string }): Promise<{ authorized: boolean; data: TeamListResult }> {
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' and ar.status = 'active'
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        )
        select
          exists (select 1 from admin) as authorized,
          coalesce((select json_agg(row_to_json(t)) from (
            select t.id, t.name, t.zone, t.description, t.created_by_account_id, t.created_at,
              (select count(*)::int from v2_team_members tm where tm.team_id = t.id and tm.status = 'active') as member_count
            from v2_teams t
            order by t.created_at desc, t.id
            limit 100
          ) t), '[]'::json) as teams,
          coalesce((select json_agg(row_to_json(m)) from (
            select tm.id, tm.team_id, tm.account_id, a.auth_user_id, tm.role_in_team, tm.status, tm.added_by_account_id, tm.created_at, tm.revoked_at
            from v2_team_members tm
            join v2_accounts a on a.id = tm.account_id
            order by tm.created_at desc, tm.id
            limit 200
          ) m), '[]'::json) as members,
          coalesce((select json_agg(row_to_json(i)) from (
            select ti.id, ti.team_id, ti.email, ti.role_in_team, ti.status, ti.invited_by_account_id, ti.created_at, ti.accepted_at, ti.revoked_at
            from v2_team_invites ti
            order by ti.created_at desc, ti.id
            limit 200
          ) i), '[]'::json) as invites
        from admin
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('Team listing is unavailable.');
      const parseArray = (raw: unknown): Record<string, unknown>[] => {
        if (!Array.isArray(raw)) return [];
        return raw as Record<string, unknown>[];
      };
      const teams: Team[] = parseArray(row.teams).map((r) => ({
        id: String(r.id),
        name: String(r.name),
        zone: r.zone === null || r.zone === undefined ? null : String(r.zone),
        description: r.description === null || r.description === undefined ? null : String(r.description),
        createdByAccountId: r.created_by_account_id === null || r.created_by_account_id === undefined ? null : String(r.created_by_account_id),
        createdAt: String(r.created_at),
        memberCount: Number(r.member_count ?? 0),
      }));
      const members: TeamMember[] = parseArray(row.members).map((r) => ({
        id: String(r.id),
        teamId: String(r.team_id),
        accountId: String(r.account_id),
        authUserId: String(r.auth_user_id ?? ''),
        roleInTeam: String(r.role_in_team) as TeamMember['roleInTeam'],
        status: String(r.status) as TeamMember['status'],
        addedByAccountId: r.added_by_account_id === null || r.added_by_account_id === undefined ? null : String(r.added_by_account_id),
        createdAt: String(r.created_at),
        revokedAt: r.revoked_at === null || r.revoked_at === undefined ? null : String(r.revoked_at),
      }));
      const invites: TeamInvite[] = parseArray(row.invites).map((r) => ({
        id: String(r.id),
        teamId: String(r.team_id),
        email: String(r.email),
        roleInTeam: String(r.role_in_team) as TeamInvite['roleInTeam'],
        status: String(r.status) as TeamInvite['status'],
        invitedByAccountId: r.invited_by_account_id === null || r.invited_by_account_id === undefined ? null : String(r.invited_by_account_id),
        createdAt: String(r.created_at),
        acceptedAt: r.accepted_at === null || r.accepted_at === undefined ? null : String(r.accepted_at),
        revokedAt: r.revoked_at === null || r.revoked_at === undefined ? null : String(r.revoked_at),
      }));
      return { authorized: Boolean(row.authorized), data: { teams, members, invites } };
    },

    async createTeam(input: { authUserId: string; name: string; zone?: string | null; description?: string | null; correlationId: string }): Promise<CreateTeamResult> {
      const name = input.name.trim();
      if (name.length < 1 || name.length > 60) throw new FieldPilotPolicyError('A team name between 1 and 60 characters is required.');
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' and ar.status = 'active'
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        ), created as (
          insert into v2_teams (name, zone, description, created_by_account_id)
          select ${name}, ${input.zone?.trim() || null}, ${input.description?.trim() || null}, admin.id
          from admin
          returning id, name, zone, created_by_account_id
        ), audit as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
          select created.created_by_account_id, 'team_created', 'team', created.id::text, ${input.correlationId}, ${'Created team ' + name}
          from created
          returning entity_id
        )
        select created.id, created.name, created.zone
        from created
        where exists (select 1 from audit where audit.entity_id = created.id::text)
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The Admin session is not authorized to create teams.');
      return { id: String(row.id), name: String(row.name), zone: row.zone === null || row.zone === undefined ? null : String(row.zone) };
    },

    async inviteTeamMember(input: { authUserId: string; teamId: string; email: string; roleInTeam: 'lead' | 'member'; correlationId: string }): Promise<TeamInviteResult> {
      const email = input.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new FieldPilotPolicyError('A valid email is required for the invite.');
      if (input.roleInTeam !== 'lead' && input.roleInTeam !== 'member') throw new FieldPilotPolicyError('roleInTeam must be lead or member.');
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' and ar.status = 'active'
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        ), team as (
          select t.id
          from v2_teams t cross join admin
          where t.id = ${input.teamId}::uuid
            and not exists (select 1 from v2_team_members tm where tm.team_id = t.id and tm.account_id = admin.id)
        ), invite as (
          insert into v2_team_invites (team_id, email, role_in_team, status, invited_by_account_id)
          select team.id, ${email}, ${input.roleInTeam}, 'pending', admin.id
          from team cross join admin
          returning id, team_id, email, role_in_team, status, invited_by_account_id
        ), audit as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
          select admin.id, 'team_invite_created', 'team_invite', invite.id::text, ${input.correlationId}, ${'Invited ' + email + ' to team ' + input.teamId}
          from invite cross join admin
          returning entity_id
        )
        select invite.id, invite.team_id, invite.email, invite.role_in_team, invite.status
        from invite
        where exists (select 1 from audit where audit.entity_id = invite.id::text)
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The Admin session is not authorized or the team is unavailable.');
      return { id: String(row.id), teamId: String(row.team_id), email: String(row.email), roleInTeam: String(row.role_in_team) as 'lead' | 'member', status: String(row.status) as 'pending' | 'accepted' | 'revoked' };
    },

    async revokeTeamInvite(input: { authUserId: string; invokeId: string; correlationId: string; reason: string }): Promise<{ id: string; status: 'revoked' }> {
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' and ar.status = 'active'
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        ), updated as (
          update v2_team_invites ti
          set status = 'revoked', revoked_at = now()
          where ti.id = ${input.invokeId}::uuid
            and ti.status = 'pending'
            and exists (select 1 from admin)
          returning id, status
        ), audit as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
          select admin.id, 'team_invite_revoked', 'team_invite', updated.id::text, ${input.correlationId}, ${input.reason.trim()}
          from updated cross join admin
          returning entity_id
        )
        select updated.id, updated.status
        from updated
        where exists (select 1 from audit where audit.entity_id = updated.id::text)
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The Admin session is not authorized or the invite is no longer pending.');
      return { id: String(row.id), status: 'revoked' };
    },

    async setTeamMemberStatus(input: { authUserId: string; teamId: string; accountId: string; roleInTeam: 'lead' | 'member'; status: 'active' | 'revoked'; correlationId: string; reason: string }): Promise<TeamMemberResult> {
      if (input.roleInTeam !== 'lead' && input.roleInTeam !== 'member') throw new FieldPilotPolicyError('roleInTeam must be lead or member.');
      if (input.status !== 'active' && input.status !== 'revoked') throw new FieldPilotPolicyError('status must be active or revoked.');
      if (input.reason.trim().length < 3) throw new FieldPilotPolicyError('A reason at least 3 characters is required.');
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' and ar.status = 'active'
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        ), updated as (
          update v2_team_members tm
          set role_in_team = ${input.roleInTeam}, status = ${input.status},
              revoked_at = case when ${input.status} = 'revoked' then now() else tm.revoked_at end
          where tm.team_id = ${input.teamId}::uuid
            and tm.account_id = ${input.accountId}::uuid
            and exists (select 1 from admin)
          returning id, team_id, account_id, role_in_team, status
        ), audit as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
          select admin.id, case when ${input.status} = 'active' then 'team_member_active' else 'team_member_revoked' end, 'team_member', updated.id::text, ${input.correlationId}, ${input.reason.trim()}
          from updated cross join admin
          returning entity_id
        )
        select updated.team_id, updated.account_id, updated.role_in_team, updated.status
        from updated
        where exists (select 1 from audit where audit.entity_id = updated.id::text)
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The Admin session is not authorized or the membership is unavailable.');
      return { teamId: String(row.team_id), accountId: String(row.account_id), roleInTeam: String(row.role_in_team) as 'lead' | 'member', status: String(row.status) as 'active' | 'revoked' };
    },

    async getAdminConsole(input: { authUserId: string }): Promise<AdminConsoleResult> {
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' AND ar.status = 'active'
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        )
        select
          (select count(*)::int from admin) as is_admin,
          (select count(*)::int from v2_verification_requests where state in ('submitted', 'admin_review')) as pending_claims,
          (select count(distinct candidate.id)::int
             from v2_accounts candidate
             join v2_facilities f on f.account_id = candidate.id
             left join v2_entities e on e.id = f.entity_id
             where coalesce(e.trust_state, f.trust_state) in ('unconfirmed', 'confirmed', 'certified')
               and candidate.onboarding_state <> 'seller_ready' and candidate.suspended_at is null) as pending_activations,
          (select count(*)::int from v2_discovery_runs where created_at >= now() - interval '7 days') as operator_runs,
          (select count(*)::int from v2_audit_events where created_at >= date_trunc('day', now())) as audit_today
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row || Number(row.is_admin) === 0) return { authorized: false, pendingClaims: 0, pendingActivations: 0, operatorRuns: 0, auditEventsToday: 0 };
      return { authorized: true, pendingClaims: Number(row.pending_claims), pendingActivations: Number(row.pending_activations), operatorRuns: Number(row.operator_runs), auditEventsToday: Number(row.audit_today) };
    },

    async setFacilityOperationalState(input: { authUserId: string; facilityId: string; state: FacilityOperationalState; reason: string; correlationId: string }): Promise<FacilityOperationalStateResult> {
      if (!FACILITY_OPERATIONAL_STATES.includes(input.state) || input.reason.trim().length < 3 || input.reason.trim().length > 1000) {
        throw new FieldPilotPolicyError('A valid operational state and a bounded reason are required.');
      }
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' AND ar.status = 'active'
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        ), target as (
          select f.id, admin.id as admin_id
          from v2_facilities f cross join admin
          where f.id = ${input.facilityId}::uuid
        ), updated as (
          update v2_facilities f
          set operational_state = ${input.state}, updated_at = now()
          from target
          where f.id = target.id
          returning f.id, f.operational_state, target.admin_id
        ), audit as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
          select updated.admin_id, 'facility_operational_state_changed', 'facility', updated.id::text, ${input.correlationId}, ${input.reason.trim()}
          from updated
          returning entity_id
        )
        select updated.id, updated.operational_state
        from updated join audit on audit.entity_id = updated.id::text
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The Admin session is not authorized or the facility is unavailable.');
      return { facilityId: String(row.id), operationalState: String(row.operational_state) as FacilityOperationalState };
    },

    async setSellerFacilityOperationalState(input: { authUserId: string; facilityId: string; state: FacilityOperationalState; correlationId: string }): Promise<FacilityOperationalStateResult> {
      if (!FACILITY_OPERATIONAL_STATES.includes(input.state)) {
        throw new FieldPilotPolicyError('A valid operational state is required.');
      }
      const reason = input.state === 'ouvert' ? 'Ouverture déclarée par le vendeur' : 'Fermeture déclarée par le vendeur';
      const rows = await retryDatabase(() => sql`
        with seller as (
          select a.id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and a.onboarding_state = 'seller_ready'
          limit 1
        ), target as (
          select f.id, seller.id as seller_id
          from v2_facilities f cross join seller
          where f.id = ${input.facilityId}::uuid
            and f.account_id = seller.id
        ), updated as (
          update v2_facilities f
          set operational_state = ${input.state}, updated_at = now()
          from target
          where f.id = target.id
          returning f.id, f.operational_state, target.seller_id
        ), audit as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
          select updated.seller_id,, 'facility_operational_state_changed', 'facility', updated.id::text,, ${input.correlationId}, ${reason}
          from updated
          returning entity_id
        )
        select updated.id,, updated.operational_state
        from updated join audit on audit.entity_id = updated.id::text
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The Seller session is not authorized for this facility or the facility is unavailable.');
      return { facilityId: String(row.id), operationalState: String(row.operational_state) as FacilityOperationalState };
    },

    async correctFacilitySalesCounter(input: { authUserId: string; facilityId: string; qualifyingSales: number; reason: string; correlationId: string }): Promise<SalesCounterCorrectionResult> {
      if (!Number.isInteger(input.qualifyingSales) || input.qualifyingSales < 0 || input.qualifyingSales > 3 || input.reason.trim().length < 3 || input.reason.trim().length > 1000) {
        throw new FieldPilotPolicyError('A counter value between 0 and 3 and a bounded reason are required.');
      }
      // Exceptional bookkeeping only (A6): trust transitions stay system-driven on completed
      // transactions (D-01); this correction never fabricates or revokes trust.
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' AND ar.status = 'active'
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        ), target as (
          select f.id, f.qualifying_sales as previous_sales, admin.id as admin_id
          from v2_facilities f cross join admin
          where f.id = ${input.facilityId}::uuid
            and f.qualifying_sales <> ${input.qualifyingSales}
        ), updated as (
          update v2_facilities f
          set qualifying_sales = ${input.qualifyingSales}, updated_at = now()
          from target
          where f.id = target.id
          returning f.id, f.qualifying_sales, target.previous_sales, target.admin_id, f.entity_id
        ), entity_updated as (
          -- R-3b : la correction exceptionnelle du compteur doit valoir aussi sur l'entite (S-30).
          update v2_entities e
          set qualifying_sales = updated.qualifying_sales, updated_at = now()
          from updated
          where e.id = updated.entity_id
          returning e.id
        ), audit as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason)
          select updated.admin_id, 'facility_sales_counter_corrected', 'facility', updated.id::text, ${input.correlationId}, updated.previous_sales::text || ' -> ' || ${input.qualifyingSales}::text || ' : ' || ${input.reason.trim()}
          from updated
          returning entity_id
        )
        select updated.id, updated.qualifying_sales, updated.previous_sales
        from updated join audit on audit.entity_id = updated.id::text
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new FieldPilotPolicyError('The Admin session is not authorized, the facility is unavailable, or the counter already holds that value.');
      return { facilityId: String(row.id), qualifyingSales: Number(row.qualifying_sales), previousQualifyingSales: Number(row.previous_sales) };
    },

    async listAdminAuditEvents(input: { authUserId: string; eventType?: string; limit?: number }): Promise<AdminAuditListResult> {
      const authorizationRows = await retryDatabase(() => sql`
        select a.id
        from v2_accounts a
        join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' AND ar.status = 'active'
        where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
        limit 1
      `);
      if (!(authorizationRows as Record<string, unknown>[])[0]) return { authorized: false, events: [] };
      const limit = Math.min(Math.max(Math.trunc(input.limit ?? 50), 1), 100);
      const eventType = input.eventType?.trim() ?? '';
      const rows = eventType
        ? await retryDatabase(() => sql`
            select e.id, e.event_type, e.entity_type, e.entity_id, e.actor_account_id, e.reason, e.created_at,
              f.name as facility_name, f.latitude, f.longitude
            from v2_audit_events e
            left join v2_facilities f on e.entity_type = 'facility' and f.id::text = e.entity_id
            where e.event_type = ${eventType}
            order by e.created_at desc, e.id desc
            limit ${limit}
          `)
        : await retryDatabase(() => sql`
            select e.id, e.event_type, e.entity_type, e.entity_id, e.actor_account_id, e.reason, e.created_at,
              f.name as facility_name, f.latitude, f.longitude
            from v2_audit_events e
            left join v2_facilities f on e.entity_type = 'facility' and f.id::text = e.entity_id
            order by e.created_at desc, e.id desc
            limit ${limit}
          `);
      return { authorized: true, events: (rows as Record<string, unknown>[]).map((row) => ({ id: String(row.id), eventType: String(row.event_type), entityType: String(row.entity_type), entityId: String(row.entity_id), actorAccountId: row.actor_account_id === null ? null : String(row.actor_account_id), reason: row.reason === null ? null : String(row.reason), createdAt: new Date(String(row.created_at)).toISOString(), facilityName: row.facility_name === null ? null : String(row.facility_name), latitude: row.latitude === null ? null : Number(row.latitude), longitude: row.longitude === null ? null : Number(row.longitude) })) };
    },
    async createSellerFacility(input: {
      authUserId: string;
      name: string;
      facilityType: FacilityType;
      category: string | null;
      description: string | null;
      address: string | null;
      latitude: number | null;
      longitude: number | null;
      rayonKm: number | null;
      contactPhone: string | null;
      contactWhatsapp: string | null;
      idempotencyKey: string;
    }): Promise<CreateSellerFacilityResult> {
      const typeValid = input.facilityType === 'fixe' || input.facilityType === 'mobile' || input.facilityType === 'digital';
      const nameValid = input.name.trim().length > 0 && input.name.trim().length <= 180;
      const keyValid = input.idempotencyKey.trim().length > 0 && input.idempotencyKey.length <= 180;
      const latitudeValid = input.latitude === null || (Number.isFinite(input.latitude) && input.latitude >= -90 && input.latitude <= 90);
      const longitudeValid = input.longitude === null || (Number.isFinite(input.longitude) && input.longitude >= -180 && input.longitude <= 180);
      const rayonValid = input.rayonKm === null || (Number.isFinite(input.rayonKm) && input.rayonKm > 0 && input.rayonKm <= 500);
      const contactValid = (v: string | null) => v === null || (v.trim().length >= 5 && v.trim().length <= 40);
      if (!typeValid || !nameValid || !keyValid || !latitudeValid || !longitudeValid || !rayonValid || !contactValid(input.contactPhone) || !contactValid(input.contactWhatsapp)) {
        throw new SellerCataloguePolicyError('INVALID_INPUT');
      }
      // D-F: a physical facility (fixe/mobile) needs coordinates; a digital facility has no point.
      if (input.facilityType !== 'digital' && (input.latitude === null || input.longitude === null)) {
        throw new SellerCataloguePolicyError('INVALID_INPUT');
      }
      // The discovery radius only applies to mobile facilities.
      if (input.rayonKm !== null && input.facilityType !== 'mobile') {
        throw new SellerCataloguePolicyError('INVALID_INPUT');
      }
      // The universal seller (D-A) can create a facility from an account that is not yet
      // `seller_ready`: creation is the P2→P3 hand-off. A free slot is provisioned if the
      // account has none (D-J Free = 1 free slot per account).
      await retryDatabase(() => sql`
        insert into v2_facility_slots (account_id, source)
        select a.id, 'free'
        from v2_accounts a
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and not exists (
            select 1 from v2_facility_slots fs where fs.account_id = a.id and fs.source = 'free'
          )
        on conflict (account_id) where source = 'free' do nothing
      `);
      const rows = await retryDatabase(() => sql`
        with seller as (
          select a.id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ), existing as (
          select f.id as facility_id, fs.id as slot_id, false as created
          from v2_facilities f
          join v2_facility_slots fs on fs.facility_id = f.id and fs.account_id = f.account_id and fs.status = 'assigned'
          join seller s on s.id = f.account_id
          where f.source_kind = 'created' and f.source_name = 'seller' and f.source_ref = ${input.idempotencyKey.trim()}
          limit 1
        ), available_slot as (
          select fs.id, fs.account_id
          from v2_facility_slots fs
          join seller s on s.id = fs.account_id
          where fs.status = 'available'
          order by fs.created_at, fs.id
          limit 1
        ), entity_new as (
          -- R-2/S-25 : toute offre appartient à une ENTITÉ, et la publication exige ce lien.
          -- Un vendeur qui crée une facilité reçoit donc son entité dans la même instruction —
          -- sinon il ne pourrait jamais publier. S-13 : l'identité qui offre EST l'entité.
          insert into v2_entities (account_id, kind, display_name, trust_state, qualifying_sales, commercial_plan)
          select s.account_id, 'organisation', ${input.name.trim()}, 'unconfirmed', 0, 'free'
          from available_slot s
          where not exists (
            select 1 from v2_entities e where e.account_id = s.account_id
          )
          returning id, account_id
        ), entity_pick as (
          -- L'entité vient d'un CTE (valeur), jamais d'une relecture de table : une CTE qui écrit
          -- n'est pas visible par les autres CTE de la même instruction. Un compte déjà doté
          -- d'une entité la réutilise — S-13, une identité par compte.
          select e.id from v2_entities e join available_slot s on s.account_id = e.account_id
          union all
          select id from entity_new
        ), inserted as (
          insert into v2_facilities
            (account_id, entity_id, source_kind, source_name, source_ref, name, facility_type, category, description, latitude, longitude, rayon_km, address, contact_phone, contact_whatsapp, trust_state)
          select available_slot.account_id, (select id from entity_pick limit 1), 'created', 'seller', ${input.idempotencyKey.trim()}, ${input.name.trim()}, ${input.facilityType}, ${input.category?.trim() || null}, ${input.description?.trim() || null}, ${input.latitude}, ${input.longitude}, ${input.rayonKm}, ${input.address?.trim() || null}, ${input.contactPhone?.trim() || null}, ${input.contactWhatsapp?.trim() || null}, 'unconfirmed'
          from available_slot
          where not exists (select 1 from existing)
          returning id as facility_id, account_id, name
        ), assigned as (
          update v2_facility_slots fs
          set status = 'assigned', facility_id = inserted.facility_id, assigned_at = now()
          from inserted
          where fs.id = (select id from available_slot)
          returning fs.id as slot_id, fs.facility_id
        )
        select facility_id, slot_id, created from existing
        union all
        select assigned.facility_id, assigned.slot_id, true from assigned
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new SellerCataloguePolicyError('FORBIDDEN_OR_SLOT_REQUIRED');
      return { facilityId: String(row.facility_id), slotId: String(row.slot_id), trustState: 'unconfirmed', facilityType: input.facilityType, created: row.created === true };
    },
    async updateSellerFacilityContact(input: {
      authUserId: string;
      facilityId: string;
      contactPhone: string | null;
      contactWhatsapp: string | null;
    }): Promise<{ facilityId: string; contactPhone: string | null; contactWhatsapp: string | null }> {
      const contactValid = (v: string | null) => v === null || (v.trim().length >= 5 && v.trim().length <= 40);
      if (!contactValid(input.contactPhone) || !contactValid(input.contactWhatsapp)) {
        throw new SellerCataloguePolicyError('INVALID_INPUT');
      }
      const rows = await retryDatabase(() => sql`
        update v2_facilities f
        set contact_phone = ${input.contactPhone?.trim() || null},
            contact_whatsapp = ${input.contactWhatsapp?.trim() || null}
        from v2_accounts a
        where f.id = ${input.facilityId}::uuid
          and f.account_id = a.id
          and a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        returning f.id as facility_id, f.contact_phone, f.contact_whatsapp
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new SellerCataloguePolicyError('FORBIDDEN_OR_FACILITY_NOT_FOUND');
      return {
        facilityId: String(row.facility_id),
        contactPhone: row.contact_phone === null || row.contact_phone === undefined ? null : String(row.contact_phone),
        contactWhatsapp: row.contact_whatsapp === null || row.contact_whatsapp === undefined ? null : String(row.contact_whatsapp),
      };
    },
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
      const reviewerAccountId = String((authorizationRows as Record<string, unknown>[])[0].id);
      const rows = await retryDatabase(() => sql`
        -- R-3a (delibere) : lecture FACILITE pour la file de revue. Les demandes de revendication
        -- portent sur des imports sans entite (5/5 en base, entity_id NULL) : aucun miroir
        -- d'ecriture n'existe pour elles. Lire l'entite d'abord servirait un etat perime.
        select vr.id as request_id, vr.facility_id, f.name as facility_name, f.trust_state, f.latitude, f.longitude, f.zone, vr.state, vr.version, vr.created_at, vr.submitted_at,
          count(ve.id)::int as evidence_count, coalesce(array_agg(distinct ve.evidence_kind) filter (where ve.id is not null), '{}'::text[]) as evidence_kinds
        from v2_verification_requests vr
        join v2_facilities f on f.id = vr.facility_id
        left join v2_verification_evidence ve on ve.request_id = vr.id and ve.visibility in ('private', 'admin_only')
        where vr.state in ('submitted', 'admin_review')
          and (
            not exists (
              select 1 from v2_team_members tmz
              join v2_teams tz on tz.id = tmz.team_id and tz.zone is not null
              where tmz.account_id = ${reviewerAccountId}::uuid and tmz.status = 'active'
            )
            or exists (
              select 1 from v2_team_members tm
              join v2_teams t on t.id = tm.team_id and t.zone is not null and t.zone = f.zone
              where tm.account_id = ${reviewerAccountId}::uuid and tm.status = 'active'
            )
          )
        group by vr.id, f.id
        order by vr.submitted_at nulls last, vr.created_at asc, vr.id asc
        limit 100
      `);
      return { authorized: true, requests: (rows as Record<string, unknown>[]).map((row) => ({ requestId: String(row.request_id), facilityId: String(row.facility_id), facilityName: String(row.facility_name), facilityTrust: String(row.trust_state), latitude: Number(row.latitude), longitude: Number(row.longitude), state: String(row.state), version: Number(row.version), createdAt: new Date(String(row.created_at)).toISOString(), submittedAt: row.submitted_at === null ? null : new Date(String(row.submitted_at)).toISOString(), evidenceCount: Number(row.evidence_count ?? 0), evidenceKinds: Array.isArray(row.evidence_kinds) ? row.evidence_kinds.map(String) : [], zone: row.zone === null || row.zone === undefined ? null : String(row.zone) })) };
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
          returning f.id, f.entity_id, f.trust_state
        ), entity_update as (
          -- R-3b : S-30 veut la confiance sur l'ENTITE. Sans ce miroir, la colonne d'entite
          -- reste celle du backfill et sert une confiance perimee des la premiere transition.
          update v2_entities e
          set trust_state = facility_update.trust_state, updated_at = now()
          from facility_update
          where e.id = facility_update.entity_id
          returning e.id
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
        join v2_facilities f on f.account_id = candidate.id
        left join v2_entities e on e.id = f.entity_id
        where coalesce(e.trust_state, f.trust_state) in ('unconfirmed', 'confirmed', 'certified')
          and (
          not exists (
            select 1 from v2_team_members tmz
            join v2_teams tz on tz.id = tmz.team_id and tz.zone is not null
            where tmz.account_id = reviewer.id and tmz.status = 'active'
          )
          or exists (
            select 1 from v2_team_members tm
            join v2_teams t on t.id = tm.team_id and t.zone is not null and t.zone = f.zone
            where tm.account_id = reviewer.id and tm.status = 'active'
          )
        )
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
            and exists (
              select 1 from v2_facilities f
              left join v2_entities e on e.id = f.entity_id
              where f.account_id = a.id
                and coalesce(e.trust_state, f.trust_state) in ('unconfirmed', 'confirmed', 'certified')
            )
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
        select e.id, e.event_type, e.entity_type, e.entity_id, e.state, e.created_at, e.seen_at, e.payload
        from v2_notification_events e
        join v2_accounts a on a.id = e.recipient_account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        order by e.created_at desc, e.id desc
        limit 100
      `);
      return { notifications: (rows as Record<string, unknown>[]).map((row) => { const payload = row.payload && typeof row.payload === 'object' ? row.payload as Record<string, unknown> : {}; const outcome = payload.outcome; return { id: String(row.id), eventType: String(row.event_type), entityType: String(row.entity_type), entityId: String(row.entity_id), state: String(row.state), createdAt: new Date(String(row.created_at)).toISOString(), seenAt: row.seen_at === null ? null : new Date(String(row.seen_at)).toISOString(), ...(outcome === 'certified' || outcome === 'needs_more_evidence' || outcome === 'rejected' ? { reviewOutcome: outcome } : {}) }; }) };
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
    async listPublicFacilities(bounds?: [number, number, number, number], query?: string, category?: string, constraints?: { budgetMaxMinor?: number | null; quantiteMin?: number | null; rayonKm?: number | null; operationalState?: 'ouvert' | null }): Promise<PublicFacility[]> {
      return retryDatabase(async () => {
        const [west, south, east, north] = bounds ?? [-180, -90, 180, 90];
        const queryText = query?.trim() ?? '';
        const categoryText = category?.trim() ?? '';
        const budgetMaxMinor = constraints?.budgetMaxMinor ?? null;
        const quantiteMin = constraints?.quantiteMin ?? null;
        const rayonKm = constraints?.rayonKm ?? null;
        const operationalState = constraints?.operationalState ?? null;
        const centerLat = bounds ? (south + north) / 2 : null;
        const centerLng = bounds ? (west + east) / 2 : null;
        const rows = await sql`
          select
            f.id, f.name, f.category, f.address, f.latitude, f.longitude,
            coalesce(e.trust_state, f.trust_state) as trust_state,
            -- R-E (S-11) : l'entite derriere le lieu, pour que l'offre mene a son offreur.
            f.entity_id,
            coalesce(e.display_name, f.name) as entity_name,
            coalesce(e.kind, 'organisation') as entity_kind,
            -- R-4b : Pro vit sur l'ENTITE. La colonne commercial_plan n'est jamais remise a 'free'
            -- (aucun balayage d'expiration) : elle ne sert donc que d'indice. On affiche Pro seulement
            -- si la colonne le dit ET qu'un entitlement vivant le confirme — sinon un Pro echou
            -- s'afficherait 'pro_active' a vie.
            case
              when (coalesce(e.commercial_plan, 'free') = 'pro_active' or coalesce(f.commercial_plan, 'free') = 'pro_active')
                   and exists (
                     select 1 from v2_facility_entitlements fe
                     where fe.facility_id = f.id and fe.entitlement_kind = 'facility_pro'
                       and fe.state = 'active' and fe.ends_at > now()
                   ) then 'pro_active'
              when coalesce(e.commercial_plan, 'free') <> 'free' or coalesce(f.commercial_plan, 'free') <> 'free' then 'pro_expired'
              else 'free'
            end as commercial_plan,
            count(p.id)::int as product_count,
            (count(camp.id) > 0) as sponsored
          from v2_facilities f
          left join v2_entities e on e.id = f.entity_id
          left join v2_products p
            on p.facility_id = f.id and p.publication_state = 'published'
          left join v2_ad_campaigns camp
            on camp.facility_id = f.id
               and camp.status = 'active'
               and camp.starts_at <= now() and camp.ends_at > now()
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
            ${quantiteMin === null ? sql`` : sql`and exists (
              select 1 from v2_products avqp
              where avqp.facility_id = f.id
                and avqp.publication_state = 'published'
                and greatest(avqp.quantity_allocated_omni - avqp.quantity_reserved_omni, 0) >= ${quantiteMin}
            )`}
            ${budgetMaxMinor === null ? sql`` : sql`and exists (
              select 1 from v2_products bpp
              where bpp.facility_id = f.id
                and bpp.publication_state = 'published'
                and (bpp.price_minor - (case when bpp.discount_kind = 'percentage' and bpp.discount_value_minor between 1 and 90 then floor(bpp.price_minor * bpp.discount_value_minor / 100.0) else 0 end)) <= ${budgetMaxMinor}
            )`}
            ${centerLng === null || centerLat === null || rayonKm === null ? sql`` : sql`and (
              6371 * acos(
                least(1, cos(radians(${centerLat})) * cos(radians(f.latitude)) * cos(radians(f.longitude) - radians(${centerLng})) + sin(radians(${centerLat})) * sin(radians(f.latitude)))
              )
            ) <= ${rayonKm}`}
            ${operationalState === null ? sql`` : sql`and (f.operational_state = ${operationalState} or f.operational_state is null)`}
          group by f.id, e.id, e.trust_state
          order by (count(camp.id) > 0)::int desc, coalesce(e.trust_state, f.trust_state) = 'unclaimed', f.name
          limit 250
        `;
        return (rows as Record<string, unknown>[]).map(toFacility);
      });
    },

    async getFacilityDetail(id: string): Promise<FacilityDetail | null> {
      const facilities = await retryDatabase(() => sql`
        select
          f.id, f.name, f.category, f.address, f.latitude, f.longitude,
          coalesce(e.trust_state, f.trust_state) as trust_state, f.commercial_plan,
          f.entity_id,
          coalesce(e.display_name, f.name) as entity_name,
          coalesce(e.kind, 'organisation') as entity_kind,
          count(p.id)::int as product_count
        from v2_facilities f
        left join v2_entities e on e.id = f.entity_id
        left join v2_products p
          on p.facility_id = f.id and p.publication_state = 'published'
        where f.id = ${id}::uuid
        group by f.id, e.id, e.trust_state
        limit 1
      `);
      const row = (facilities as Record<string, unknown>[])[0];
      if (!row) return null;
      const products = await retryDatabase(() => sql`
        select p.id, p.facility_id, p.name, p.description, p.category, p.unit,
               p.price_minor, p.currency, p.discount_kind, p.discount_value_minor,
               p.quantity_allocated_omni, p.quantity_reserved_omni,
               p.position_kind, p.uniqueness_kind, p.handover_kind, p.price_kind, p.condition_kind,
               null::text as coupon_label
        from v2_products p
        join v2_facilities f on f.id = p.facility_id
        left join v2_entities e on e.id = coalesce(p.entity_id, f.entity_id)
        where p.facility_id = ${id}::uuid
          and p.publication_state = 'published'
          and coalesce(e.trust_state, f.trust_state) in ('certified', 'unconfirmed', 'confirmed')
        order by p.name
      `);
      return { ...toFacility(row), products: (products as Record<string, unknown>[]).map(toProduct) };
    },

    /**
     * R-E (S-11) — level ENTITY: find an OFFERER by its identity.
     * Public read (D-05: browsing needs no account). Never returns contact (E-2),
     * and never filters on offer constraints (E-5) — those belong to the offer level.
     */
    async searchPublicEntities(query?: string): Promise<PublicEntity[]> {
      const queryText = query?.trim() ?? '';
      const rows = await retryDatabase(() => sql`
        select
          e.id,
          e.display_name as name,
          e.kind,
          e.trust_state as trust_state,
          f.category,
          f.address,
          f.latitude,
          f.longitude,
          count(p.id)::int as offer_count,
          min(p.price_minor)::int as min_price_minor,
          min(p.currency) as currency
        from v2_entities e
        -- The entity's principal place is only "where"; a digital entity has none.
        left join lateral (
          select pf.id, pf.category, pf.address, pf.latitude, pf.longitude
          from v2_facilities pf
          where pf.entity_id = e.id
          order by pf.created_at asc
          limit 1
        ) f on true
        left join v2_products p
          on p.entity_id = e.id and p.publication_state = 'published'
        where e.trust_state in ('unconfirmed', 'confirmed', 'certified')
          and (${queryText} = '' or e.display_name ilike '%' || ${queryText} || '%')
        group by e.id, e.display_name, e.kind, e.trust_state, f.category, f.address, f.latitude, f.longitude
        order by e.trust_state = 'certified' desc, count(p.id) desc, e.display_name
        limit 100
      `);
      return (rows as Record<string, unknown>[]).map(toEntity);
    },

    /** R-E (S-11) — the entity's public page: identity + its published offers. No contact. */
    async getPublicEntity(id: string): Promise<PublicEntityDetail | null> {
      const rows = await retryDatabase(() => sql`
        select
          e.id,
          e.display_name as name,
          e.kind,
          e.trust_state as trust_state,
          f.category,
          f.address,
          f.latitude,
          f.longitude,
          count(p.id)::int as offer_count,
          min(p.price_minor)::int as min_price_minor,
          min(p.currency) as currency
        from v2_entities e
        left join lateral (
          select pf.id, pf.category, pf.address, pf.latitude, pf.longitude
          from v2_facilities pf
          where pf.entity_id = e.id
          order by pf.created_at asc
          limit 1
        ) f on true
        left join v2_products p
          on p.entity_id = e.id and p.publication_state = 'published'
        where e.id = ${id}::uuid
          and e.trust_state in ('unconfirmed', 'confirmed', 'certified')
        group by e.id, e.display_name, e.kind, e.trust_state, f.category, f.address, f.latitude, f.longitude
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return null;
      const offers = await retryDatabase(() => sql`
        select p.id, p.facility_id, p.name, p.description, p.category, p.unit,
               p.price_minor, p.currency, p.discount_kind, p.discount_value_minor,
               p.quantity_allocated_omni, p.quantity_reserved_omni,
               p.position_kind, p.uniqueness_kind, p.handover_kind, p.price_kind, p.condition_kind,
               null::text as coupon_label
        from v2_products p
        join v2_entities e on e.id = p.entity_id
        where p.entity_id = ${id}::uuid
          and p.publication_state = 'published'
          and e.trust_state in ('unconfirmed', 'confirmed', 'certified')
        order by p.name
      `);
      return { ...toEntity(row), offers: (offers as Record<string, unknown>[]).map(toProduct) };
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

    async listSellerCatalogue(input: { authUserId: string }): Promise<{ authorized: boolean; catalogReady: boolean; facilities: SellerCatalogueFacility[]; products: SellerCatalogueProduct[] }> {
      // D-03: opportunistic freshness expiry (deterministic auto-transition, facility_pro only)
      await retryDatabase(() => sql`select v2_expire_stale_availability()`).catch(() => [] as unknown[]);
      const authorizationRows = await retryDatabase(() => sql`
        select a.id
        from v2_accounts a
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        limit 1
      `);
      if (!(authorizationRows as Record<string, unknown>[])[0]) return { authorized: false, catalogReady: false, facilities: [], products: [] };
      const facilityRows = await retryDatabase(() => sql`
        select
          f.id,
          f.name,
          coalesce(f.category, 'Autre') as category,
          f.address,
          f.operational_state,
          f.facility_type,
          f.rayon_km,
          coalesce(e.trust_state, f.trust_state) as trust_state,
          f.contact_phone,
          f.contact_whatsapp,
          'XOF' as currency,
          count(p.id)::int as product_count
        from v2_facilities f
        left join v2_entities e on e.id = f.entity_id
        join v2_accounts a on a.id = f.account_id
        join v2_facility_slots fs on fs.facility_id = f.id and fs.account_id = a.id and fs.status = 'assigned'
        left join v2_products p on p.facility_id = f.id and p.publication_state <> 'archived'
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        group by f.id, e.trust_state
        order by f.name asc, f.id asc
      `);
      const facilities = (facilityRows as Record<string, unknown>[]).map((row) => ({
        id: String(row.id),
        name: String(row.name),
        category: String(row.category),
        address: row.address === null ? null : String(row.address),
        currency: String(row.currency),
        slotState: 'active' as const,
        operationalState: (['ouvert', 'ferme', 'temporairement_indisponible'].includes(String(row.operational_state)) ? String(row.operational_state) : 'ouvert') as SellerCatalogueFacility['operationalState'],
        productCount: Number(row.product_count ?? 0),
        facilityType: (row.facility_type === 'fixe' || row.facility_type === 'mobile' || row.facility_type === 'digital' ? String(row.facility_type) : null) as SellerCatalogueFacility['facilityType'],
        rayonKm: row.rayon_km === null ? null : Number(row.rayon_km),
        trustState: String(row.trust_state ?? 'unclaimed'),
        contactPhone: row.contact_phone === null || row.contact_phone === undefined ? null : String(row.contact_phone),
        contactWhatsapp: row.contact_whatsapp === null || row.contact_whatsapp === undefined ? null : String(row.contact_whatsapp),
      }));
      const rows = await retryDatabase(() => sql`
        select
          p.id,
          e.id as entity_id,
          e.display_name as entity_name,
          p.facility_id,
          f.name as facility_name,
          p.name,
          p.description,
          p.unit,
          p.price_minor,
          p.currency,
          p.discount_kind,
          p.discount_value_minor,
          p.quantity_allocated_omni,
          p.quantity_reserved_omni,
          case
            when p.discount_kind = 'percentage' and p.discount_value_minor between 1 and 90
              then p.price_minor - floor((p.price_minor * p.discount_value_minor) / 100.0)
            when p.discount_kind = 'fixed' and p.discount_value_minor > 0 and p.discount_value_minor < p.price_minor
              then p.price_minor - p.discount_value_minor
            else null
          end as net_price_minor,
          p.publication_state,
          p.availability_state,
          p.availability_expires_at,
          p.position_kind,
          p.uniqueness_kind,
          p.handover_kind,
          p.price_kind,
          p.condition_kind,
          (coalesce(e.commercial_plan, 'free') = 'pro_active' or coalesce(f.commercial_plan, 'free') = 'pro_active' or exists (
            select 1 from v2_facility_entitlements fe
            where f.id is not null
              and fe.entitlement_kind = 'facility_pro' and fe.state = 'active'
              -- Un entitlement n'est jamais bascule a 'expired' en base : sans ce test de date,
              -- un Pro echou resterait eligible a vie (contournement D-04).
              and fe.ends_at > now()
              and (fe.facility_id = f.id or (fe.entity_id is not null and fe.entity_id = e.id))
          )) as availability_pro_eligible
        from v2_products p
        left join v2_facilities f on f.id = p.facility_id
        join v2_entities e on e.id = coalesce(p.entity_id, f.entity_id)
        join v2_accounts a on a.id = e.account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and a.onboarding_state = 'seller_ready'
        order by coalesce(e.display_name, p.name) asc, p.updated_at desc, p.id desc
      `);
      const products = (rows as Record<string, unknown>[]).map((row) => ({
        id: String(row.id),
        entityId: String(row.entity_id),
        entityName: String(row.entity_name),
        facilityId: row.facility_id === null || row.facility_id === undefined ? null : String(row.facility_id),
        facilityName: row.facility_name === null || row.facility_name === undefined ? null : String(row.facility_name),
        name: String(row.name),
        description: row.description === null ? null : String(row.description),
        unit: String(row.unit),
        currency: String(row.currency),
        stockLoueOmni: row.quantity_allocated_omni === null || row.quantity_allocated_omni === undefined ? 0 : Math.max(0, Number(row.quantity_allocated_omni) - Number(row.quantity_reserved_omni ?? 0)),
        prixOriginal: Number(row.price_minor),
        prixReduit: row.net_price_minor === null || row.net_price_minor === undefined ? Number(row.price_minor) : Number(row.net_price_minor),
        pourcentageReduction: row.discount_kind === 'percentage' ? Math.round(Number(row.discount_value_minor ?? 0)) : 0,
        publicationState: String(row.publication_state) as SellerCatalogueProduct['publicationState'],
        availabilityState: (['en_stock', 'verifie', 'a_valider', 'bientot'].includes(String(row.availability_state)) ? String(row.availability_state) : 'a_valider') as SellerCatalogueProduct['availabilityState'],
        availabilityExpiresAt: row.availability_expires_at === null || row.availability_expires_at === undefined ? null : new Date(String(row.availability_expires_at)).toISOString(),
        availabilityProEligible: row.availability_pro_eligible === true,
        positionKind: (OFFER_POSITION_KINDS as readonly string[]).includes(String(row.position_kind)) ? String(row.position_kind) as SellerCatalogueProduct['positionKind'] : null,
        uniquenessKind: (OFFER_UNIQUENESS_KINDS as readonly string[]).includes(String(row.uniqueness_kind)) ? String(row.uniqueness_kind) as SellerCatalogueProduct['uniquenessKind'] : null,
        handoverKind: (OFFER_HANDOVER_KINDS as readonly string[]).includes(String(row.handover_kind)) ? String(row.handover_kind) as SellerCatalogueProduct['handoverKind'] : null,
        priceKind: (OFFER_PRICE_KINDS as readonly string[]).includes(String(row.price_kind)) ? String(row.price_kind) as SellerCatalogueProduct['priceKind'] : null,
        conditionKind: (OFFER_CONDITION_KINDS as readonly string[]).includes(String(row.condition_kind)) ? String(row.condition_kind) as SellerCatalogueProduct['conditionKind'] : null,
      }));
            const catalogReady = products.length > 0 && products.some((p) => (p.stockLoueOmni ?? 0) > 0);
            return { authorized: true, facilities, products, catalogReady };
    },
    async createSellerProductDraft(input: {
      authUserId: string;
      facilityId: string;
      name: string;
      description: string | null;
      unit: string;
      prixOriginal: number;
      currency: string;
      pourcentageReduction: number;
      stockLoueOmni: number;
      idempotencyKey: string;
      positionKind?: string | null;
      uniquenessKind?: string | null;
      handoverKind?: string | null;
      priceKind?: string | null;
      conditionKind?: string | null;
    }): Promise<{ productId: string; facilityId: string; publicationState: 'draft'; prixReduit: number }> {
      if (!input.name.trim() || input.name.trim().length > 180 || !Number.isInteger(input.prixOriginal) || input.prixOriginal <= 0 || !Number.isInteger(input.pourcentageReduction) || input.pourcentageReduction < 1 || input.pourcentageReduction > 90 || !Number.isInteger(input.stockLoueOmni) || input.stockLoueOmni < 0) {
        throw new SellerCataloguePolicyError('INVALID_INPUT');
      }
      // S-01 — the offer's characteristics are the day-1 model: an offer IS described by them,
      // not by a separate "type". Validated here (not only at the HTTP edge) so the repository
      // cannot be driven around by an internal caller.
      const carac = normalizeOfferCharacteristics(input);
      const discount = Math.floor(input.prixOriginal * input.pourcentageReduction / 100);
      const rows = await retryDatabase(() => sql`
        with seller as (
          select a.id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and a.onboarding_state = 'seller_ready'
        ), owned_facility as (
          select f.id, f.commercial_plan, e.id as entity_id
          from v2_facilities f
          join seller s on s.id = f.account_id
          left join v2_entities e on e.id = f.entity_id or (e.account_id = f.account_id and e.display_name = f.name)
          where f.id = ${input.facilityId}::uuid
        ), slot_check as (
          select 1
          from v2_facility_slots fs
          join seller s on s.id = fs.account_id
          where fs.facility_id = ${input.facilityId}::uuid
            and fs.status = 'assigned'
        ), inserted as (
          insert into v2_products
            (facility_id, entity_id, name, description, unit, price_minor, currency, discount_kind, discount_value_minor, quantity_allocated_omni, idempotency_key, publication_state,
             position_kind, uniqueness_kind, handover_kind, price_kind, condition_kind)
          select of.id, of.entity_id, ${input.name.trim()}, ${input.description?.trim() || null}, ${input.unit.trim() || 'unit'}, ${input.prixOriginal}, ${input.currency.toUpperCase()}, 'percentage', ${input.pourcentageReduction}, ${input.stockLoueOmni}, ${input.idempotencyKey}, 'draft',
                 ${carac.positionKind}, ${carac.uniquenessKind}, ${carac.handoverKind}, ${carac.priceKind}, ${carac.conditionKind}
          from owned_facility of
          where exists (select 1 from slot_check)
          on conflict (facility_id, idempotency_key) where idempotency_key is not null do nothing
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
      if (String(row.discount_kind) !== 'percentage' || Number(row.discount_value_minor) !== input.pourcentageReduction || String(row.name ?? input.name) !== input.name.trim()) throw new SellerCataloguePolicyError('IDEMPOTENCY_CONFLICT');
      return { productId: String(row.id), facilityId: String(row.facility_id), publicationState: 'draft', prixReduit: input.prixOriginal - discount };
    },

    async updateSellerProductDraft(input: {
      authUserId: string;
      productId: string;
      name: string;
      description: string | null;
      unit: string;
      prixOriginal: number;
      currency: string;
      pourcentageReduction: number;
      stockLoueOmni: number;
      positionKind?: string | null;
      uniquenessKind?: string | null;
      handoverKind?: string | null;
      priceKind?: string | null;
      conditionKind?: string | null;
    }): Promise<{ productId: string; publicationState: 'draft'; prixReduit: number }> {
      if (!input.name.trim() || input.name.trim().length > 180 || !Number.isInteger(input.prixOriginal) || input.prixOriginal <= 0 || !Number.isInteger(input.pourcentageReduction) || input.pourcentageReduction < 1 || input.pourcentageReduction > 90 || !Number.isInteger(input.stockLoueOmni) || input.stockLoueOmni < 0) throw new SellerCataloguePolicyError('INVALID_INPUT');
      const carac = normalizeOfferCharacteristics(input);
      const discount = Math.floor(input.prixOriginal * input.pourcentageReduction / 100);
      const rows = await retryDatabase(() => sql`
        update v2_products p
        set name = ${input.name.trim()}, description = ${input.description?.trim() || null}, unit = ${input.unit.trim() || 'unit'}, price_minor = ${input.prixOriginal}, currency = ${input.currency.toUpperCase()}, discount_kind = 'percentage', discount_value_minor = ${input.pourcentageReduction}, quantity_allocated_omni = ${input.stockLoueOmni},
            position_kind = ${carac.positionKind}, uniqueness_kind = ${carac.uniquenessKind}, handover_kind = ${carac.handoverKind}, price_kind = ${carac.priceKind}, condition_kind = ${carac.conditionKind},
            publication_state = case when p.publication_state = 'published' then 'draft' else p.publication_state end, updated_at = now()
        from v2_facilities f join v2_accounts a on a.id = f.account_id
        where p.id = ${input.productId}::uuid and p.facility_id = f.id
          and a.auth_user_id = ${input.authUserId} and a.suspended_at is null and a.onboarding_state = 'seller_ready'
          and p.publication_state in ('draft', 'published')
        returning p.id, p.publication_state
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new SellerCataloguePolicyError('FORBIDDEN_OR_NOT_EDITABLE');
      return { productId: String(row.id), publicationState: 'draft', prixReduit: input.prixOriginal - discount };
    },

    async transitionSellerProduct(input: { authUserId: string; productId: string; to: 'published' | 'archived' }): Promise<{ productId: string; publicationState: 'published' | 'archived' }> {
      const rows = await retryDatabase(() => sql`
        with owned as (
          select p.id, p.facility_id, p.publication_state,
            -- R-4b / D-04 : la capacite Pro se juge sur l'ENTITLEMENT VIVANT (ce qui encode la fenetre
            -- payee), jamais sur la colonne commercial_plan — jamais remise a 'free', aucun balayage.
            -- Avant, cette porte lisait e.commercial_plan SEUL, colonne que rien n'alimentait :
            -- un vendeur Pro PAYANT ne pouvait jamais depasser le plafond gratuit (bug de revenu).
            exists (
              select 1 from v2_facility_entitlements fe
              where fe.entitlement_kind = 'facility_pro' and fe.state = 'active' and fe.ends_at > now()
                and (fe.facility_id = p.facility_id
                     or (fe.entity_id is not null and fe.entity_id = coalesce(p.entity_id, f.entity_id)))
            ) as is_pro
          from v2_products p
          left join v2_facilities f on f.id = p.facility_id
          join v2_entities e on e.id = coalesce(p.entity_id, f.entity_id)
          join v2_accounts a on a.id = e.account_id
          where p.id = ${input.productId}::uuid and a.auth_user_id = ${input.authUserId} and a.suspended_at is null and a.onboarding_state = 'seller_ready'
        ), published_count as (
          -- Le décompte se fait par entite (S-25). Si le produit n'a PAS d'entite — cas d'une
          -- facilite creee apres R-1, jamais liee — null = null vaut NULL en SQL, donc le
          -- decompte valait 0 et le plafond etait contourne. Repli explicite sur le lieu :
          -- sans entite, le lieu EST le perimetre (comportement historique, sur).
          select count(*)::int as count
          from v2_products p
          left join v2_facilities f on f.id = p.facility_id
          where (
              coalesce(p.entity_id, f.entity_id) = (select coalesce(p2.entity_id, f2.entity_id) from v2_products p2 left join v2_facilities f2 on f2.id = p2.facility_id where p2.id = (select id from owned))
            or (
              (select coalesce(p2.entity_id, f2.entity_id) from v2_products p2 left join v2_facilities f2 on f2.id = p2.facility_id where p2.id = (select id from owned)) is null
              and p.facility_id = (select facility_id from owned)
            )
          )
            and p.publication_state = 'published'
        ), changed as (
          update v2_products p set publication_state = ${input.to}, updated_at = now()
          where p.id = (select id from owned)
            and ((select publication_state from owned) = 'draft' and ${input.to} = 'published' and ((select is_pro from owned) or (select count from published_count) < ${FREE_OFFER_LIMIT}))
              or ((select publication_state from owned) = 'published' and ${input.to} = 'archived')
          returning p.id, p.publication_state
        ) select * from changed
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new SellerCataloguePolicyError('FORBIDDEN_OR_LIMIT_REACHED');
      return { productId: String(row.id), publicationState: String(row.publication_state) as 'published' | 'archived' };
    },

    async setProductAvailability(input: { authUserId: string; productId: string; to: 'en_stock' | 'verifie' | 'a_valider' | 'bientot'; expiresInHours: number | null }): Promise<{ productId: string; availabilityState: string; previousState: string | null }> {
      if (!['en_stock', 'verifie', 'a_valider', 'bientot'].includes(input.to)) throw new SellerCataloguePolicyError('INVALID_INPUT');
      if (input.expiresInHours !== null && (!Number.isInteger(input.expiresInHours) || input.expiresInHours < 1 || input.expiresInHours > 720)) throw new SellerCataloguePolicyError('INVALID_INPUT');
      const rows = await retryDatabase(() => sql`
        with owned as (
          select p.id, p.availability_state as from_state, a.id as account_id
          from v2_products p
          left join v2_facilities f on f.id = p.facility_id
          join v2_entities e on e.id = coalesce(p.entity_id, f.entity_id)
          join v2_accounts a on a.id = e.account_id
          where p.id = ${input.productId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and a.onboarding_state in ('seller_ready', 'complete')
            and p.publication_state in ('draft', 'published')
            -- D-04 : la capacite Pro se juge sur l'ENTITLEMENT VIVANT, pas sur la colonne
            -- commercial_plan (qui n'est jamais remise a 'free' et n'a aucun balayage d'expiration).
            -- Lire la colonne ici accorderait un Pro a vie.
            and exists (
              select 1 from v2_facility_entitlements fe
              where f.id is not null and fe.entitlement_kind = 'facility_pro'
                and fe.state = 'active' and fe.ends_at > now()
                and (fe.facility_id = f.id or (fe.entity_id is not null and fe.entity_id = e.id))
            )
        ), changed as (
          update v2_products p
          set availability_state = ${input.to},
              availability_updated_at = now(),
              availability_expires_at = case when ${input.expiresInHours}::int is null then null else now() + make_interval(hours => ${input.expiresInHours}::int) end
          from owned
          where p.id = owned.id
          returning p.id, owned.from_state, owned.account_id
        ), logged as (
          insert into v2_product_stock_events (product_id, from_state, to_state, source, actor_account_id, reason)
          select id, from_state, ${input.to}, 'manual', account_id, null from changed
          returning product_id
        )
        select id, from_state from changed
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new SellerCataloguePolicyError('FORBIDDEN_OR_PRO_REQUIRED');
      return { productId: String(row.id), availabilityState: input.to, previousState: row.from_state === null ? null : String(row.from_state) };
    },

    async listProductStockEvents(input: { authUserId: string; productId: string }): Promise<{ authorized: boolean; events: Array<{ id: string; fromState: string | null; toState: string; source: 'auto' | 'manual'; reason: string | null; createdAt: string }> }> {
      const rows = await retryDatabase(() => sql`
        select e2.id, e2.from_state, e2.to_state, e2.source, e2.reason, e2.created_at
        from v2_product_stock_events e2
        join v2_products p on p.id = e2.product_id
        left join v2_facilities f on f.id = p.facility_id
        join v2_entities en on en.id = coalesce(p.entity_id, f.entity_id)
        join v2_accounts a on a.id = en.account_id
        where e2.product_id = ${input.productId}::uuid
          and a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        order by e2.created_at desc, e2.id desc
        limit 50
      `);
      return {
        authorized: true,
        events: (rows as Record<string, unknown>[]).map((row) => ({
          id: String(row.id),
          fromState: row.from_state === null ? null : String(row.from_state),
          toState: String(row.to_state),
          source: (String(row.source) === 'auto' ? 'auto' : 'manual') as 'auto' | 'manual',
          reason: row.reason === null ? null : String(row.reason),
          createdAt: new Date(String(row.created_at)).toISOString(),
        })),
      };
    },

    async listSavedSearches(input: { authUserId: string }): Promise<{ searches: Array<{ id: string; query: string; constraints: Record<string, unknown>; active: boolean; createdAt: string }> }> {
      const rows = await retryDatabase(() => sql`
        select s.id, s.query, s.constraints, s.active, s.created_at
        from v2_saved_searches s
        join v2_accounts a on a.id = s.account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and s.active = true
        order by s.created_at desc, s.id desc
        limit 50
      `);
      return {
        searches: (rows as Record<string, unknown>[]).map((row) => ({
          id: String(row.id),
          query: String(row.query),
          constraints: (typeof row.constraints === 'object' && row.constraints !== null ? row.constraints : {}) as Record<string, unknown>,
          active: row.active === true,
          createdAt: new Date(String(row.created_at)).toISOString(),
        })),
      };
    },

    async createSavedSearch(input: { authUserId: string; query: string; constraints: Record<string, unknown> }): Promise<{ id: string; query: string; createdAt: string }> {
      const query = input.query.trim();
      if (!query || query.length > 200) throw new BuyerSearchPolicyError('INVALID_INPUT');
      const rows = await retryDatabase(() => sql`
        insert into v2_saved_searches (account_id, query, constraints)
        select a.id, ${query}, ${JSON.stringify(input.constraints ?? {})}::jsonb
        from v2_accounts a
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        returning id, query, created_at
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new BuyerSearchPolicyError('ACCOUNT_UNAVAILABLE');
      return { id: String(row.id), query: String(row.query), createdAt: new Date(String(row.created_at)).toISOString() };
    },

    async deleteSavedSearch(input: { authUserId: string; searchId: string }): Promise<{ deleted: true }> {
      const rows = await retryDatabase(() => sql`
        update v2_saved_searches s
        set active = false, updated_at = now()
        from v2_accounts a
        where s.id = ${input.searchId}::uuid
          and a.id = s.account_id
          and a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and s.active = true
        returning s.id
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new BuyerSearchPolicyError('NOT_FOUND');
      return { deleted: true };
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
          coalesce(e.trust_state, f.trust_state) as facility_trust,
          -- R-4b : colonne = indice, entitlement vivant = verite (la colonne ne se remet jamais a 'free').
          case
            when (coalesce(e.commercial_plan, 'free') = 'pro_active' or coalesce(f.commercial_plan, 'free') = 'pro_active')
                 and exists (
                   select 1 from v2_facility_entitlements fe
                   where fe.facility_id = f.id and fe.entitlement_kind = 'facility_pro'
                     and fe.state = 'active' and fe.ends_at > now()
                 ) then 'pro_active'
            when coalesce(e.commercial_plan, 'free') <> 'free' or coalesce(f.commercial_plan, 'free') <> 'free' then 'pro_expired'
            else 'free'
          end as facility_plan,
          p.id as product_id,
          p.name as product_name,
          r.requested_quantity,
          r.budget_mode,
          r.budget_minor,
          r.delivery_mode,
          r.request_note,
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
        left join v2_entities e on e.id = f.entity_id
        join v2_products p on p.id = r.product_id and p.facility_id = f.id and p.publication_state = 'published'
        left join v2_availability_responses ar
          on ar.request_id = r.id
         and ar.facility_id = f.id
         and ar.responder_account_id = ${sellerAccountId}::uuid
        where r.status <> 'cancelled' and (r.expires_at > now() or ar.id is not null)
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
          deliveryMode: row.delivery_mode as 'retrait' | 'livraison',
          requestNote: row.request_note === null ? null : String(row.request_note),
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
      deliveryMode: 'retrait' | 'livraison';
      note: string | null;
      requestStatus: AvailabilityResponsesResult['requestStatus'];
      createdAt: string;
      expiresAt: string;
      responseCount: number;
      latitude: number;
      longitude: number;
    }> }> {
      const rows = await retryDatabase(() => sql`
        select
          r.id,
          f.id as facility_id,
          f.name as facility_name,
          f.category as facility_category,
          f.latitude as facility_latitude,
          f.longitude as facility_longitude,
          p.id as product_id,
          p.name as product_name,
          r.requested_quantity,
          r.budget_mode,
          r.budget_minor,
          r.delivery_mode,
          r.request_note,
          r.created_at,
          r.expires_at,
          count(ar.id)::int as response_count,
          case
            when r.status = 'cancelled' then 'cancelled'
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
          deliveryMode: row.delivery_mode as 'retrait' | 'livraison',
          note: row.request_note === null ? null : String(row.request_note),
          requestStatus: row.request_status as AvailabilityResponsesResult['requestStatus'],
          createdAt: new Date(String(row.created_at)).toISOString(),
          expiresAt: new Date(String(row.expires_at)).toISOString(),
          responseCount: Number(row.response_count),
          latitude: Number(row.facility_latitude),
          longitude: Number(row.facility_longitude),
        })),
      };
    },

    // FF-4 — l'acheteur annule sa PROPRE demande de dispo tant que rien n'est engagé.
    // Phase A uniquement : refusé si une intention d'achat existe (le verrou est pris),
    // si la demande est déjà annulée/expirée, ou si elle n'appartient pas à l'appelant.
    // Aucun effet monétaire : la vérification manuelle est gratuite.
    async cancelAvailabilityRequest(input: { authUserId: string; requestId: string }): Promise<CancelAvailabilityRequestResult> {
      const rows = await retryDatabase(() => sql`
        with owned as (
          select r.id, r.status, r.expires_at
          from v2_availability_requests r
          join v2_accounts a on a.id = r.buyer_account_id
          where r.id = ${input.requestId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ),
        locked as (
          select 1
          from v2_purchase_intents pi
          join v2_availability_responses ar on ar.id = pi.response_id
          join owned o on o.id = ar.request_id
          limit 1
        ),
        cancelled as (
          update v2_availability_requests r
            set status = 'cancelled'
          where r.id = (select id from owned)
            and r.status in ('draft', 'submitted', 'responding')
            and r.expires_at > now()
            and not exists (select 1 from locked)
          returning r.id, r.status
        )
        select id, status from cancelled
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) {
        throw new AvailabilityPolicyError("Cette demande ne peut pas être annulée : elle est déjà engagée, expirée ou introuvable.");
      }
      return { requestId: String(row.id), status: 'cancelled', cancelled: true };
    },

    async getAvailabilityResponses(input: { authUserId: string; requestId: string }): Promise<AvailabilityResponsesResult> {
      const rows = await retryDatabase(() => sql`
        with buyer_request as (
          select r.id, r.product_id, r.facility_scope[1] as facility_id, r.expires_at, r.status, r.delivery_mode, r.request_note
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
          br.delivery_mode,
          br.request_note,
          ar.id as response_id,
          ar.facility_id as response_facility_id,
          f.name as facility_name,
          f.category as facility_category,
          p.name as product_name,
          ar.status as response_status,
          ar.quantity_available,
          ar.price_minor,
          coalesce(ar.offer_snapshot ->> 'currency', 'XOF') as currency,
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
          currency: String(row.currency ?? 'XOF'),
          sellerMessage: row.seller_message === null ? null : String(row.seller_message),
          observedAt: new Date(String(row.observed_at)).toISOString(),
          freshness: String(row.freshness) as AvailabilityResponsesResult['responses'][number]['freshness'],
        }));
      const requestStatus: AvailabilityResponsesResult['requestStatus'] = String(first.request_status) === 'cancelled'
        ? 'cancelled'
        : responses.length > 0
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
        deliveryMode: String(first.delivery_mode) as 'retrait' | 'livraison',
        note: first.request_note === null ? null : String(first.request_note),
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
              order by e.created_at desc, e.state_rank desc
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
      if (!['cash', 'mobile_money'].includes(input.method)) {
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
              order by e.created_at desc, e.state_rank desc
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
            coalesce((select e.state from v2_transaction_events e where e.transaction_id = s.transaction_id order by e.created_at desc, e.state_rank desc limit 1), 'intent_created') as current_state
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
        ),
        -- La notation insérée n'est pas visible par un simple re-scan de
        -- v2_ratings dans la même instruction (sémantique de snapshot Postgres).
        -- On reprend donc la ligne via le RETURNING, sinon le premier appel
        -- échouerait tout en ayant persisté la notation.
        rating_present as (
          select id, transaction_id, score, note from inserted_rating
          union all
          select r.id, r.transaction_id, r.score, r.note
          from v2_ratings r
          join eligible e on e.transaction_id = r.transaction_id
          where not exists (select 1 from inserted_rating)
        ),
        rated_event as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
          select e.transaction_id, e.actor_account_id, 'rated', jsonb_build_object('score', r.score), ${input.now}::timestamptz
          from eligible e
          join rating_present r on r.transaction_id = e.transaction_id
          where e.current_state = 'received'
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        ),
        closed_event as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
          select e.transaction_id, e.actor_account_id, 'closed', jsonb_build_object('reason', 'buyer_rating_completed'), ${input.now}::timestamptz
          from eligible e
          join rating_present r on r.transaction_id = e.transaction_id
          where e.current_state in ('received', 'rated')
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        ),
        unlock_progress as (
          insert into v2_seller_unlock_progress (facility_id, buyer_account_id, first_sale_at)
          select s.facility_id, e.actor_account_id, ${input.now}::timestamptz
          from v2_transaction_snapshots s
          join closed_event c on c.transaction_id = s.transaction_id
          join locked e on e.transaction_id = c.transaction_id
          on conflict (facility_id, buyer_account_id) do nothing
          returning facility_id
        ),
        unlock_counts as (
          select p.facility_id, count(*)::int as distinct_buyers
          from v2_seller_unlock_progress p
          where p.facility_id in (select facility_id from unlock_progress)
          group by p.facility_id
        ),
        -- D-C6 / S-14 : le seuil vient du VOLUME de l'offreur. Un particulier (entité 'individu')
        -- est confirmé par 1 acheteur distinct ; un commerce en demande 3. Seuil inconnu => 3.
        unlock_thresholds as (
          select uc.facility_id, uc.distinct_buyers,
                 case when e.kind = 'individu' then ${INDIVIDUAL_CONFIRMED_SALES_THRESHOLD} else ${CONFIRMED_SALES_THRESHOLD} end as threshold
          from unlock_counts uc
          join v2_facilities f on f.id = uc.facility_id
          left join v2_entities e on e.id = f.entity_id
        ),
        qualified_facility as (
          update v2_facilities f
          set qualifying_sales = least(ut.threshold, ut.distinct_buyers),
              trust_state = case when ut.distinct_buyers >= ut.threshold then 'confirmed' else f.trust_state end,
              bonus_unlocked_at = case when ut.distinct_buyers >= ut.threshold then ${input.now}::timestamptz else f.bonus_unlocked_at end,
              updated_at = ${input.now}::timestamptz
          from unlock_thresholds ut
          where f.id = ut.facility_id
          returning f.id as facility_id, f.account_id, f.qualifying_sales, f.entity_id, f.trust_state
        ),
        entity_qualified as (
          -- R-3b : la confiance et le compteur montent AUSSI sur l'entite (S-30).
          update v2_entities e
          set qualifying_sales = q.qualifying_sales, trust_state = q.trust_state, updated_at = ${input.now}::timestamptz
          from qualified_facility q
          where e.id = q.entity_id
          returning e.id
        ),
        bonus_wallet as (
          select q.facility_id, q.account_id, w.id as wallet_id
          from qualified_facility q
          join unlock_thresholds ut on ut.facility_id = q.facility_id
          join v2_wallets w on w.account_id = q.account_id
          where ut.distinct_buyers >= ut.threshold
        ),
        bonus_grant as (
          insert into v2_wallet_ledger_entries
            (wallet_id, kind, amount_minor, status, reference, facility_id, created_at, confirmed_at)
          select bw.wallet_id, 'bonus_grant', 10000, 'confirmed', 'facility-bonus:' || bw.facility_id::text, bw.facility_id, ${input.now}::timestamptz, ${input.now}::timestamptz
          from bonus_wallet bw
          on conflict (wallet_id, kind, reference) do nothing
          returning id, facility_id
        ),
        unlock_object as (
          insert into v2_seller_unlocks (facility_id, unlock_type, distinct_buyer_count, required_count, status, updated_at)
          select ut.facility_id, 'pro_test_credit_20_usd', ut.distinct_buyers, ut.threshold,
                 case when exists (select 1 from bonus_grant bg where bg.facility_id = ut.facility_id) then 'granted'
                      when ut.distinct_buyers >= ut.threshold then 'eligible'
                      else 'locked' end,
                 ${input.now}::timestamptz
          from unlock_thresholds ut
          on conflict (facility_id, unlock_type) do update
            set distinct_buyer_count = excluded.distinct_buyer_count,
                required_count = excluded.required_count,
                status = case when v2_seller_unlocks.status = 'granted' then 'granted'
                              when excluded.distinct_buyer_count >= (
                                select case when e.kind = 'individu' then ${INDIVIDUAL_CONFIRMED_SALES_THRESHOLD} else ${CONFIRMED_SALES_THRESHOLD} end
                                from v2_facilities f
                                left join v2_entities e on e.id = f.entity_id
                                where f.id = excluded.facility_id
                              ) then 'eligible'
                              else 'locked' end,
                granted_at = case when v2_seller_unlocks.status <> 'granted'
                                   and exists (select 1 from bonus_grant bg where bg.facility_id = excluded.facility_id)
                                   then ${input.now}::timestamptz
                                   else v2_seller_unlocks.granted_at end,
                updated_at = excluded.updated_at
          returning facility_id
        ),
        audited as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select e.actor_account_id, 'transaction_rated', 'transaction', e.transaction_id::text, ${input.correlationId}, 'buyer_submitted_rating', ${input.now}::timestamptz
          from eligible e
          where e.current_state in ('received', 'rated')
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        ),
        intent_completed as (
          update v2_purchase_intents pi
          set state = 'completed'
          from closed_event c
          join v2_transaction_snapshots s on s.transaction_id = c.transaction_id
          where pi.id = s.intent_id
            and pi.state <> 'completed'
          returning pi.id
        ),
        -- FF-8 : décrément du stock à la clôture. Ancré sur closed_event, qui est
        -- « on conflict do nothing returning » : sur un replay de notation la CTE
        -- est vide, donc le stock n'est décrémenté qu'une fois par transaction.
        stock_settle as (
          update v2_products p
          set quantity_allocated_omni = greatest(p.quantity_allocated_omni - s.quantity, 0),
              quantity_reserved_omni = greatest(p.quantity_reserved_omni - s.quantity, 0)
          from closed_event c
          join v2_transaction_snapshots s on s.transaction_id = c.transaction_id
          where p.id = s.product_id
          returning p.id
        )
        select r.id, r.transaction_id, r.score, r.note
        from rating_present r
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
              order by e.created_at desc, e.state_rank desc
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
        ),
        -- FF-7 — notifie la contrepartie (« à vous d'agir ») à chaque transition acceptée.
        counterparty as (
          select distinct r.transaction_id, m.account_id as recipient_account_id
          from result r
          join v2_transaction_members m on m.transaction_id = r.transaction_id
          where m.role <> ${input.actorRole}::text
        ),
        notified as (
          insert into v2_notification_events (recipient_account_id, event_type, entity_type, entity_id, dedupe_key, payload, correlation_id)
          select c.recipient_account_id, 'transaction_turn', 'transaction', c.transaction_id::text,
                 c.transaction_id::text || ':' || ${input.to}::text || ':turn',
                 jsonb_build_object('state', ${input.to}::text, 'from', ${input.from}::text, 'actorRole', ${input.actorRole}::text),
                 ${input.correlationId}
          from counterparty c
          on conflict (recipient_account_id, dedupe_key) do nothing
          returning id, recipient_account_id
        ),
        deliveries as (
          insert into v2_notification_deliveries (event_id, channel, state)
          select id, 'in_app', 'queued' from notified
          on conflict (event_id, channel) do nothing
          returning id
        ),
        -- Push web seulement si le destinataire a un abonnement actif (canal existant).
        push_deliveries as (
          insert into v2_notification_deliveries (event_id, channel, state)
          select n.id, 'web_push', 'queued'
          from notified n
          join v2_web_push_subscriptions s on s.account_id = n.recipient_account_id
          where s.permission_state = 'granted' and s.revoked_at is null
          on conflict (event_id, channel) do nothing
          returning id
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

    async getWalletOverview(input: { authUserId: string }): Promise<WalletOverviewResult | null> {
      const walletRows = await retryDatabase(() => sql`
        insert into v2_wallets (account_id)
        select a.id
        from v2_accounts a
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        on conflict (account_id) do update set currency = v2_wallets.currency
        returning id, account_id, currency
      `);
      const wallet = (walletRows as Record<string, unknown>[])[0];
      if (!wallet) return null;
      const walletId = String(wallet.id);
      const [balanceRows, entryRows, facilityRows] = await Promise.all([
        retryDatabase(() => sql`
          select coalesce(sum(case when e.kind in ('recharge', 'bonus_grant', 'reversal', 'coupon_credit') then e.amount_minor else -e.amount_minor end), 0)::int as balance_minor
          from v2_wallet_ledger_entries e
          where e.wallet_id = ${walletId}::uuid and e.status = 'confirmed'
        `),
        retryDatabase(() => sql`
          select id, kind, amount_minor, status, reference, facility_id, created_at, confirmed_at
          from v2_wallet_ledger_entries
          where wallet_id = ${walletId}::uuid
          order by created_at desc, id desc
          limit 20
        `),
        retryDatabase(() => sql`
          select f.id as facility_id, f.name as facility_name,
                 -- R-4b : repli sans entitlement — lire l'ENTITE d'abord, sinon le lieu.
                 coalesce(e.commercial_plan, f.commercial_plan) as commercial_plan,
                 coalesce(last_entitlement.price_minor, ${convertUsdMinorToLocal(OMNI_PLAN_PRICES_USD_MINOR.sellerPro, OMNI_DEFAULT_LOCAL_CURRENCY)})::int as pro_price_minor,
                 coalesce(last_entitlement.billing_currency, ${OMNI_DEFAULT_LOCAL_CURRENCY}) as billing_currency,
                 last_entitlement.id as entitlement_id,
                 last_entitlement.starts_at,
                 last_entitlement.ends_at,
                 last_entitlement.state as entitlement_state,
                 coalesce(last_entitlement.renewal_opt_in, false) as renewal_opt_in,
                 ${OMNI_PLAN_PRICES_USD_MINOR.sellerPro}::int as base_pro_price_usd_minor,
                 ${OMNI_BASE_CURRENCY} as base_billing_currency
          from v2_facilities f
          left join v2_entities e on e.id = f.entity_id
          join v2_accounts a on a.id = f.account_id
          join v2_facility_slots fs on fs.facility_id = f.id and fs.account_id = a.id and fs.status = 'assigned'
          left join lateral (
            select ent.price_minor, ent.billing_currency, ent.renewal_opt_in, ent.starts_at, ent.ends_at, ent.state, ent.id
            from v2_facility_entitlements ent
            where ent.facility_id = f.id and ent.entitlement_kind = 'facility_pro'
            order by ent.created_at desc, ent.id desc
            limit 1
          ) last_entitlement on true
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          order by f.name asc, f.id asc
        `),
      ]);
      const balance = (balanceRows as Record<string, unknown>[])[0];
      return {
        walletId,
        currency: String(wallet.currency ?? 'XOF'),
        balanceMinor: Number(balance?.balance_minor ?? 0),
        entries: (entryRows as Record<string, unknown>[]).map((row) => ({
          id: String(row.id),
          kind: String(row.kind) as WalletOverviewResult['entries'][number]['kind'],
          amountMinor: Number(row.amount_minor),
          status: String(row.status) as WalletOverviewResult['entries'][number]['status'],
          reference: String(row.reference),
          facilityId: row.facility_id === null || row.facility_id === undefined ? null : String(row.facility_id),
          createdAt: new Date(String(row.created_at)).toISOString(),
          confirmedAt: row.confirmed_at === null || row.confirmed_at === undefined ? null : new Date(String(row.confirmed_at)).toISOString(),
        })),
        facilities: (facilityRows as Record<string, unknown>[]).map((row) => {
          const nowMs = Date.now();
          const endsAtMs = row.ends_at ? new Date(String(row.ends_at)).getTime() : null;
          const activeNow = String(row.entitlement_state) === 'active' && (endsAtMs === null || endsAtMs > nowMs);
          const daysLeft = endsAtMs !== null ? Math.max(0, Math.ceil((endsAtMs - nowMs) / 86400000)) : 0;
          const plan = activeNow ? 'pro_active' : row.entitlement_id ? 'pro_expired' : String(row.commercial_plan) === 'pro_active' ? 'pro_active' : String(row.commercial_plan) === 'pro_expired' ? 'pro_expired' : 'free';
          return {
            facilityId: String(row.facility_id),
            facilityName: String(row.facility_name),
            plan,
            slotState: 'active' as const,
            proPriceMinor: Number(row.pro_price_minor),
            billingCurrency: String(row.billing_currency),
            baseProPriceUsdMinor: Number(row.base_pro_price_usd_minor),
            baseBillingCurrency: String(row.base_billing_currency),
            proEndsAt: row.ends_at ? new Date(String(row.ends_at)).toISOString() : null,
            renewalOptIn: Boolean(row.renewal_opt_in),
            daysLeft,
          };
        }),
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
          -- C-6/S-14 : le seuil suit le volume. Un particulier (individu) prouve par 1 vente,
          -- un commerce par 3. Un seuil de 3 en dur bloquait le particulier pourtant eligible.
          select f.id as facility_id, f.account_id
          from v2_facilities f
          left join v2_entities e on e.id = f.entity_id
          join v2_accounts a on a.id = f.account_id
          where f.id = ${input.facilityId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and coalesce(e.trust_state, f.trust_state) = 'confirmed'
            and coalesce(e.qualifying_sales, f.qualifying_sales) >= case when e.kind = 'individu' then ${INDIVIDUAL_CONFIRMED_SALES_THRESHOLD} else ${CONFIRMED_SALES_THRESHOLD} end
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
          select w.wallet_id, 'bonus_grant', 10000, 'confirmed', ${reference}, u.facility_id, ${input.now}::timestamptz, ${input.now}::timestamptz
          from wallet w
          join unlocked u on true
          on conflict (wallet_id, kind, reference) do nothing
          returning id, wallet_id, facility_id
        ),
        unlock_marking as (
          update v2_seller_unlocks su
          set status = 'granted',
              granted_at = ${input.now}::timestamptz,
              updated_at = ${input.now}::timestamptz
          from grant g
          where su.facility_id = g.facility_id
            and su.unlock_type = 'pro_test_credit_20_usd'
          returning su.facility_id
        )
        select g.id, g.wallet_id, g.facility_id from grant g
        union all
        select e.id, e.wallet_id, e.facility_id from existing e
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new WalletPolicyError('Facility bonus requires confirmed trust, three qualifying sales and an owned wallet.');
      return {
        ledgerEntryId: String(row.id),
        walletId: String(row.wallet_id),
        kind: 'bonus_grant',
        amountMinor: 10000,
        status: 'confirmed',
        facilityId: String(row.facility_id),
      };
    },

    async getFacilityBonusStatus(input: { authUserId: string; facilityId: string }): Promise<FacilityBonusStatus> {
      const rows = await retryDatabase(() => sql`
        select
          f.id as facility_id,
          u.unlock_type,
          u.distinct_buyer_count,
          u.required_count,
          u.status,
          u.amount_minor,
          coalesce(e.trust_state, f.trust_state) as trust_state,
          coalesce(e.qualifying_sales, f.qualifying_sales) as qualifying_sales,
          f.bonus_unlocked_at,
          case when e.kind = 'individu' then ${INDIVIDUAL_CONFIRMED_SALES_THRESHOLD} else ${CONFIRMED_SALES_THRESHOLD} end as kind_required_count
        from v2_facilities f
        left join v2_entities e on e.id = f.entity_id
        join v2_accounts a on a.id = f.account_id
        left join v2_seller_unlocks u on u.facility_id = f.id and u.unlock_type = 'pro_test_credit_20_usd'
        where f.id = ${input.facilityId}::uuid
          and a.auth_user_id = ${input.authUserId}
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) {
        return {
          facilityId: input.facilityId,
          unlockType: 'pro_test_credit_20_usd',
          distinctBuyerCount: 0,
          requiredCount: 3,
          status: 'locked',
          amountMinor: 10000,
          trustState: 'unconfirmed',
          qualifyingSales: 0,
          bonusUnlockedAt: null,
        };
      }
      // R-4c : le seuil affiche suit le VOLUME (particulier 1 / commerce 3), comme le chemin d'ecriture.
      // Avant, une entite 'individu' sans vente affichait '0/3' alors que la porte en exigeait 1.
      if (row.unlock_type === null || row.unlock_type === undefined) {
        return {
          facilityId: String(row.facility_id),
          unlockType: 'pro_test_credit_20_usd',
          distinctBuyerCount: 0,
          requiredCount: Number(row.kind_required_count),
          status: 'locked',
          amountMinor: 10000,
          trustState: String(row.trust_state) as 'unclaimed' | 'verification_draft' | 'verification_submitted' | 'admin_review' | 'certified' | 'unconfirmed' | 'confirmed' | 'rejected' | 'suspended',
          qualifyingSales: Number(row.qualifying_sales ?? 0),
          bonusUnlockedAt: null,
        };
      }
      return {
        facilityId: String(row.facility_id),
        unlockType: String(row.unlock_type) as 'pro_test_credit_20_usd',
        distinctBuyerCount: Number(row.distinct_buyer_count),
        // R-4c : la ligne stockee peut avoir ete ecrite avant le correctif (required_count = DEFAULT 3).
        // Le seuil affiche suit donc le VOLUME calcule, pas la valeur stockee.
        requiredCount: Number(row.kind_required_count),
        status: String(row.status) as 'locked' | 'eligible' | 'granted',
        amountMinor: Number(row.amount_minor),
        trustState: String(row.trust_state) as 'unclaimed' | 'verification_draft' | 'verification_submitted' | 'admin_review' | 'certified' | 'unconfirmed' | 'confirmed' | 'rejected' | 'suspended',
        qualifyingSales: Number(row.qualifying_sales),
        bonusUnlockedAt: row.bonus_unlocked_at === null || row.bonus_unlocked_at === undefined ? null : new Date(String(row.bonus_unlocked_at)).toISOString(),
      };
    },

    async createWalletRecharge(input: {
      authUserId: string;
      amountMinor: number;
      currency: string;
      idempotencyKey: string;
      callbackUrl: string;
      customer: { email: string | null; firstName?: string | null; lastName?: string | null };
      purpose?: 'wallet' | 'pack';
      packCredits?: number | null;
    }): Promise<WalletRechargePersistenceResult> {
      if (!Number.isInteger(input.amountMinor) || input.amountMinor < 100 || input.amountMinor > 100000000) {
        throw new WalletPolicyError('Recharge amount must be between 100 and 100,000,000 minor units.');
      }
      const currency = input.currency.trim().toUpperCase();
      if (currency !== 'XOF' || !input.idempotencyKey.trim() || input.idempotencyKey.length > 180) {
        throw new WalletPolicyError('Recharge currency or idempotency key is invalid.');
      }
      if (!isFedaPayConfigured()) {
        throw new WalletPolicyError('FedaPay recharge is not configured for this environment.');
      }
      const purpose = input.purpose === 'pack' ? 'pack' : 'wallet';
      const packCredits = purpose === 'pack' && Number.isInteger(input.packCredits) && Number(input.packCredits) > 0 ? Number(input.packCredits) : null;
      if (purpose === 'pack' && (packCredits === null || input.amountMinor < 100)) {
        throw new WalletPolicyError('A bulk pack recharge requires a positive pack size and a valid amount.');
      }
      const existingRows = await retryDatabase(() => sql`
        select r.id, r.account_id, r.amount_minor, r.currency, r.status, r.provider_transaction_id, r.checkout_url, r.purpose, r.pack_credits
        from v2_wallet_recharge_intents r
        join v2_accounts a on a.id = r.account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and r.idempotency_key = ${input.idempotencyKey}
        limit 1
      `);
      const existing = (existingRows as Record<string, unknown>[])[0];
      if (existing) {
        if (Number(existing.amount_minor) !== input.amountMinor || String(existing.currency) !== currency) {
          throw new WalletPolicyError('The recharge idempotency key is already used with different terms.');
        }
        if (!existing.provider_transaction_id || !existing.checkout_url || String(existing.status) !== 'pending') {
          throw new WalletPolicyError('The existing recharge cannot be resumed automatically.');
        }
        return { rechargeId: String(existing.id), accountId: String(existing.account_id), amountMinor: Number(existing.amount_minor), currency, status: 'pending', providerTransactionId: String(existing.provider_transaction_id), checkoutUrl: String(existing.checkout_url), purpose: String(existing.purpose) === 'pack' ? 'pack' : 'wallet', packCredits: existing.pack_credits === null || existing.pack_credits === undefined ? null : Number(existing.pack_credits) };
      }
      const intentRows = await retryDatabase(() => sql`
        insert into v2_wallet_recharge_intents (account_id, wallet_id, amount_minor, currency, idempotency_key, purpose, pack_credits)
        select a.id, w.id, ${input.amountMinor}, ${currency}, ${input.idempotencyKey}, ${purpose}, ${packCredits}
        from v2_accounts a
        join v2_wallets w on w.account_id = a.id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        returning id, account_id
      `);
      const intent = (intentRows as Record<string, unknown>[])[0];
      if (!intent) throw new WalletPolicyError('An active account Wallet is required for recharge.');
      const checkout = await createFedaPayCheckout({
        rechargeId: String(intent.id),
        amountMinor: input.amountMinor,
        currency,
        description: purpose === 'pack' ? `Pack crédits bulk ${packCredits ?? ''}` : 'Recharge Omni Wallet',
        callbackUrl: input.callbackUrl,
        customer: input.customer,
      });
      const updatedRows = await retryDatabase(() => sql`
        update v2_wallet_recharge_intents
        set provider_transaction_id = ${checkout.transactionId}, checkout_url = ${checkout.checkoutUrl}, updated_at = now()
        where id = ${String(intent.id)}::uuid and status = 'pending'
        returning id, account_id, amount_minor, currency, status, provider_transaction_id, checkout_url, purpose, pack_credits
      `);
      const updated = (updatedRows as Record<string, unknown>[])[0];
      if (!updated) throw new WalletPolicyError('Recharge state changed while creating the provider checkout.');
      return { rechargeId: String(updated.id), accountId: String(updated.account_id), amountMinor: Number(updated.amount_minor), currency: String(updated.currency), status: 'pending', providerTransactionId: String(updated.provider_transaction_id), checkoutUrl: String(updated.checkout_url), purpose: String(updated.purpose) === 'pack' ? 'pack' : 'wallet', packCredits: updated.pack_credits === null || updated.pack_credits === undefined ? null : Number(updated.pack_credits) };
    },

    async getBulkPacks(): Promise<BulkPackCatalogItem[]> {
      return BULK_PACKS.map((p) => ({ id: p.id, credits: p.credits, priceMinor: p.priceMinor, billingCurrency: p.billingCurrency }));
    },

    async createBulkPackRecharge(input: {
      authUserId: string;
      packId: string;
      idempotencyKey: string;
      callbackUrl: string;
      customer: { email: string | null; firstName?: string | null; lastName?: string | null };
    }): Promise<WalletRechargePersistenceResult> {
      const pack = bulkPackById(input.packId.trim());
      if (!pack) throw new WalletPolicyError('The requested bulk pack does not exist.');
      return this.createWalletRecharge({
        authUserId: input.authUserId,
        amountMinor: pack.priceMinor,
        currency: pack.billingCurrency,
        idempotencyKey: input.idempotencyKey,
        callbackUrl: input.callbackUrl,
        customer: input.customer,
        purpose: 'pack',
        packCredits: pack.credits,
      });
    },

    async reconcileWalletRecharge(input: {
      providerTransactionId: string;
      providerEventId: string;
      status: 'pending' | 'approved' | 'declined' | 'canceled';
      amountMinor: number;
      currency: string;
      omniRechargeId: string | null;
      now: string;
    }): Promise<{ status: 'pending' | 'confirmed' | 'failed' | 'canceled' | 'ignored'; rechargeId?: string; ledgerEntryId?: string; packCreditsGranted?: number | null }> {
      const providerTransactionId = input.providerTransactionId.trim();
      const providerEventId = input.providerEventId.trim();
      if (!providerTransactionId || !providerEventId || !Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
        throw new WalletPolicyError('FedaPay webhook payload is invalid.');
      }
      const currency = input.currency.trim().toUpperCase();
      if (currency !== 'XOF') throw new WalletPolicyError('FedaPay webhook currency is not supported.');
      const existingEventRows = await retryDatabase(() => sql`
        select id from v2_wallet_recharge_intents where provider_event_id = ${providerEventId} limit 1
      `);
      if ((existingEventRows as Record<string, unknown>[])[0]) return { status: 'ignored' };
      const intentRows = await retryDatabase(() => sql`
        select r.id, r.account_id, r.wallet_id, r.amount_minor, r.currency, r.status, r.provider_transaction_id
        from v2_wallet_recharge_intents r
        where r.provider_transaction_id = ${providerTransactionId}
        limit 1
      `);
      const intent = (intentRows as Record<string, unknown>[])[0];
      if (!intent) throw new WalletPolicyError('FedaPay webhook does not match a pending Omni recharge.');
      if (input.omniRechargeId && String(intent.id) !== input.omniRechargeId) throw new WalletPolicyError('FedaPay webhook reference does not match the Omni recharge.');
      if (Number(intent.amount_minor) !== input.amountMinor || String(intent.currency).toUpperCase() !== currency) throw new WalletPolicyError('FedaPay webhook amount or currency does not match the Omni recharge.');
      if (String(intent.status) !== 'pending') return { status: String(intent.status) === 'confirmed' ? 'confirmed' : String(intent.status) === 'failed' ? 'failed' : 'canceled', rechargeId: String(intent.id) };
      const nextStatus = input.status === 'approved' ? 'confirmed' : input.status === 'canceled' ? 'canceled' : input.status === 'declined' ? 'failed' : 'pending';
      if (nextStatus === 'pending') return { status: 'pending', rechargeId: String(intent.id) };
      const rows = await retryDatabase(() => sql`
        with locked as (
          select r.id, r.wallet_id, r.account_id, r.amount_minor, r.currency, r.purpose, r.pack_credits
          from v2_wallet_recharge_intents r
          join v2_accounts a on a.id = r.account_id
          where r.id = ${String(intent.id)}::uuid and r.status = 'pending' and a.suspended_at is null
          for update of r
        ), ledger as (
          insert into v2_wallet_ledger_entries (wallet_id, kind, amount_minor, status, reference, created_at, confirmed_at)
          select l.wallet_id, 'recharge', l.amount_minor, 'confirmed', ${`fedapay:${providerTransactionId}`}, ${input.now}::timestamptz, ${input.now}::timestamptz
          from locked l
          where ${nextStatus} = 'confirmed'
          on conflict (wallet_id, kind, reference) do nothing
          returning id
        ), updated as (
          update v2_wallet_recharge_intents r
          set status = ${nextStatus}, provider_event_id = ${providerEventId}, confirmed_at = case when ${nextStatus} = 'confirmed' then ${input.now}::timestamptz else null end, updated_at = ${input.now}::timestamptz
          from locked l
          where r.id = l.id
          returning r.id
        ), pack_credit as (
          insert into v2_availability_credit_ledger (buyer_account_id, kind, amount, reason, recharge_intent_id)
          select l.account_id, 'pack_credit', l.pack_credits, ${`bulk pack recharge ${providerTransactionId}`}, l.id
          from locked l
          where ${nextStatus} = 'confirmed' and l.purpose = 'pack'
          on conflict (recharge_intent_id) do nothing
          returning id, recharge_intent_id
        ), grant_extra as (
          insert into v2_buyer_credit_accounts (buyer_account_id, plan, monthly_quota, period_month, extra_credits)
          select l.account_id, 'free', 3, to_char(now(), 'YYYY-MM'), l.pack_credits
          from pack_credit pc
          join locked l on l.id = pc.recharge_intent_id
          where l.purpose = 'pack' and ${nextStatus} = 'confirmed'
          on conflict (buyer_account_id) do update set
            extra_credits = v2_buyer_credit_accounts.extra_credits + excluded.extra_credits,
            updated_at = now()
          returning buyer_account_id
        )
        select u.id as recharge_id, (select id from ledger limit 1) as ledger_entry_id, (select id from pack_credit limit 1) as pack_credit_id, (select l.pack_credits from pack_credit pc join locked l on l.id = pc.recharge_intent_id limit 1) as pack_credits_granted from updated u
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return { status: 'ignored' };
      return { status: nextStatus, rechargeId: String(row.recharge_id), ledgerEntryId: row.ledger_entry_id ? String(row.ledger_entry_id) : undefined, packCreditsGranted: row.pack_credits_granted === null || row.pack_credits_granted === undefined ? undefined : Number(row.pack_credits_granted) };
    },

    async reconcilePendingRecharges(input: { authUserId: string; now: string }): Promise<{
      authorized: boolean;
      rechecked: number;
      credited: number;
      unchanged: number;
      skipped: { providerTransactionId: string; providerStatus: string | null; reason: string }[];
      errors: { providerTransactionId: string; message: string }[];
    }> {
      const actorRows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' AND ar.status = 'active'
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          limit 1
        )
        select 1
        from admin
      `);
      const pendingRows = (await retryDatabase(() => sql`
        select r.id, r.provider_transaction_id, r.wallet_id, r.account_id, r.amount_minor, r.currency
        from v2_wallet_recharge_intents r
        where r.status = 'pending'
          and r.provider_transaction_id is not null
        order by r.created_at
      `)) as unknown as Record<string, unknown>[];
      const errors: { providerTransactionId: string; message: string }[] = [];
      const skipped: { providerTransactionId: string; providerStatus: string | null; reason: string }[] = [];
      let credited = 0;
      for (const pending of pendingRows as Record<string, unknown>[]) {
        const providerTransactionId = String(pending.provider_transaction_id).trim();
        try {
          const snapshot = await fetchFedaPayTransaction(providerTransactionId);
          if (snapshot.status !== 'approved') {
            skipped.push({ providerTransactionId, providerStatus: snapshot.status, reason: 'not_approved' });
            continue;
          }
          if (!snapshot.omniRechargeId) {
            skipped.push({ providerTransactionId, providerStatus: snapshot.status, reason: 'missing_reference' });
            continue;
          }
          const outcome = await this.reconcileWalletRecharge({
            providerTransactionId,
            providerEventId: `fedapay:${providerTransactionId}:admin-reconcile`,
            status: 'approved',
            amountMinor: snapshot.amountMinor,
            currency: snapshot.currency ?? 'XOF',
            omniRechargeId: snapshot.omniRechargeId,
            now: input.now,
          });
          if (outcome.status === 'confirmed') credited += 1;
        } catch (caught) {
          errors.push({ providerTransactionId, message: caught instanceof Error ? caught.message : String(caught) });
        }
      }
      return {
        authorized: true,
        rechecked: pendingRows.length,
        credited,
        unchanged: skipped.length,
        skipped,
        errors,
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

    async activateFacilityPro(input: {
      authUserId: string;
      facilityId: string;
      reference: string;
      now: string;
    }): Promise<FacilityProActivationPersistenceResult> {
      if (!input.reference.trim() || input.reference.length > 180) throw new WalletPolicyError('Pro activation reference is invalid.');
      const rows = await retryDatabase(() => sql`
        with seller as (
          select a.id as account_id, w.id as wallet_id
          from v2_accounts a
          join v2_wallets w on w.account_id = a.id
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and a.onboarding_state in ('seller_ready', 'complete')
        ), facility as (
          select f.id as facility_id, f.account_id, f.entity_id,
                 coalesce(last_entitlement.price_minor, ${convertUsdMinorToLocal(OMNI_PLAN_PRICES_USD_MINOR.sellerPro, OMNI_DEFAULT_LOCAL_CURRENCY)})::int as price_minor,
                 coalesce(last_entitlement.billing_currency, ${OMNI_DEFAULT_LOCAL_CURRENCY}) as billing_currency
          from v2_facilities f
          join seller s on s.account_id = f.account_id
          join v2_facility_slots fs on fs.facility_id = f.id and fs.account_id = f.account_id and fs.status = 'assigned'
          left join lateral (
            select e.price_minor, e.billing_currency
            from v2_facility_entitlements e
            -- R-4b : entitlement de l'ENTITE d'abord (facility_id = lieu d'application).
            where e.entitlement_kind = 'facility_pro'
              and (e.facility_id = f.id or (e.entity_id is not null and e.entity_id = f.entity_id))
            order by e.created_at desc, e.id desc
            limit 1
          ) last_entitlement on true
          where f.id = ${input.facilityId}::uuid
          for update of f
        ), active_entitlement as (
          select e.id, e.ends_at
          from v2_facility_entitlements e
          join facility f on f.facility_id = e.facility_id
          where e.entitlement_kind = 'facility_pro' and e.state = 'active' and e.ends_at > ${input.now}::timestamptz
          order by e.ends_at desc
          limit 1
        ), existing_spend as (
          select e.id, e.wallet_id, e.amount_minor, e.facility_id
          from v2_wallet_ledger_entries e
          join seller s on s.wallet_id = e.wallet_id
          where e.kind = 'facility_pro_spend' and e.reference = ${input.reference}
          limit 1
        ), balance as (
          select coalesce(sum(case when e.kind in ('recharge', 'bonus_grant', 'reversal', 'coupon_credit') then e.amount_minor else -e.amount_minor end), 0)::int as balance_minor
          from v2_wallet_ledger_entries e
          join seller s on s.wallet_id = e.wallet_id
          where e.status = 'confirmed'
        ), spend as (
          insert into v2_wallet_ledger_entries (wallet_id, kind, amount_minor, status, reference, facility_id, created_at, confirmed_at)
          select s.wallet_id, 'facility_pro_spend', f.price_minor, 'confirmed', ${input.reference}, f.facility_id, ${input.now}::timestamptz, ${input.now}::timestamptz
          from seller s cross join facility f cross join balance b
          where b.balance_minor >= f.price_minor and not exists (select 1 from active_entitlement) and not exists (select 1 from existing_spend)
          on conflict (wallet_id, kind, reference) do nothing
          returning id, wallet_id, amount_minor, facility_id
        ), effective_spend as (
          select id, wallet_id, amount_minor, facility_id from spend
          union all
          select id, wallet_id, amount_minor, facility_id from existing_spend
          limit 1
        ), entitlement as (
          insert into v2_facility_entitlements (facility_id, entity_id, entitlement_kind, state, starts_at, ends_at, source, price_minor, billing_currency, renewal_opt_in)
          select f.facility_id, f.entity_id, 'facility_pro', 'active', ${input.now}::timestamptz, ${input.now}::timestamptz + interval '30 days', 'wallet', f.price_minor, f.billing_currency, false
          from facility f join effective_spend s on s.facility_id = f.facility_id
          where not exists (select 1 from active_entitlement)
          returning id, facility_id, ends_at
        ), updated as (
          update v2_facilities f
          set commercial_plan = 'pro_active', updated_at = ${input.now}::timestamptz
          from entitlement e
          where f.id = e.facility_id
          returning f.id
        ), updated_entity as (
          -- R-4b : Pro vit sur l'ENTITE (Seed §eco). Sans ce miroir, la porte de publication
          -- (qui lit e.commercial_plan) resterait 'free' pour un vendeur qui a paye.
          update v2_entities e
          set commercial_plan = 'pro_active', updated_at = ${input.now}::timestamptz
          from updated u
          join v2_facilities f on f.id = u.id
          where e.id = f.entity_id
          returning e.id
        )
        select e.id as entitlement_id, e.facility_id, e.ends_at, s.id as spend_ledger_entry_id
        from entitlement e join effective_spend s on s.facility_id = e.facility_id
        union all
        select ae.id as entitlement_id, f.facility_id, ae.ends_at, es.id as spend_ledger_entry_id
        from active_entitlement ae cross join facility f left join existing_spend es on true
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new WalletPolicyError('Pro activation requires an assigned facility slot and sufficient confirmed Wallet funds.');
      return { facilityId: String(row.facility_id), entitlementId: String(row.entitlement_id), endsAt: new Date(String(row.ends_at)).toISOString(), spendLedgerEntryId: String(row.spend_ledger_entry_id ?? '') };
    },

    async getFacilityRenewalStatus(input: { authUserId: string; facilityId: string }): Promise<FacilityRenewalStatus> {
      const rows = await retryDatabase(() => sql`
        with facility as (
          select f.id as facility_id, f.name as facility_name, f.account_id,
                 coalesce(last_entitlement.price_minor, ${convertUsdMinorToLocal(OMNI_PLAN_PRICES_USD_MINOR.sellerPro, OMNI_DEFAULT_LOCAL_CURRENCY)})::int as pro_price_minor,
                 coalesce(last_entitlement.billing_currency, ${OMNI_DEFAULT_LOCAL_CURRENCY}) as billing_currency,
                 coalesce(last_entitlement.renewal_opt_in, false) as renewal_opt_in,
                 last_entitlement.id as entitlement_id,
                 last_entitlement.starts_at,
                 last_entitlement.ends_at,
                 last_entitlement.state as entitlement_state
          from v2_facilities f
          join v2_accounts a on a.id = f.account_id
          left join lateral (
            select e.id, e.state, e.starts_at, e.ends_at, e.price_minor, e.billing_currency, e.renewal_opt_in
            from v2_facility_entitlements e
            -- R-4b : entitlement de l'ENTITE d'abord (facility_id = lieu d'application).
            where e.entitlement_kind = 'facility_pro'
              and (e.facility_id = f.id or (e.entity_id is not null and e.entity_id = f.entity_id))
            order by e.created_at desc, e.id desc
            limit 1
          ) last_entitlement on true
          where f.id = ${input.facilityId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ), wallet as (
          select w.id as wallet_id
          from v2_wallets w
          join facility f on f.account_id = w.account_id
        ), balance as (
          select coalesce(sum(case when e.kind in ('recharge', 'bonus_grant', 'reversal', 'coupon_credit') then e.amount_minor else -e.amount_minor end), 0)::int as balance_minor
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.status = 'confirmed'
        )
        select
          f.facility_id, f.facility_name, f.pro_price_minor, f.billing_currency,
          f.renewal_opt_in, f.entitlement_id, f.starts_at, f.ends_at, f.entitlement_state,
          ${OMNI_PLAN_PRICES_USD_MINOR.sellerPro}::int as base_pro_price_usd_minor,
          ${OMNI_BASE_CURRENCY} as base_billing_currency,
          b.balance_minor
        from facility f cross join balance b
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new SellerAuthorizationPolicyError('Facility not found or not owned by the current user.');
      const nowMs = Date.now();
      const endsAtMs = row.ends_at ? new Date(String(row.ends_at)).getTime() : null;
      const daysLeft = endsAtMs !== null ? Math.max(0, Math.ceil((endsAtMs - nowMs) / 86400000)) : 0;
      const activeNow = String(row.entitlement_state) === 'active' && (endsAtMs === null || endsAtMs > nowMs);
      const plan = activeNow ? 'pro_active' : row.entitlement_id || String(row.entitlement_state) === 'active' || String(row.entitlement_state) === 'expired' ? 'pro_expired' : 'free';
      const price = Number(row.pro_price_minor);
      const balanceMinor = Number(row.balance_minor ?? 0);
      return {
        facilityId: String(row.facility_id),
        facilityName: String(row.facility_name),
        plan,
        entitlementId: row.entitlement_id ? String(row.entitlement_id) : null,
        startsAt: row.starts_at ? new Date(String(row.starts_at)).toISOString() : null,
        endsAt: row.ends_at ? new Date(String(row.ends_at)).toISOString() : null,
        renewalOptIn: Boolean(row.renewal_opt_in),
        daysLeft,
        proPriceMinor: price,
        billingCurrency: String(row.billing_currency),
        baseProPriceUsdMinor: Number(row.base_pro_price_usd_minor),
        baseBillingCurrency: String(row.base_billing_currency),
        walletBalanceMinor: balanceMinor,
        sufficientFunds: balanceMinor >= price,
      };
    },

    async getFacilityAnalytics(input: { authUserId: string; facilityId: string }): Promise<SellerFacilityAnalytics> {
      const rows = await retryDatabase(() => sql`
        with facility as (
          select f.id as facility_id, f.name as facility_name, f.account_id
          from v2_facilities f
          join v2_accounts a on a.id = f.account_id
          where f.id = ${input.facilityId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ),
        requests as (
          select r.id
          from v2_availability_requests r
          join facility f on f.facility_id = any(r.facility_scope)
        ),
        responses as (
          select ar.id
          from v2_availability_responses ar
          join facility f on f.facility_id = ar.facility_id
        ),
        transactions as (
          select s.transaction_id, s.buyer_account_id, s.net_amount_minor, s.unit_price_minor, s.created_at
          from v2_transaction_snapshots s
          join facility f on f.facility_id = s.facility_id
        ),
        qr_scans as (
          select q.transaction_id, q.verified_at, s.created_at
          from v2_qr_tokens q
          join transactions s on s.transaction_id = q.transaction_id
          where q.verified_at is not null
        ),
        closed_tx as (
          select e.transaction_id
          from v2_transaction_events e
          join transactions s on s.transaction_id = e.transaction_id
          where e.state = 'closed'
        )
        select
          f.facility_id,
          f.facility_name,
          (select count(*)::int from requests) as requests,
          (select count(*)::int from responses) as responses_available,
          (select count(*)::int from transactions) as transactions_started,
          (select count(*)::int from qr_scans) as qr_scans_verified,
          (select count(*)::int from closed_tx) as transactions_closed,
          (select coalesce(sum(s.net_amount_minor), 0)::int from transactions s join closed_tx c on c.transaction_id = s.transaction_id) as gross_revenue_minor,
          (select
             case when count(*) = 0 then null
             else round(avg(extract(epoch from (qr.verified_at - qr.created_at)) * 1000))::bigint end
           from qr_scans qr
          ) as scan_to_verify_avg_ms
        from facility f
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new SellerAuthorizationPolicyError('Facility not found or not owned by the current user.');
      return {
        facilityId: String(row.facility_id),
        facilityName: String(row.facility_name),
        requests: Number(row.requests),
        responsesAvailable: Number(row.responses_available),
        transactionsStarted: Number(row.transactions_started),
        qrScansVerified: Number(row.qr_scans_verified),
        transactionsClosed: Number(row.transactions_closed),
        grossRevenueMinor: Number(row.gross_revenue_minor),
        billingCurrency: OMNI_DEFAULT_LOCAL_CURRENCY,
        scanToVerifyAvgMs: row.scan_to_verify_avg_ms === null || row.scan_to_verify_avg_ms === undefined ? null : Number(row.scan_to_verify_avg_ms),
      };
    },

    async createAdCampaign(input: { authUserId: string; facilityId: string; name: string; budgetMinor: number; startsAt: string; endsAt: string }): Promise<AdCampaignCreateResult> {
      if (input.budgetMinor <= 0 || input.startsAt >= input.endsAt) {
        throw new WalletPolicyError('Ad campaign requires a positive budget and a window where the start is before the end.');
      }
      const rows = await retryDatabase(() => sql`
        with facility as (
          select f.id as facility_id, f.name as facility_name, f.account_id,
                 -- R-4b / D-04 : capacite Pro = ENTITLEMENT VIVANT, jamais la colonne commercial_plan
                 -- (jamais remise a 'free') — sinon un Pro echou resterait 'pro' a vie ici.
                 exists (
                   select 1 from v2_facility_entitlements fe
                   where fe.entitlement_kind = 'facility_pro'
                     and fe.state = 'active' and fe.ends_at > now()
                     and (fe.facility_id = f.id or (fe.entity_id is not null and fe.entity_id = e.id))
                 ) as is_pro,
                 f.trust_state, f.operational_state
          from v2_facilities f
          left join v2_entities e on e.id = f.entity_id
          join v2_accounts a on a.id = f.account_id
          where f.id = ${input.facilityId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          for update of f
        ),
        plan_check as (
          select case
            when not exists (select 1 from facility) then null
            when exists (select 1 from facility where is_pro = false) then 'pro_only'
            else null end as failure
        ),
        wallet as (
          select w.id as wallet_id
          from v2_wallets w
          join facility f on f.account_id = w.account_id
          for update of w
        ),
        balance as (
          select coalesce(sum(case when e.kind in ('recharge', 'bonus_grant', 'reversal', 'coupon_credit') then e.amount_minor else -e.amount_minor end), 0)::int as balance_minor
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.status = 'confirmed'
        ),
        existing as (
          select e.id, e.wallet_id, e.amount_minor
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.kind = 'ad_spend' and e.reference = ${`ad-budget:${input.facilityId}:${input.startsAt}`}
          limit 1
        ),
        spend as (
          insert into v2_wallet_ledger_entries (wallet_id, kind, amount_minor, status, reference, facility_id, created_at, confirmed_at)
          select w.wallet_id, 'ad_spend', ${input.budgetMinor}, 'confirmed', ${`ad-budget:${input.facilityId}:${input.startsAt}`}, f.facility_id, now(), now()
          from facility f join wallet w on true
          join (select * from balance) b on true
          join (select * from plan_check) pc on true
          where pc.failure is null
            and b.balance_minor >= ${input.budgetMinor}
            and not exists (select 1 from existing)
          on conflict (wallet_id, kind, reference) do nothing
          returning id, wallet_id, amount_minor
        ),
        campaign_insert as (
          insert into v2_ad_campaigns (facility_id, name, budget_minor, spent_minor, status, starts_at, ends_at)
          select f.facility_id, ${input.name}, ${input.budgetMinor}, 0,
                 case when ${input.startsAt}::timestamptz <= now() then 'active' else 'planifiee' end,
                 ${input.startsAt}::timestamptz, ${input.endsAt}::timestamptz
          from facility f
          where exists (select 1 from spend)
            and not exists (select 1 from plan_check pc where pc.failure is not null)
          returning id, facility_id, name, budget_minor, spent_minor, status, starts_at, ends_at, created_at
        )
        select c.id as campaign_id, c.facility_id, c.name, c.budget_minor, c.spent_minor,
               c.status, c.starts_at, c.ends_at, c.created_at,
               s.id as spend_ledger_entry_id,
               (select b.balance_minor from balance b) - ${input.budgetMinor} as budget_remaining_minor
        from campaign_insert c join spend s on true
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) {
        const [probe] = await retryDatabase(() => sql`
          select f.commercial_plan
          from v2_facilities f
          join v2_accounts a on a.id = f.account_id
          where f.id = ${input.facilityId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          limit 1
        `) as Record<string, unknown>[];
        if (!probe) throw new SellerAuthorizationPolicyError('Facility not found or not owned by the current user.');
        if (probe.commercial_plan !== 'pro_active') throw new WalletPolicyError('Sponsored ad campaigns require an active Pro plan on the facility.');
        throw new WalletPolicyError('Insufficient wallet balance to reserve the campaign budget.');
      }
      return {
        campaign: {
          id: String(row.campaign_id),
          facilityId: String(row.facility_id),
          name: String(row.name),
          budgetMinor: Number(row.budget_minor),
          spentMinor: Number(row.spent_minor),
          status: String(row.status) as SellerAdCampaign['status'],
          startsAt: String(row.starts_at),
          endsAt: String(row.ends_at),
          createdAt: String(row.created_at),
        },
        spendLedgerEntryId: String(row.spend_ledger_entry_id),
        budgetRemainingMinor: Number(row.budget_remaining_minor),
        billingCurrency: OMNI_DEFAULT_LOCAL_CURRENCY,
      };
    },

    async listFacilityAdCampaigns(input: { authUserId: string; facilityId: string }): Promise<AdCampaignListResult> {
      const rows = await retryDatabase(() => sql`
        with facility as (
          select f.id as facility_id, f.account_id
          from v2_facilities f
          join v2_accounts a on a.id = f.account_id
          where f.id = ${input.facilityId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ),
        wallet as (
          select w.id as wallet_id
          from v2_wallets w
          join facility f on f.account_id = w.account_id
        ),
        balance as (
          select coalesce(sum(case when e.kind in ('recharge', 'bonus_grant', 'reversal', 'coupon_credit') then e.amount_minor else -e.amount_minor end), 0)::int as balance_minor
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.status = 'confirmed'
        )
        select
          coalesce(json_agg(json_build_object(
            'id', c.id, 'facilityId', c.facility_id, 'name', c.name,
            'budgetMinor', c.budget_minor, 'spentMinor', c.spent_minor,
            'status', c.status, 'startsAt', c.starts_at, 'endsAt', c.ends_at, 'createdAt', c.created_at
          ) order by c.created_at desc) filter (where c.id is not null), '[]'::json) as campaigns,
          (select b.balance_minor from balance b) as budget_remaining_minor
        from facility f
        left join v2_ad_campaigns c on c.facility_id = f.facility_id
        group by f.facility_id
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new SellerAuthorizationPolicyError('Facility not found or not owned by the current user.');
      const campaigns = (row.campaigns as unknown as (Record<string, unknown>)[] ?? []).map((c) => ({
        id: String(c.id),
        facilityId: String(c.facilityId),
        name: String(c.name),
        budgetMinor: Number(c.budgetMinor),
        spentMinor: Number(c.spentMinor),
        status: String(c.status) as SellerAdCampaign['status'],
        startsAt: String(c.startsAt),
        endsAt: String(c.endsAt),
        createdAt: String(c.createdAt),
      }));
      return {
        campaigns,
        budgetRemainingMinor: Number(row.budget_remaining_minor),
        billingCurrency: OMNI_DEFAULT_LOCAL_CURRENCY,
      };
    },

    async setFacilityRenewalOptIn(input: { authUserId: string; facilityId: string; optIn: boolean }): Promise<FacilityRenewalOptInResult> {
      const rows = await retryDatabase(() => sql`
        with facility as (
          select f.id as facility_id, f.account_id
          from v2_facilities f
          join v2_accounts a on a.id = f.account_id
          where f.id = ${input.facilityId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          for update of f
        ), latest as (
          select e.id, e.facility_id
          from v2_facility_entitlements e
          join facility f on f.facility_id = e.facility_id
          where e.entitlement_kind = 'facility_pro'
          order by e.created_at desc, e.id desc
          limit 1
        ), updated as (
          update v2_facility_entitlements e
          set renewal_opt_in = ${input.optIn}
          from latest l
          where e.id = l.id
          returning e.facility_id, e.renewal_opt_in
        )
        select facility_id, renewal_opt_in from updated
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) {
        throw new WalletPolicyError('Activate Omni Pro once before choosing auto-renewal.');
      }
      return { facilityId: String(row.facility_id), renewalOptIn: Boolean(row.renewal_opt_in) };
    },

    async renewFacilityPro(input: { authUserId: string; facilityId: string; now: string }): Promise<FacilityRenewalResult> {
      const periodKey = new Date(input.now).toISOString().slice(0, 7);
      const reference = `facility-pro-renew:${input.facilityId}:${periodKey}`;
      const rows = await retryDatabase(() => sql`
        with facility as (
          select f.id as facility_id, f.name as facility_name, f.account_id, f.entity_id,
                 coalesce(last_entitlement.price_minor, ${convertUsdMinorToLocal(OMNI_PLAN_PRICES_USD_MINOR.sellerPro, OMNI_DEFAULT_LOCAL_CURRENCY)})::int as price_minor,
                 coalesce(last_entitlement.billing_currency, ${OMNI_DEFAULT_LOCAL_CURRENCY}) as billing_currency,
                 last_entitlement.id as entitlement_id,
                 last_entitlement.ends_at as prior_ends_at,
                 coalesce(last_entitlement.renewal_opt_in, false) as renewal_opt_in
          from v2_facilities f
          join v2_accounts a on a.id = f.account_id
          join v2_facility_slots fs on fs.facility_id = f.id and fs.account_id = f.account_id and fs.status = 'assigned'
          left join lateral (
            select e.id, e.ends_at, e.price_minor, e.billing_currency, e.renewal_opt_in
            from v2_facility_entitlements e
            -- R-4b : entitlement de l'ENTITE d'abord (facility_id = lieu d'application).
            where e.entitlement_kind = 'facility_pro'
              and (e.facility_id = f.id or (e.entity_id is not null and e.entity_id = f.entity_id))
            order by e.created_at desc, e.id desc
            limit 1
          ) last_entitlement on true
          where f.id = ${input.facilityId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          for update of f
        ), active_entitlement as (
          select e.id, e.ends_at
          from v2_facility_entitlements e
          join facility f on f.facility_id = e.facility_id
          where e.entitlement_kind = 'facility_pro' and e.state = 'active' and e.ends_at > ${input.now}::timestamptz
          order by e.ends_at desc
          limit 1
        ), wallet as (
          select w.id as wallet_id
          from v2_wallets w
          join facility f on f.account_id = w.account_id
          for update of w
        ), balance as (
          select coalesce(sum(case when e.kind in ('recharge', 'bonus_grant', 'reversal', 'coupon_credit') then e.amount_minor else -e.amount_minor end), 0)::int as balance_minor
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.status = 'confirmed'
        ), existing_spend as (
          select e.id, e.wallet_id, e.amount_minor, e.facility_id
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.kind = 'facility_pro_spend' and e.reference = ${reference}
          limit 1
        ), spend as (
          insert into v2_wallet_ledger_entries (wallet_id, kind, amount_minor, status, reference, facility_id, created_at, confirmed_at)
          select w.wallet_id, 'facility_pro_spend', f.price_minor, 'confirmed', ${reference}, f.facility_id, ${input.now}::timestamptz, ${input.now}::timestamptz
          from wallet w cross join facility f cross join balance b
          where b.balance_minor >= f.price_minor
            and not exists (select 1 from active_entitlement)
            and f.renewal_opt_in = true
            and not exists (select 1 from existing_spend)
          on conflict (wallet_id, kind, reference) do nothing
          returning id, wallet_id, amount_minor, facility_id
        ), effective_spend as (
          select id, wallet_id, amount_minor, facility_id from spend
          union all
          select id, wallet_id, amount_minor, facility_id from existing_spend
          limit 1
        ), new_entitlement as (
          insert into v2_facility_entitlements (facility_id, entity_id, entitlement_kind, state, starts_at, ends_at, source, price_minor, billing_currency, renewal_opt_in)
          select f.facility_id, f.entity_id, 'facility_pro', 'active', ${input.now}::timestamptz, ${input.now}::timestamptz + interval '30 days', 'wallet', f.price_minor, f.billing_currency, true
          from facility f join effective_spend s on s.facility_id = f.facility_id
          where not exists (select 1 from active_entitlement)
          returning id, facility_id, ends_at
        ), updated as (
          update v2_facilities f
          set commercial_plan = 'pro_active', updated_at = ${input.now}::timestamptz
          from new_entitlement e
          where f.id = e.facility_id
          returning f.id
        ), updated_entity as (
          -- R-4b : meme miroir que l'activation — le renouvellement maintient l'entite Pro.
          update v2_entities e
          set commercial_plan = 'pro_active', updated_at = ${input.now}::timestamptz
          from updated u
          join v2_facilities f on f.id = u.id
          where e.id = f.entity_id
          returning e.id
        ), renewal_run as (
          insert into v2_facility_renewal_runs (facility_id, prior_entitlement_id, new_entitlement_id, spend_ledger_entry_id, run_at, status, note)
          select f.facility_id, f.entitlement_id, ne.id, s.id, ${input.now}::timestamptz, 'succeeded', 'auto-renew 30d via wallet (opt-in)'
          from facility f join new_entitlement ne on ne.facility_id = f.facility_id join effective_spend s on s.facility_id = f.facility_id
          returning id
        )
        select ne.facility_id, ne.id as new_entitlement_id, ne.ends_at, s.id as spend_ledger_entry_id
        from new_entitlement ne join effective_spend s on s.facility_id = ne.facility_id
      `);
      const renewedRow = (rows as Record<string, unknown>[])[0];
      if (renewedRow) {
        return {
          facilityId: String(renewedRow.facility_id),
          renewed: true,
          reason: 'renewed',
          newEntitlementId: String(renewedRow.new_entitlement_id),
          endsAt: new Date(String(renewedRow.ends_at)).toISOString(),
          spendLedgerEntryId: String(renewedRow.spend_ledger_entry_id ?? ''),
          status: 'succeeded',
        };
      }
      const staleRows = await retryDatabase(() => sql`
        with facility as (
          select f.id as facility_id, f.account_id,
                 coalesce(last_entitlement.renewal_opt_in, false) as renewal_opt_in,
                 last_entitlement.id as entitlement_id
          from v2_facilities f
          join v2_accounts a on a.id = f.account_id
          left join lateral (
            select e.id, e.renewal_opt_in
            from v2_facility_entitlements e
            -- R-4b : entitlement de l'ENTITE d'abord (facility_id = lieu d'application).
            where e.entitlement_kind = 'facility_pro'
              and (e.facility_id = f.id or (e.entity_id is not null and e.entity_id = f.entity_id))
            order by e.created_at desc, e.id desc
            limit 1
          ) last_entitlement on true
          where f.id = ${input.facilityId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ), active_entitlement as (
          select e.id
          from v2_facility_entitlements e
          join facility f on f.facility_id = e.facility_id
          where e.entitlement_kind = 'facility_pro' and e.state = 'active' and e.ends_at > ${input.now}::timestamptz
          limit 1
        ), spent_this_period as (
          select e.id
          from v2_wallet_ledger_entries e
          join v2_wallets w on w.id = e.wallet_id
          join facility f on f.account_id = w.account_id
          where e.kind = 'facility_pro_spend' and e.reference = ${reference}
          limit 1
        )
        insert into v2_facility_renewal_runs (facility_id, prior_entitlement_id, run_at, status, note)
        select f.facility_id, f.entitlement_id, ${input.now}::timestamptz,
               case
                 when exists (select 1 from active_entitlement) then 'skipped'
                 when exists (select 1 from spent_this_period) then 'skipped'
                 when f.renewal_opt_in = false then 'skipped'
                 else 'insufficient_funds'
               end,
               case
                 when exists (select 1 from active_entitlement) then 'Pro still active; nothing to renew.'
                 when exists (select 1 from spent_this_period) then 'Already renewed for this period; nothing to renew.'
                 when f.renewal_opt_in = false then 'No renewal opt-in; facility stays pro_expired.'
                 else 'Opt-in set but wallet balance is below the Pro price.'
               end
        from facility f
        returning facility_id, status, note
      `);
      const staleRow = (staleRows as Record<string, unknown>[])[0];
      const fallbackStatus = staleRow ? String(staleRow.status) : 'skipped';
      return {
        facilityId: input.facilityId,
        renewed: false,
        reason: fallbackStatus === 'insufficient_funds' ? 'insufficient_funds' : 'not_due_or_no_opt_in',
        newEntitlementId: null,
        endsAt: null,
        spendLedgerEntryId: null,
        status: fallbackStatus,
      };
    },

// ── Buyer Pro (NW-13h, D-K). Favorites + compare quota + account Pro plan. ──────────

    async listFavorites(input: { authUserId: string }): Promise<FavoritesResult> {
      const rows = await retryDatabase(() => sql`
        select f.id as favorite_id, f.facility_id, fac.name as facility_name, fac.category as facility_category, f.created_at
        from v2_account_favorites f
        join v2_accounts a on a.id = f.account_id
        join v2_facilities fac on fac.id = f.facility_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        order by f.created_at desc, f.id desc
        limit 100
      `);
      return {
        favorites: (rows as Record<string, unknown>[]).map((row) => ({
          id: String(row.favorite_id),
          facilityId: String(row.facility_id),
          facilityName: String(row.facility_name),
          facilityCategory: String(row.facility_category ?? 'Local supply'),
          createdAt: new Date(String(row.created_at)).toISOString(),
        })),
      };
    },

    async addFavorite(input: { authUserId: string; facilityId: string }): Promise<{ favoriteId: string; facilityId: string }> {
      const rows = await retryDatabase(() => sql`
        insert into v2_account_favorites (account_id, facility_id)
        select a.id, ${input.facilityId}::uuid
        from v2_accounts a
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        on conflict (account_id, facility_id) do nothing
        returning id, facility_id
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new BuyerSearchPolicyError('ACCOUNT_UNAVAILABLE');
      return { favoriteId: String(row.id), facilityId: String(row.facility_id) };
    },

    async removeFavorite(input: { authUserId: string; facilityId: string }): Promise<{ removed: true }> {
      const rows = await retryDatabase(() => sql`
        delete from v2_account_favorites f
        using v2_accounts a
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and f.facility_id = ${input.facilityId}::uuid
          and f.account_id = a.id
        returning f.id
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new BuyerSearchPolicyError('NOT_FOUND');
      return { removed: true };
    },

    async getBuyerProStatus(input: { authUserId: string }): Promise<BuyerProStatus | null> {
      const rows = await retryDatabase(() => sql`
        with account as (
          select a.id as account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ), entitlement as (
          select e.id, e.state, e.starts_at, e.ends_at, e.price_minor, e.billing_currency, e.renewal_opt_in
          from v2_buyer_pro_entitlements e
          join account a on a.account_id = e.account_id
          order by e.created_at desc, e.id desc
          limit 1
        ), wallet as (
          select w.id as wallet_id
          from v2_wallets w
          join account a on a.account_id = w.account_id
        ), balance as (
          select coalesce(sum(case when e.kind in ('recharge', 'bonus_grant', 'reversal', 'coupon_credit') then e.amount_minor else -e.amount_minor end), 0)::int as balance_minor
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.status = 'confirmed'
        ), credits as (
          select coalesce(plan, 'free') as plan, monthly_quota
          from v2_buyer_credit_accounts c
          join account a on a.account_id = c.buyer_account_id
        )
        select
          a.account_id,
          e.id as entitlement_id, e.state as entitlement_state, e.starts_at, e.ends_at,
          coalesce(e.renewal_opt_in, false) as renewal_opt_in,
          coalesce(e.price_minor, ${convertUsdMinorToLocal(OMNI_PLAN_PRICES_USD_MINOR.buyerPro, OMNI_DEFAULT_LOCAL_CURRENCY)})::int as pro_price_minor,
          coalesce(e.billing_currency, ${OMNI_DEFAULT_LOCAL_CURRENCY}) as billing_currency,
          ${OMNI_PLAN_PRICES_USD_MINOR.buyerPro}::int as base_pro_price_usd_minor,
          ${OMNI_BASE_CURRENCY} as base_billing_currency,
          b.balance_minor,
          coalesce(c.plan, 'free') as credit_plan
        from account a
        cross join lateral (select * from entitlement) e
        cross join lateral (select * from balance) b
        cross join lateral (select * from credits) c
      `);
      const row = (rows as Record<string, unknown>[])[0];
      // A missing row means the authenticated identity has no account yet — a
      // provisioning precondition, not a policy violation. Returning null lets
      // the HTTP layer answer 403 ACCOUNT_UNAVAILABLE like /api/v2/account/context
      // instead of surfacing 409 POLICY_REJECTED.
      if (!row) return null;
      const nowMs = Date.now();
      const endsAtMs = row.ends_at ? new Date(String(row.ends_at)).getTime() : null;
      const daysLeft = endsAtMs !== null ? Math.max(0, Math.ceil((endsAtMs - nowMs) / 86400000)) : 0;
      const activeNow = String(row.entitlement_state) === 'active' && (endsAtMs === null || endsAtMs > nowMs);
      const plan: BuyerProStatus['plan'] = activeNow ? 'pro_active' : row.entitlement_id ? 'pro_expired' : 'free';
      const price = Number(row.pro_price_minor);
      const balanceMinor = Number(row.balance_minor ?? 0);
      return {
        accountId: String(row.account_id),
        plan,
        entitlementId: row.entitlement_id ? String(row.entitlement_id) : null,
        startsAt: row.starts_at ? new Date(String(row.starts_at)).toISOString() : null,
        endsAt: row.ends_at ? new Date(String(row.ends_at)).toISOString() : null,
        renewalOptIn: Boolean(row.renewal_opt_in),
        daysLeft,
        proPriceMinor: price,
        billingCurrency: String(row.billing_currency),
        baseProPriceUsdMinor: Number(row.base_pro_price_usd_minor),
        baseBillingCurrency: String(row.base_billing_currency),
        walletBalanceMinor: balanceMinor,
        sufficientFunds: balanceMinor >= price,
        compareQuota: plan === 'pro_active' ? 5 : 1,
      };
    },

    async activateBuyerPro(input: { authUserId: string; now: string }): Promise<BuyerProActivationResult> {
      const reference = `buyer-pro:${input.authUserId}:${input.now.slice(0, 7)}`;
      // Canonical USD base ($5) converted to the local billing currency.
      const buyerProUsdMinor = OMNI_PLAN_PRICES_USD_MINOR.buyerPro;
      const buyerProLocalMinor = convertUsdMinorToLocal(buyerProUsdMinor, OMNI_DEFAULT_LOCAL_CURRENCY);
      const billingCurrency = OMNI_DEFAULT_LOCAL_CURRENCY;
      const rows = await retryDatabase(() => sql`
        with account as (
          select a.id as account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          for update of a
        ), existing_active as (
          select e.id, e.ends_at
          from v2_buyer_pro_entitlements e
          join account a on a.account_id = e.account_id
          where e.state = 'active' and e.ends_at > ${input.now}::timestamptz
          limit 1
        ), wallet as (
          select w.id as wallet_id
          from v2_wallets w
          join account a on a.account_id = w.account_id
          for update of w
        ), balance as (
          select coalesce(sum(case when e.kind in ('recharge', 'bonus_grant', 'reversal', 'coupon_credit') then e.amount_minor else -e.amount_minor end), 0)::int as balance_minor
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.status = 'confirmed'
        ), existing_spend as (
          select e.id, e.wallet_id, e.amount_minor
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.kind = 'buyer_pro_spend' and e.reference = ${reference}
          limit 1
        ), spend as (
          insert into v2_wallet_ledger_entries (wallet_id, kind, amount_minor, status, reference, created_at, confirmed_at)
          select w.wallet_id, 'buyer_pro_spend', ${buyerProLocalMinor}, 'confirmed', ${reference}, ${input.now}::timestamptz, ${input.now}::timestamptz
          from wallet w cross join balance b
          where not exists (select 1 from existing_active)
            and b.balance_minor >= ${buyerProLocalMinor}
            and not exists (select 1 from existing_spend)
          on conflict (wallet_id, kind, reference) do nothing
          returning id, wallet_id, amount_minor
        ), effective_spend as (
          select id from spend
          union all
          select id from existing_spend
          limit 1
        ), entitlement as (
          insert into v2_buyer_pro_entitlements (account_id, state, starts_at, ends_at, source, price_minor, billing_currency, renewal_opt_in)
          select a.account_id, 'active', ${input.now}::timestamptz, ${input.now}::timestamptz + interval '30 days', 'wallet', ${buyerProLocalMinor}, ${billingCurrency}, false
          from account a cross join effective_spend s
          where not exists (select 1 from existing_active)
          returning id, account_id, ends_at
        ), upgraded_plan as (
          insert into v2_buyer_credit_accounts (buyer_account_id, plan, monthly_quota, period_month)
          select a.account_id, 'pro', 100, to_char(${input.now}::timestamptz, 'YYYY-MM')
          from account a cross join effective_spend s
          on conflict (buyer_account_id) do update set
            plan = 'pro', monthly_quota = 100, updated_at = ${input.now}::timestamptz
          returning buyer_account_id, plan
        )
        select e.id, e.account_id, e.ends_at, s.id as spend_ledger_entry_id
        from entitlement e cross join effective_spend s
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new WalletPolicyError('Insufficient wallet balance to activate Buyer Pro.');
      return {
        accountId: String(row.account_id),
        entitlementId: String(row.id),
        plan: 'pro_active',
        endsAt: new Date(String(row.ends_at)).toISOString(),
        spendLedgerEntryId: String(row.spend_ledger_entry_id),
      };
    },

    async setBuyerProRenewalOptIn(input: { authUserId: string; optIn: boolean }): Promise<BuyerProOptInResult> {
      const rows = await retryDatabase(() => sql`
        with account as (
          select a.id as account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ), latest as (
          select e.id
          from v2_buyer_pro_entitlements e
          join account a on a.account_id = e.account_id
          order by e.created_at desc, e.id desc
          limit 1
        ), updated as (
          update v2_buyer_pro_entitlements e
          set renewal_opt_in = ${input.optIn}
          from latest l
          where e.id = l.id
          returning e.account_id, e.renewal_opt_in
        )
        select account_id, renewal_opt_in from updated
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new WalletPolicyError('Activate Buyer Pro once before choosing auto-renewal.');
      return { accountId: String(row.account_id), renewalOptIn: Boolean(row.renewal_opt_in) };
    },

    async renewBuyerPro(input: { authUserId: string; now: string }): Promise<BuyerProRenewalResult> {
      const periodKey = new Date(input.now).toISOString().slice(0, 7);
      const reference = `buyer-pro-renew:${input.authUserId}:${periodKey}`;
      // Canonical USD base ($5) converted to the local billing currency.
      const buyerProUsdMinor = OMNI_PLAN_PRICES_USD_MINOR.buyerPro;
      const buyerProLocalMinor = convertUsdMinorToLocal(buyerProUsdMinor, OMNI_DEFAULT_LOCAL_CURRENCY);
      const billingCurrency = OMNI_DEFAULT_LOCAL_CURRENCY;
      const rows = await retryDatabase(() => sql`
        with account as (
          select a.id as account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          for update of a
        ), existing_active as (
          select e.id
          from v2_buyer_pro_entitlements e
          join account a on a.account_id = e.account_id
          where e.state = 'active' and e.ends_at > ${input.now}::timestamptz
          limit 1
        ), wallet as (
          select w.id as wallet_id
          from v2_wallets w
          join account a on a.account_id = w.account_id
          for update of w
        ), balance as (
          select coalesce(sum(case when e.kind in ('recharge', 'bonus_grant', 'reversal', 'coupon_credit') then e.amount_minor else -e.amount_minor end), 0)::int as balance_minor
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.status = 'confirmed'
        ), existing_spend as (
          select e.id
          from v2_wallet_ledger_entries e
          join wallet w on w.wallet_id = e.wallet_id
          where e.kind = 'buyer_pro_spend' and e.reference = ${reference}
          limit 1
        ), spend as (
          insert into v2_wallet_ledger_entries (wallet_id, kind, amount_minor, status, reference, created_at, confirmed_at)
          select w.wallet_id, 'buyer_pro_spend', ${buyerProLocalMinor}, 'confirmed', ${reference}, ${input.now}::timestamptz, ${input.now}::timestamptz
          from wallet w cross join balance b
          where not exists (select 1 from existing_active)
            and b.balance_minor >= ${buyerProLocalMinor}
            and not exists (select 1 from existing_spend)
          on conflict (wallet_id, kind, reference) do nothing
          returning id
        ), effective_spend as (
          select id from spend
          union all
          select id from existing_spend
          limit 1
        ), entitlement as (
          insert into v2_buyer_pro_entitlements (account_id, state, starts_at, ends_at, source, price_minor, billing_currency, renewal_opt_in)
          select a.account_id, 'active', ${input.now}::timestamptz, ${input.now}::timestamptz + interval '30 days', 'wallet', ${buyerProLocalMinor}, ${billingCurrency}, true
          from account a cross join effective_spend s
          where not exists (select 1 from existing_active)
          returning id, account_id, ends_at
        )
        select e.id as entitlement_id, e.account_id, e.ends_at, s.id as spend_ledger_entry_id
        from entitlement e cross join effective_spend s
      `);
      const renewedRow = (rows as Record<string, unknown>[])[0];
      if (renewedRow) {
        return {
          accountId: String(renewedRow.account_id),
          renewed: true,
          reason: 'renewed',
          newEntitlementId: String(renewedRow.entitlement_id),
          endsAt: new Date(String(renewedRow.ends_at)).toISOString(),
          spendLedgerEntryId: String(renewedRow.spend_ledger_entry_id ?? ''),
          status: 'succeeded',
        };
      }
      const staleRows = await retryDatabase(() => sql`
        with account as (
          select a.id as account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ), latest as (
          select e.id as entitlement_id, coalesce(e.renewal_opt_in, false) as renewal_opt_in
          from v2_buyer_pro_entitlements e
          join account a on a.account_id = e.account_id
          order by e.created_at desc, e.id desc
          limit 1
        ), active_entitlement as (
          select e.id
          from v2_buyer_pro_entitlements e
          join account a on a.account_id = e.account_id
          where e.state = 'active' and e.ends_at > ${input.now}::timestamptz
          limit 1
        ), spent_this_period as (
          select e.id
          from v2_wallet_ledger_entries e
          join v2_wallets w on w.id = e.wallet_id
          join account a on a.account_id = w.account_id
          where e.kind = 'buyer_pro_spend' and e.reference = ${reference}
          limit 1
        )
        insert into v2_buyer_pro_renewal_runs (account_id, prior_entitlement_id, run_at, status, note)
        select a.account_id, l.entitlement_id, ${input.now}::timestamptz,
               case
                 when exists (select 1 from active_entitlement) then 'skipped'
                 when exists (select 1 from spent_this_period) then 'skipped'
                 when coalesce(l.renewal_opt_in, false) = false then 'skipped'
                 else 'insufficient_funds'
               end,
               case
                 when exists (select 1 from active_entitlement) then 'Buyer Pro still active; nothing to renew.'
                 when exists (select 1 from spent_this_period) then 'Already renewed for this period; nothing to renew.'
                 when coalesce(l.renewal_opt_in, false) = false then 'No renewal opt-in; buyer stays pro_expired.'
                 else 'Opt-in set but wallet balance is below the Buyer Pro price.'
               end
        from account a left join lateral (select * from latest) l on true
        returning account_id, status
      `);
      const staleRow = (staleRows as Record<string, unknown>[])[0];
      return {
        accountId: staleRow ? String(staleRow.account_id) : input.authUserId,
        renewed: false,
        reason: staleRow && String(staleRow.status) === 'insufficient_funds' ? 'insufficient_funds' : 'not_due_or_no_opt_in',
        newEntitlementId: null,
        endsAt: null,
        spendLedgerEntryId: null,
        status: staleRow ? String(staleRow.status) : 'skipped',
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
            and ${input.quantityAvailable} <= greatest(p.quantity_allocated_omni - p.quantity_reserved_omni, 0)
        ),
        inserted as (
          insert into v2_availability_responses
            (request_id, facility_id, responder_account_id, status, quantity_available, price_minor, offer_snapshot, seller_message, idempotency_key)
          select e.request_id, e.facility_id, e.seller_account_id, ${input.status}, e.quantity_available, e.price_minor,
                 jsonb_build_object('unit_price_minor', e.price_minor, 'currency', 'XOF'), ${input.sellerMessage}, ${input.idempotencyKey}
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
      now?: string;
      /** FF-5 — TTL paramétrable de la fenêtre QR (minutes). Défaut 10. */
      ttlMinutes?: number;
    }): Promise<QrTokenIssuePersistenceResult> {
      const token = randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const issuedAt = input.now ?? new Date().toISOString();
      const ttlMinutes = resolveQrTtlMinutes(input.ttlMinutes);
      const expiresAt = qrExpiryFrom(issuedAt, ttlMinutes);
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
            and coalesce((select e.state from v2_transaction_events e where e.transaction_id = s.transaction_id order by e.created_at desc, e.state_rank desc limit 1), 'intent_created') in ('intent_created', 'qr_ready')
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
            and coalesce((select e.state from v2_transaction_events e where e.transaction_id = s.transaction_id order by e.created_at desc, e.state_rank desc limit 1), 'intent_created') = 'intent_created'
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

    // FF-5 — révocation d'un QR non encore vérifié. Le vendeur (ou un opérateur)
    // peut invalider un lien QR émis par erreur avant tout scan ; l'acheteur peut
    // alors ré-émettre. Sans effet après vérification (verrou).
    async revokeQrToken(input: {
      authUserId: string;
      transactionId: string;
      correlationId: string;
      now?: string;
    }): Promise<{ transactionId: string; revoked: boolean }> {
      const now = input.now ?? new Date().toISOString();
      const rows = await retryDatabase(() => sql`
        with actor as (
          select a.id as actor_account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ),
        eligible as (
          select q.transaction_id, act.actor_account_id
          from v2_qr_tokens q
          join v2_transaction_members m on m.transaction_id = q.transaction_id
          join v2_accounts a2 on a2.id = m.account_id
          join actor act on true
          where q.transaction_id = ${input.transactionId}::uuid
            and a2.auth_user_id = ${input.authUserId}
            and q.verified_at is null
            and q.replay_count = 0
            and q.expires_at > ${now}::timestamptz
          for update of q
        ),
        revoked as (
          update v2_qr_tokens q
          set expires_at = ${now}::timestamptz
          from eligible e
          where q.transaction_id = e.transaction_id
          returning q.transaction_id
        ),
        audit as (
          insert into v2_audit_events
            (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select e.actor_account_id, 'qr_revoked', 'transaction', e.transaction_id::text, ${input.correlationId}, 'revoked_before_scan', ${now}::timestamptz
          from eligible e
          join revoked r on r.transaction_id = e.transaction_id
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        )
        select transaction_id from revoked limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new TransactionPolicyError('QR revocation requires an authorized unverified transaction QR.');
      return { transactionId: String(row.transaction_id), revoked: true };
    },

    async createPurchaseIntent(input: {
      authUserId: string;
      responseId: string;
      idempotencyKey: string;
      correlationId: string;
    }): Promise<PurchaseIntentPersistenceResult> {
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
        -- FF-8 : pas de survente au verrou. Le stock disponible est le stock déclaré
        -- moins les réservations vivantes ; une intention déjà existante (replay
        -- idempotent) ne déréserve pas et ne revérifie donc pas la garde.
        reserved as (
          select p.id as product_id,
                 greatest(p.quantity_allocated_omni - p.quantity_reserved_omni, 0) as available
          from v2_products p
          join eligible e on e.product_id = p.id
        ),
        stock_ok as (
          select e.*
          from eligible e
          join reserved rs on rs.product_id = e.product_id
          where rs.available >= e.quantity
             or exists (select 1 from existing)
        ),
        intent_upsert as (
          insert into v2_purchase_intents
            (buyer_account_id, response_id, transaction_id, idempotency_key, state)
          select b.buyer_account_id, e.response_id, gen_random_uuid(), ${input.idempotencyKey}, 'active'
          from buyer b
          cross join stock_ok e
          where not exists (select 1 from existing)
          on conflict (buyer_account_id, idempotency_key)
          do update set idempotency_key = excluded.idempotency_key
          returning id, response_id, transaction_id, buyer_account_id, state
        ),
        -- FF-8 : seule une intention réellement créée réserve du stock ; un replay
        -- idempotent retrouve la ligne existante et ne réserve pas deux fois.
        fresh_intent as (
          select i.* from intent_upsert i
          where not exists (select 1 from existing x where x.id = i.id)
        ),
        product_reserve as (
          update v2_products p
          set quantity_reserved_omni = p.quantity_reserved_omni + fi.quantity
          from (
            select e.product_id, e.quantity
            from fresh_intent i
            join stock_ok e on e.response_id = i.response_id
          ) fi
          where p.id = fi.product_id
          returning p.id
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
        ),
        -- L'éligibilité QR consomme le RETURNING de intent_upsert : les lignes
        -- insérées (snapshot/members) ne sont pas visibles par un re-scan dans la
        -- même instruction (snapshot Postgres), ce qui laissait le QR mort.
        qr_eligible as (
          select i.transaction_id, i.buyer_account_id
          from intent_upsert i
        ),
        qr_token_insert as (
          insert into v2_qr_tokens (transaction_id, token_hash, expires_at, verified_at, replay_count)
          select e.transaction_id, ${tokenHash}, ${expiresAt}::timestamptz, null, 0
          from qr_eligible e
          on conflict (transaction_id) do update
            set token_hash = excluded.token_hash,
                expires_at = excluded.expires_at,
                verified_at = null,
                replay_count = 0
          returning transaction_id, expires_at
        ),
        qr_event_insert as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
          select i.transaction_id, e.buyer_account_id, 'qr_ready', jsonb_build_object('issuer', 'buyer'), now()
          from qr_token_insert i
          join qr_eligible e on e.transaction_id = i.transaction_id
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        ),
        qr_audit_insert as (
          insert into v2_audit_events
            (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select e.buyer_account_id, 'qr_issued', 'transaction', i.transaction_id::text, ${input.correlationId}, 'auto_at_intent', now()
          from qr_token_insert i
          join qr_eligible e on e.transaction_id = i.transaction_id
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        )
        select i.id, i.response_id, i.transaction_id, i.buyer_account_id, i.state, q.expires_at,
               (select count(*)::int from eligible) as eligible_count,
               (select count(*)::int from stock_ok) as stock_ok_count
        from intent_result i
        left join qr_token_insert q on q.transaction_id = i.transaction_id
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) {
        // Distingue « stock épuisé entre la réponse et l'intention » (état d'usage)
        // de « réponse jamais éligible » (erreur de sélection), pour un message
        // d'erreur honnête côté acheteur.
        const diagnostic = (await retryDatabase(() => sql`
          select
            (select count(*)::int from v2_availability_responses ar
             join v2_availability_requests r on r.id = ar.request_id
             join v2_facilities f on f.id = ar.facility_id
             join v2_accounts b on b.id = r.buyer_account_id
             where ar.id = ${input.responseId}::uuid
               and ar.status in ('available', 'partial', 'corrected')
               and b.auth_user_id = ${input.authUserId}
               and b.suspended_at is null) as eligible_count,
            (select greatest(p.quantity_allocated_omni - p.quantity_reserved_omni, 0)
             from v2_products p
             join v2_availability_responses ar on ar.id = ${input.responseId}::uuid
             join v2_availability_requests r on r.id = ar.request_id
             where p.id = r.product_id) as available
        `)) as Record<string, unknown>[];
        const eligibleCount = Number(diagnostic[0]?.eligible_count ?? 0);
        const available = diagnostic[0]?.available === null || diagnostic[0]?.available === undefined ? null : Number(diagnostic[0].available);
        if (eligibleCount > 0 && available !== null) {
          throw new PurchaseIntentPolicyError('This offer is no longer available: the remaining stock has been reserved by another transaction.');
        }
        throw new PurchaseIntentPolicyError('No eligible availability response belongs to the authenticated buyer.');
      }
      if (String(row.response_id) !== input.responseId) {
        throw new PurchaseIntentPolicyError('The idempotency key is already used for a different purchase intent.');
      }
      return {
        intentId: String(row.id),
        responseId: String(row.response_id),
        transactionId: String(row.transaction_id),
        buyerAccountId: String(row.buyer_account_id),
        state: String(row.state),
        qrToken: row.expires_at ? token : null,
        qrExpiresAt: row.expires_at ? new Date(String(row.expires_at)).toISOString() : null,
      };
    },

    /**
     * RT-D2 — un acheteur détient-il une intention d'achat vivante ?
     *
     * Sert au verrouillage d'itinéraire : le fondateur a décidé (2026-09-24) que
     * l'itinéraire réel et son guidage sont accessibles **uniquement après une
     * intention réelle d'achat**.
     *
     * Le critère est `pi.state = 'active'`, et rien d'autre. C'est exactement la
     * durée de vie de l'intention : `createPurchaseIntent` la pose à `active`, le
     * balayage d'expiration la passe à `expired` après inactivité (60 min), et la
     * clôture la passe à `completed`. Une intention dont le QR a été vérifié
     * n'expire JAMAIS : elle reste `active` jusqu'à la clôture — donc l'itinéraire
     * reste ouvert pendant toute la remise, ce qui est le seul moment où on en a
     * besoin.
     *
     * CE QUI ÉTAIT FAUX AVANT : on exigeait en plus un jeton QR **vivant**
     * (`q.expires_at > now()`), dont le TTL est de 10 minutes. Un acheteur qui
     * avait choisi, payé et scanné se voyait donc refuser l'itinéraire dès que le
     * QR avait dix minutes — c'est-à-dire presque toujours, puisque l'itinéraire
     * sert justement à se rendre sur place APRÈS le scan. Mesure en base au moment
     * du diagnostic : 12 jetons QR, 0 vivant.
     *
     * L'intention est une **décision d'achat** ; le QR est un **geste de
     * vérification**. Les confondre fermait la fonction au moment où elle devient
     * utile. On penche volontairement du côté de l'acheteur : mieux vaut servir un
     * itinéraire à une intention légèrement périmée que d'en refuser un à un
     * acheteur engagé (même philosophie que « une panne de base ne doit pas fermer
     * un itinéraire »).
     */
    async hasLivePurchaseIntent(input: { authUserId: string }): Promise<boolean> {
      const rows = await retryDatabase(() => sql`
        select 1
        from v2_purchase_intents pi
        join v2_accounts a on a.id = pi.buyer_account_id
        where a.auth_user_id = ${input.authUserId}
          and pi.state = 'active'
        limit 1
      `);
      return (rows as unknown[]).length > 0;
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
              order by e.created_at desc, e.state_rank desc
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
              order by e.created_at desc, e.state_rank desc
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

    async listTransactionMessages(input: { authUserId: string; transactionId: string }): Promise<{ transactionId: string; messages: TransactionMessage[] } | null> {
      const rows = await retryDatabase(() => sql`
        select m.id, m.transaction_id, m.sender_account_id, m.body, m.created_at, m.seen_at,
               tm.role as sender_role
        from v2_transaction_messages m
        join v2_transaction_members viewer on viewer.transaction_id = m.transaction_id
        join v2_transaction_members tm on tm.transaction_id = m.transaction_id and tm.account_id = m.sender_account_id
        join v2_accounts a on a.id = viewer.account_id
        where m.transaction_id = ${input.transactionId}::uuid
          and a.auth_user_id = ${input.authUserId}
          and viewer.role in ('buyer', 'seller')
        order by m.created_at asc, m.id asc
      `);
      const mapped = (rows as Record<string, unknown>[]).map((row) => ({
        id: String(row.id),
        transactionId: String(row.transaction_id),
        senderRole: String(row.sender_role) as TransactionMessage['senderRole'],
        body: String(row.body),
        createdAt: new Date(String(row.created_at)).toISOString(),
        seenAt: row.seen_at ? new Date(String(row.seen_at)).toISOString() : null,
      }));
      return { transactionId: input.transactionId, messages: mapped };
    },
    async createTransactionMessage(input: { authUserId: string; transactionId: string; body: string }): Promise<TransactionMessage> {
      const body = input.body.trim();
      if (!body || body.length > 2000) throw new TransactionPolicyError('MESSAGE_INVALID');
      const rows = await retryDatabase(() => sql`
        with sender as (
          select m.account_id, m.role
          from v2_transaction_members m
          join v2_accounts a on a.id = m.account_id
          where m.transaction_id = ${input.transactionId}::uuid
            and a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          limit 1
        ), inserted as (
          insert into v2_transaction_messages (transaction_id, sender_account_id, body)
          select ${input.transactionId}::uuid, account_id, ${body}
          from sender
          returning id, transaction_id, sender_account_id, body, created_at, seen_at
        )
        select i.id, i.transaction_id, i.sender_account_id, i.body, i.created_at, i.seen_at, s.role as sender_role
        from inserted i join sender s on s.account_id = i.sender_account_id
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) throw new TransactionPolicyError('FORBIDDEN');
      return {
        id: String(row.id),
        transactionId: String(row.transaction_id),
        senderRole: String(row.sender_role) as TransactionMessage['senderRole'],
        body: String(row.body),
        createdAt: new Date(String(row.created_at)).toISOString(),
        seenAt: row.seen_at ? new Date(String(row.seen_at)).toISOString() : null,
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
          f.name as seller_facility_name,
          f.contact_phone as seller_contact_phone,
          f.contact_whatsapp as seller_contact_whatsapp,
          m.role as actor_role,
          coalesce((
            select e.state
            from v2_transaction_events e
            where e.transaction_id = s.transaction_id
            order by e.created_at desc, e.state_rank desc
            limit 1
          ), 'intent_created') as current_state
        from v2_transaction_snapshots s
        join v2_transaction_members m on m.transaction_id = s.transaction_id
        join v2_accounts a on a.id = m.account_id
        left join v2_facilities f on f.id = s.facility_id
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
        sellerFacilityName: row.seller_facility_name === null || row.seller_facility_name === undefined ? null : String(row.seller_facility_name),
        sellerContactPhone: row.seller_contact_phone === null || row.seller_contact_phone === undefined ? null : String(row.seller_contact_phone),
        sellerContactWhatsapp: row.seller_contact_whatsapp === null || row.seller_contact_whatsapp === undefined ? null : String(row.seller_contact_whatsapp),
      };
    },

    // FF-2 — transactions non terminales de l'appelant (acheteur ou vendeur), pour
    // permettre de REPRENDRE une transaction en cours après avoir quitté l'écran.
    // Lecture seule : aucune mutation, aucune annulation possible ici.
    async listOpenTransactions(input: { authUserId: string }): Promise<{ transactions: Array<{
      transactionId: string;
      state: string;
      actorRole: 'buyer' | 'seller';
      productId: string;
      productName: string | null;
      facilityId: string;
      facilityName: string | null;
      quantity: number;
      netAmountMinor: number;
      lastEventAt: string;
      createdAt: string;
    }> }> {
      const rows = await retryDatabase(() => sql`
        with actor as (
          select a.id as account_id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
        ),
        mine as (
          select
            s.transaction_id,
            s.product_id,
            s.facility_id,
            s.quantity,
            s.net_amount_minor,
            s.created_at,
            m.role as actor_role,
            coalesce((
              select e.state
              from v2_transaction_events e
              where e.transaction_id = s.transaction_id
              order by e.created_at desc, e.state_rank desc
              limit 1
            ), 'intent_created') as current_state,
            coalesce((
              select e.created_at
              from v2_transaction_events e
              where e.transaction_id = s.transaction_id
              order by e.created_at desc, e.state_rank desc
              limit 1
            ), s.created_at) as last_event_at
          from v2_transaction_snapshots s
          join v2_transaction_members m on m.transaction_id = s.transaction_id
          join actor a on a.account_id = m.account_id
        )
        select
          mi.transaction_id,
          mi.current_state,
          mi.actor_role,
          mi.product_id,
          p.name as product_name,
          mi.facility_id,
          f.name as facility_name,
          mi.quantity,
          mi.net_amount_minor,
          mi.last_event_at,
          mi.created_at
        from mine mi
        left join v2_products p on p.id = mi.product_id
        left join v2_facilities f on f.id = mi.facility_id
        where mi.current_state <> 'closed'
        order by mi.last_event_at desc
        limit 50
      `);
      return {
        transactions: (rows as Record<string, unknown>[]).map((row) => ({
          transactionId: String(row.transaction_id),
          state: String(row.current_state),
          actorRole: String(row.actor_role) as 'buyer' | 'seller',
          productId: String(row.product_id),
          productName: row.product_name === null || row.product_name === undefined ? null : String(row.product_name),
          facilityId: String(row.facility_id),
          facilityName: row.facility_name === null || row.facility_name === undefined ? null : String(row.facility_name),
          quantity: Number(row.quantity),
          netAmountMinor: Number(row.net_amount_minor),
          lastEventAt: new Date(String(row.last_event_at)).toISOString(),
          createdAt: new Date(String(row.created_at)).toISOString(),
        })),
      };
    },

    // FF-3 — planificateur d'expiration (serveur). Une intention parquée non verrouillée
    // (aucun événement 'qr_verified') qui dépasse sa fenêtre est expirée ; la demande de
    // dispo associée passe 'expired'. Après le verrou, le temps ne libère jamais : il ne
    // fait que relancer/notifier (D-TXN-8). Idempotent : la clause where n'attrape que
    // les états vivants.
    async sweepExpiredIntents(input: { now: string; correlationId: string; windowMinutes?: number }): Promise<{ expired: number; requestIds: string[] }> {
      const windowMinutes = Number.isInteger(input.windowMinutes) && (input.windowMinutes as number) > 0 ? (input.windowMinutes as number) : 60;
      const rows = await retryDatabase(() => sql`
        with stale as (
          select s.intent_id, s.transaction_id, pi.buyer_account_id, r.id as request_id
          from v2_purchase_intents pi
          join v2_transaction_snapshots s on s.intent_id = pi.id
          join v2_availability_responses ar on ar.id = pi.response_id
          join v2_availability_requests r on r.id = ar.request_id
          where pi.state = 'active'
            and s.created_at < ${input.now}::timestamptz - (${windowMinutes} * interval '1 minute')
            and not exists (
              select 1 from v2_transaction_events e
              where e.transaction_id = s.transaction_id
                and e.state = 'qr_verified'
            )
        ),
        intent_expired as (
          update v2_purchase_intents pi
          set state = 'expired'
          from stale st
          where pi.id = st.intent_id
            and pi.state = 'active'
          returning pi.id
        ),
        request_expired as (
          update v2_availability_requests r
          set status = 'expired'
          from stale st
          join intent_expired ie on ie.id = st.intent_id
          where r.id = st.request_id
            and r.status in ('draft', 'submitted', 'responding')
          returning r.id
        ),
        -- FF-8 : libération du stock à l'expiration. Ancré sur intent_expired
        -- (update … returning) : idempotent, une intention déjà expirée ne libère
        -- pas deux fois. Le stock déclaré est intact, seule la réservation tombe.
        stock_release as (
          update v2_products p
          set quantity_reserved_omni = greatest(p.quantity_reserved_omni - s.quantity, 0)
          from intent_expired ie
          join v2_transaction_snapshots s on s.intent_id = ie.id
          where p.id = s.product_id
          returning p.id
        ),
        audited as (
          insert into v2_audit_events (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
          select st.buyer_account_id, 'intent_expired', 'transaction', st.transaction_id::text, ${input.correlationId}, 'stalled_before_lock', ${input.now}::timestamptz
          from stale st
          join intent_expired ie on ie.id = st.intent_id
          on conflict (correlation_id, event_type, entity_type, entity_id) do nothing
          returning entity_id
        )
        select st.transaction_id, st.request_id from stale st
        join intent_expired ie on ie.id = st.intent_id
      `);
      const typed = rows as Record<string, unknown>[];
      return {
        expired: typed.length,
        requestIds: typed.map((row) => String(row.request_id)),
      };
    },

    async getOrCreateCreditStanding(input: { authUserId: string }): Promise<BuyerCreditSummary | null> {
      const rows = await retryDatabase(() => sql`
        with account as (
          insert into v2_accounts (auth_user_id, onboarding_state)
          select ${input.authUserId}, 'buyer_ready'
          on conflict (auth_user_id) do update set updated_at = now()
          returning id
        ),
        standing as (
          insert into v2_buyer_credit_accounts (buyer_account_id, plan, monthly_quota, period_month)
          select a.id, 'free', 3, to_char(now(), 'YYYY-MM')
          from account a
          on conflict (buyer_account_id) do update set
            period_month = case
              when v2_buyer_credit_accounts.period_month <> to_char(now(), 'YYYY-MM') then to_char(now(), 'YYYY-MM')
              else v2_buyer_credit_accounts.period_month
            end,
            credits_used = case
              when v2_buyer_credit_accounts.period_month <> to_char(now(), 'YYYY-MM') then 0
              else v2_buyer_credit_accounts.credits_used
            end,
            updated_at = now()
          returning buyer_account_id, plan, monthly_quota, credits_used, extra_credits, period_month
        )
        select * from standing
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return null;
      return {
        accountId: String(row.buyer_account_id),
        plan: String(row.plan) as 'free' | 'pro',
        monthlyQuota: Number(row.monthly_quota),
        creditsUsed: Number(row.credits_used),
        extraCredits: Number(row.extra_credits),
        creditsRemaining: Number(row.monthly_quota) + Number(row.extra_credits) - Number(row.credits_used),
        periodMonth: String(row.period_month),
      };
    },

    async getBuyerCreditSummary(input: { authUserId: string }): Promise<BuyerCreditSummary | null> {
      const rows = await retryDatabase(() => sql`
        select c.buyer_account_id, c.plan, c.monthly_quota, c.credits_used, c.extra_credits, c.period_month
        from v2_buyer_credit_accounts c
        join v2_accounts a on a.id = c.buyer_account_id and a.auth_user_id = ${input.authUserId}
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return null;
      return {
        accountId: String(row.buyer_account_id),
        plan: String(row.plan) as 'free' | 'pro',
        monthlyQuota: Number(row.monthly_quota),
        creditsUsed: Number(row.credits_used),
        extraCredits: Number(row.extra_credits),
        creditsRemaining: Number(row.monthly_quota) + Number(row.extra_credits) - Number(row.credits_used),
        periodMonth: String(row.period_month),
      };
    },

    async createAvailabilityRequest(input: {
      authUserId: string;
      productId: string;
      facilityId: string;
      quantity: number;
      budgetMode: 'unlimited' | 'maximum';
      budgetMinor: number | null;
      deliveryMode: 'retrait' | 'livraison';
      note: string | null;
      idempotencyKey: string;
    }): Promise<AvailabilityResult> {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const rows = await retryDatabase(() => sql`
        with valid_selection as (
          select p.id as product_id, f.id as facility_id
          from v2_products p
          join v2_facilities f on f.id = ${input.facilityId}::uuid and p.facility_id = f.id
          left join v2_entities e on e.id = coalesce(p.entity_id, f.entity_id)
          where p.id = ${input.productId}::uuid
            and p.publication_state = 'published'
            and coalesce(e.trust_state, f.trust_state) in ('certified', 'unconfirmed', 'confirmed')
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
            (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, budget_minor, delivery_mode, request_note, status, idempotency_key, expires_at)
          select a.id, s.product_id, array[s.facility_id], ${input.quantity}, ${input.budgetMode}, ${input.budgetMinor}, ${input.deliveryMode}, ${input.note}, 'submitted', ${input.idempotencyKey}, ${expiresAt}::timestamptz
          from account a
          cross join valid_selection s
          join wallet w on w.account_id = a.id
          on conflict (buyer_account_id, idempotency_key) do nothing
          returning id, product_id, facility_scope[1] as facility_id, requested_quantity, budget_mode, budget_minor, delivery_mode, request_note, status, expires_at
        ),
        request_result as (
          select id, product_id, facility_id, requested_quantity, budget_mode, budget_minor, delivery_mode, request_note, status, expires_at
          from request_insert
          union all
          select r.id, r.product_id, r.facility_scope[1] as facility_id, r.requested_quantity, r.budget_mode, r.budget_minor, r.delivery_mode, r.request_note, r.status, r.expires_at
          from v2_availability_requests r
          where r.buyer_account_id = (select id from account)
            and r.idempotency_key = ${input.idempotencyKey}
        )
        select * from request_result limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) {
        throw new AvailabilityPolicyError('The selected product is not published at the requested facility.');
      }
      if (
        String(row.product_id) !== input.productId
        || String(row.facility_id) !== input.facilityId
        || Number(row.requested_quantity) !== input.quantity
        || String(row.budget_mode) !== input.budgetMode
        || (row.budget_minor === null ? null : Number(row.budget_minor)) !== input.budgetMinor
        || String(row.delivery_mode) !== input.deliveryMode
        || (row.request_note === null ? null : String(row.request_note)) !== input.note
      ) {
        throw new AvailabilityPolicyError('The idempotency key is already used for a different availability request.');
      }
      // Source of truth for remaining credit balance at this moment (no debit: manual check is free).
      const standing = await this.getOrCreateCreditStanding({ authUserId: input.authUserId });
      return {
        requestId: String(row.id),
        productId: String(row.product_id),
        facilityId: String(row.facility_id),
        status: String(row.status) as AvailabilityResult['status'],
        expiresAt: new Date(String(row.expires_at)).toISOString(),
        deliveryMode: String(row.delivery_mode) as 'retrait' | 'livraison',
        note: row.request_note === null ? null : String(row.request_note),
        message: 'Request sent. The facility can now confirm the live availability.',
        creditCost: 0,
        creditsRemaining: standing ? standing.creditsRemaining : 0,
        monthlyQuota: standing ? standing.monthlyQuota : 0,
        plan: standing ? standing.plan : 'free',
      };
    },
    async createBulkAvailabilityRequest(input: {
      authUserId: string;
      productId: string;
      facilityIds: string[];
      quantity: number;
      budgetMode: 'unlimited' | 'maximum';
      budgetMinor: number | null;
      deliveryMode: 'retrait' | 'livraison';
      note: string | null;
      idempotencyKey: string;
    }): Promise<BulkAvailabilityResult> {
      if (input.facilityIds.length < 2) {
        throw new AvailabilityPolicyError('A bulk request must target at least 2 facilities. Use single availability request for one facility.');
      }
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const standing = await this.getOrCreateCreditStanding({ authUserId: input.authUserId });
      // D-C5 (Seed §Modèle éco « 1 besoin = 1 bulk ») : le coût ne dépend PAS du nombre de
      // fournisseurs. Un besoin — « ce produit, chez qui ? » — vaut 1 crédit, que la réponse
      // vienne de 2 ou de 500 fournisseurs. La formule précédente `ceil(N/100)` facturait des
      // LIEUX : elle punissait exactement le comportement qu'Omni existe pour rendre possible
      // (« contacter 30 vendeurs un par un n'est pas une solution »).
      const creditCost = 1;
      const uniqueIdList = Array.from(new Set(input.facilityIds.map((id) => id.trim())));
      if (uniqueIdList.length !== input.facilityIds.length) {
        throw new AvailabilityPolicyError('Duplicate facilityIds are not allowed in a bulk request.');
      }
      if (standing && standing.creditsRemaining < creditCost) {
        throw new InsufficientCreditsError(`This bulk need costs 1 bulk credit (it does not grow with the number of suppliers). You have ${standing.creditsRemaining}. Missing ${creditCost - standing.creditsRemaining}. Recharge with packs to send.`);
      }
      const rows = await retryDatabase(() => sql`
        with valid_selection as (
          select p.id as product_id, f.id as facility_id
          from v2_products p
          join v2_facilities f on f.id = any((${uniqueIdList})::text[]::uuid[])
            and p.facility_id = f.id
          left join v2_entities e on e.id = coalesce(p.entity_id, f.entity_id)
          where p.id = ${input.productId}::uuid
            and p.publication_state = 'published'
            and coalesce(e.trust_state, f.trust_state) in ('certified', 'unconfirmed', 'confirmed')
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
            (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, budget_minor, delivery_mode, request_note, status, idempotency_key, expires_at)
          select a.id, s.product_id, (${uniqueIdList})::text[]::uuid[], ${input.quantity}, ${input.budgetMode}, ${input.budgetMinor}, ${input.deliveryMode}, ${input.note}, 'submitted', ${input.idempotencyKey}, ${expiresAt}::timestamptz
          from account a
          cross join (select distinct product_id from valid_selection) s
          join wallet w on w.account_id = a.id
          on conflict (buyer_account_id, idempotency_key) do nothing
          returning id, product_id, facility_scope, requested_quantity, budget_mode, budget_minor, delivery_mode, request_note, status, expires_at
        ),
        credit_spend as (
          update v2_buyer_credit_accounts c
          set credits_used = c.credits_used + ${creditCost}
          where c.buyer_account_id = (select id from account)
            and exists (select 1 from request_insert)
            and c.monthly_quota + c.extra_credits - c.credits_used >= ${creditCost}
          returning c.credits_used, c.monthly_quota, c.extra_credits
        ),
        credit_ledger_insert as (
          insert into v2_availability_credit_ledger (buyer_account_id, kind, amount, reason, request_id)
          select a.id, 'bulk_debit', - ${creditCost}, 'bulk need over ' || (select cardinality(facility_scope) from request_insert) || ' facilities (1 credit per need)', r.id
          from request_insert r
          cross join account a
          returning id
        ),
        request_result as (
          select id, product_id, facility_scope, requested_quantity, budget_mode, budget_minor, delivery_mode, request_note, status, expires_at
          from request_insert
          union all
          select r.id, r.product_id, r.facility_scope, r.requested_quantity, r.budget_mode, r.budget_minor, r.delivery_mode, r.request_note, r.status, r.expires_at
          from v2_availability_requests r
          where r.buyer_account_id = (select id from account)
            and r.idempotency_key = ${input.idempotencyKey}
        ),
        final as (
          select rr.id, rr.product_id, rr.facility_scope, rr.requested_quantity, rr.budget_mode, rr.budget_minor, rr.delivery_mode, rr.request_note, rr.status, rr.expires_at,
                 coalesce(cs.credits_used, c.credits_used) as credits_used_result,
                 c.monthly_quota, c.extra_credits, c.plan,
                 case when exists (select 1 from request_insert) then 1 else 0 end as is_new,
                 case when cs.credits_used is null then 0 else 1 end as debited
          from request_result rr
          join v2_buyer_credit_accounts c on c.buyer_account_id = (select id from account)
          left join credit_spend cs on true
        )
        select * from final limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) {
        throw new AvailabilityPolicyError('The selected product is not published at all requested facilities.');
      }
      if (Number(row.is_new) === 1 && Number(row.debited) === 0) {
        const availableAfterRace = Number(row.monthly_quota) + Number(row.extra_credits) - Number(row.credits_used_result);
        throw new InsufficientCreditsError(`This bulk need costs 1 bulk credit (it does not grow with the number of suppliers). You have ${availableAfterRace}. Missing ${Math.max(0, creditCost - availableAfterRace)}. Recharge with packs to send.`);
      }
      const scopes = (row.facility_scope as unknown[]).map((v) => String(v));
      if (
        String(row.product_id) !== input.productId
        || scopes.length !== input.facilityIds.length
        || input.facilityIds.some((id) => !scopes.includes(id))
        || Number(row.requested_quantity) !== input.quantity
        || String(row.budget_mode) !== input.budgetMode
        || (row.budget_minor === null ? null : Number(row.budget_minor)) !== input.budgetMinor
        || String(row.delivery_mode) !== input.deliveryMode
        || (row.request_note === null ? null : String(row.request_note)) !== input.note
      ) {
        throw new AvailabilityPolicyError('The idempotency key is already used for a different availability request.');
      }
      return {
        requestId: String(row.id),
        productId: String(row.product_id),
        facilityIds: scopes,
        facilityCount: scopes.length,
        status: String(row.status) as AvailabilityResult['status'],
        expiresAt: new Date(String(row.expires_at)).toISOString(),
        deliveryMode: String(row.delivery_mode) as 'retrait' | 'livraison',
        note: row.request_note === null ? null : String(row.request_note),
        message: `Bulk request sent to ${scopes.length} facility(ies). Each facility can now confirm live availability.`,
        creditCost,
        creditsRemaining: Number(row.monthly_quota) + Number(row.extra_credits) - Number(row.credits_used_result),
        monthlyQuota: Number(row.monthly_quota),
        plan: String(row.plan) as 'free' | 'pro',
      };
    },
  };
}
