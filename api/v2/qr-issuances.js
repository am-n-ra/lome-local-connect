// src/server/auth-context.ts
import { createRemoteJWKSet, jwtVerify } from "jose";
var keySet = null;
var DEFAULT_NEON_AUTH_JWKS_URL = "https://ep-purple-fog-amwsyc3j.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth/.well-known/jwks.json";
function remoteKeys() {
  const url = (process.env.NEON_AUTH_JWKS_URL ?? DEFAULT_NEON_AUTH_JWKS_URL).trim();
  keySet ??= createRemoteJWKSet(new URL(url));
  return keySet;
}
function getBearerToken(headers) {
  const authorization = headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}
async function getAuthUserId(headers) {
  const token = getBearerToken(headers);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, remoteKeys());
    return typeof payload.sub === "string" && payload.sub.length > 0 ? payload.sub : null;
  } catch {
    return null;
  }
}

// src/server/trunk-repository.ts
import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes } from "node:crypto";

// src/server/evidence-contract.ts
import { head } from "@vercel/blob";
var CLAIM_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
var CLAIM_EVIDENCE_MAX_ITEMS = 12;
var CLAIM_EVIDENCE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
var REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var EVIDENCE_KINDS = /* @__PURE__ */ new Set(["identity", "company", "facility", "product", "service", "location"]);
var FieldPilotPolicyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "FieldPilotPolicyError";
  }
};
var EvidenceStoragePolicyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "EvidenceStoragePolicyError";
  }
};
function providerPathFromInternalKey(objectKey) {
  if (!objectKey.startsWith("private://omni/")) throw new FieldPilotPolicyError("Private evidence reference is invalid.");
  const providerPath = objectKey.slice("private://omni/".length);
  if (!providerPath || providerPath.includes("..") || providerPath.includes("\\") || /\s/.test(providerPath)) throw new FieldPilotPolicyError("Private evidence reference is invalid.");
  return providerPath;
}
function assertBoundObjectPath(requestId, evidence) {
  if (!REQUEST_ID_PATTERN.test(requestId) || !EVIDENCE_KINDS.has(evidence.evidenceKind)) throw new FieldPilotPolicyError("The claim or evidence category is invalid.");
  const providerPath = providerPathFromInternalKey(evidence.objectKey);
  const prefix = `claims/${requestId}/${evidence.evidenceKind}/`;
  if (!providerPath.startsWith(prefix) || providerPath.slice(prefix.length).length < 1 || providerPath.slice(prefix.length).includes("/")) throw new FieldPilotPolicyError("Evidence belongs to a different claim or category.");
  return providerPath;
}
function hasPrivateBlobConfiguration() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}
async function verifyPrivateEvidenceObjects(requestId, evidence) {
  if (!hasPrivateBlobConfiguration()) throw new EvidenceStoragePolicyError("Private evidence storage is not configured; the claim remains a resumable draft.");
  if (evidence.length < 1 || evidence.length > CLAIM_EVIDENCE_MAX_ITEMS) throw new FieldPilotPolicyError("Provide one to twelve private evidence objects.");
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new EvidenceStoragePolicyError("Private evidence storage is not configured; no verification token is available.");
  const verified = await Promise.all(evidence.map(async (item) => {
    const providerPath = assertBoundObjectPath(requestId, item);
    let metadata;
    try {
      metadata = await head(providerPath, { token });
    } catch {
      throw new FieldPilotPolicyError("One or more private evidence objects are missing or inaccessible.");
    }
    if (!CLAIM_EVIDENCE_CONTENT_TYPES.includes(metadata.contentType) || metadata.size < 1 || metadata.size > CLAIM_EVIDENCE_MAX_BYTES || metadata.pathname !== providerPath) throw new FieldPilotPolicyError("One or more evidence objects have an unsupported type, size or path.");
    return { ...item, objectKey: `private://omni/${metadata.pathname}` };
  }));
  return verified;
}

// src/server/fedapay-adapter.ts
import { WebhookSignature } from "fedapay";
var FedaPayConfigurationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "FedaPayConfigurationError";
  }
};
var FedaPayProviderError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "FedaPayProviderError";
  }
};
function environment() {
  const value = process.env.FEDAPAY_ENV?.trim().toLowerCase();
  if (value !== "sandbox" && value !== "live") {
    throw new FedaPayConfigurationError("FEDAPAY_ENV must be explicitly set to sandbox or live.");
  }
  return value;
}
function selectedSecretKey() {
  const env = environment();
  const name = env === "sandbox" ? "FEDAPAY_SANDBOX_SECRET_KEY" : "FEDAPAY_SECRET_KEY";
  const value = process.env[name]?.trim();
  if (!value) throw new FedaPayConfigurationError(`FedaPay ${env} recharge is not configured.`);
  return value;
}
function selectedWebhookSecret() {
  const env = environment();
  const name = env === "sandbox" ? "FEDAPAY_SANDBOX_WEBHOOK_SECRET" : "FEDAPAY_WEBHOOK_SECRET";
  const value = process.env[name]?.trim();
  if (!value) throw new FedaPayConfigurationError(`FedaPay ${env} webhook is not configured.`);
  return value;
}
function baseUrl() {
  return environment() === "sandbox" ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1";
}
function normalizeStatus(value) {
  const status = String(value ?? "").toLowerCase();
  if (status === "approved" || status === "transferred") return "approved";
  if (status === "canceled" || status === "cancelled" || status === "expired") return "canceled";
  if (status === "declined" || status === "failed") return "declined";
  return "pending";
}
async function requestProvider(path, init) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${selectedSecretKey()}`,
      ...init.headers ?? {}
    }
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new FedaPayProviderError("FedaPay returned an invalid response.");
    }
  }
  if (!response.ok) {
    throw new FedaPayProviderError("FedaPay rejected the recharge request.");
  }
  return payload;
}
function transactionPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  const root = payload;
  const nested = root["v1/transaction"];
  return nested && typeof nested === "object" && !Array.isArray(nested) ? nested : root;
}
function isFedaPayConfigured() {
  try {
    environment();
    selectedSecretKey();
    selectedWebhookSecret();
    return true;
  } catch {
    return false;
  }
}
async function createFedaPayCheckout(input) {
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new FedaPayConfigurationError("Recharge amount must be a positive integer in minor units.");
  }
  if (input.currency.toUpperCase() !== "XOF") {
    throw new FedaPayConfigurationError("FedaPay recharge currently supports XOF only.");
  }
  const created = await requestProvider("/transactions", {
    method: "POST",
    body: JSON.stringify({
      description: input.description.slice(0, 180),
      amount: input.amountMinor,
      currency: { iso: input.currency.toUpperCase() },
      callback_url: input.callbackUrl,
      custom_metadata: { omni_recharge_id: input.rechargeId },
      customer: {
        email: input.customer.email ?? void 0,
        firstname: input.customer.firstName ?? "Omni",
        lastname: input.customer.lastName ?? "User"
      }
    })
  });
  const transaction = transactionPayload(created);
  const transactionId = String(transaction.id ?? transaction.reference ?? "");
  if (!transactionId) throw new FedaPayProviderError("FedaPay did not return a transaction identifier.");
  const token = await requestProvider(`/transactions/${encodeURIComponent(transactionId)}/token`, {
    method: "POST",
    body: "{}"
  });
  const tokenPayload = token && typeof token === "object" && !Array.isArray(token) ? token : {};
  const checkoutUrl = String(tokenPayload.url ?? "");
  if (!checkoutUrl) throw new FedaPayProviderError("FedaPay did not return a checkout URL.");
  return { transactionId, checkoutUrl, status: normalizeStatus(transaction.status) };
}
function verifyFedaPayWebhookSignature(rawBody, signature) {
  if (!signature) return false;
  try {
    return WebhookSignature.verifyHeader(rawBody, signature, selectedWebhookSecret(), 300);
  } catch {
    return false;
  }
}

// src/server/trunk-repository.ts
function database() {
  const url = process.env.V2_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("V2_DATABASE_URL is not configured for the server runtime.");
  return neon(url);
}
var PUBLIC_TRUST_STATES = /* @__PURE__ */ new Set(["unclaimed", "certified", "unconfirmed", "confirmed"]);
var toFacility = (row) => ({
  id: String(row.id),
  name: String(row.name),
  category: String(row.category ?? "Local supply"),
  address: row.address ? String(row.address) : null,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  // Internal verification states are never a public trust claim. Before review, the public meaning remains unclaimed.
  trust: PUBLIC_TRUST_STATES.has(String(row.trust_state)) ? String(row.trust_state) : "unclaimed",
  plan: String(row.commercial_plan),
  productCount: Number(row.product_count ?? 0)
});
var retryDatabase = async (operation) => {
  let lastError;
  for (const delay of [0, 800, 1800]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      return await operation();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Neon database request failed after bounded recovery attempts.");
};
var AvailabilityPolicyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "AvailabilityPolicyError";
  }
};
var SellerCataloguePolicyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "SellerCataloguePolicyError";
  }
};
var PurchaseIntentPolicyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PurchaseIntentPolicyError";
  }
};
var AvailabilityResponsePolicyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "AvailabilityResponsePolicyError";
  }
};
var SellerAuthorizationPolicyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "SellerAuthorizationPolicyError";
  }
};
var TransactionPolicyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "TransactionPolicyError";
  }
};
var WalletPolicyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "WalletPolicyError";
  }
};
var toProduct = (row) => ({
  id: String(row.id),
  facilityId: String(row.facility_id),
  name: String(row.name),
  description: row.description ? String(row.description) : null,
  category: row.category ? String(row.category) : null,
  unit: String(row.unit ?? "unit"),
  priceMinor: Number(row.price_minor),
  currency: String(row.currency ?? "USD"),
  couponLabel: row.coupon_label ? String(row.coupon_label) : null
});
function createTrunkRepository(sql = database()) {
  return {
    async getAccountContext(input) {
      const rows = await retryDatabase(() => sql`
        select a.id, a.onboarding_state, a.suspended_at,
          count(distinct f.id)::int as facility_count,
          coalesce(array_agg(distinct ar.role) filter (where ar.role is not null and ar.status = 'active'), '{}') as roles
        from v2_accounts a
        left join v2_account_roles ar on ar.account_id = a.id and ar.status = 'active'
        left join v2_facilities f on f.account_id = a.id
        where a.auth_user_id = ${input.authUserId}
        group by a.id, a.onboarding_state, a.suspended_at
        limit 1
      `);
      const row = rows[0];
      if (!row) return null;
      const roles = Array.isArray(row.roles) ? row.roles.map(String).filter((role) => ["buyer", "seller", "admin", "operator", "reviewer"].includes(role)) : [];
      const suspended = row.suspended_at !== null;
      return {
        accountId: String(row.id),
        roles,
        onboardingState: String(row.onboarding_state),
        suspended,
        facilityCount: Number(row.facility_count ?? 0),
        capabilities: {
          sellerWorkspace: !suspended && String(row.onboarding_state) === "seller_ready",
          operatorTools: !suspended && roles.includes("operator"),
          reviewerWorkspace: !suspended && roles.includes("reviewer"),
          adminTools: !suspended && roles.includes("admin")
        }
      };
    },
    async listRoleManagementAccounts(input) {
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' and ar.status = 'active'
          where a.auth_user_id = ${input.authUserId} and a.suspended_at is null
          limit 1
        )
        select candidate.id as account_id, candidate.auth_user_id, candidate.onboarding_state, candidate.suspended_at,
          count(distinct f.id)::int as facility_count,
          coalesce(array_agg(distinct ar.role) filter (where ar.role is not null and ar.status = 'active'), '{}') as roles
        from admin
        cross join v2_accounts candidate
        left join v2_account_roles ar on ar.account_id = candidate.id
        left join v2_facilities f on f.account_id = candidate.id
        group by candidate.id, candidate.auth_user_id, candidate.onboarding_state, candidate.suspended_at
        order by candidate.created_at asc, candidate.id asc
        limit 200
      `);
      const accounts = rows.map((row) => ({
        accountId: String(row.account_id),
        authUserId: String(row.auth_user_id),
        roles: (Array.isArray(row.roles) ? row.roles.map(String) : []).filter((role) => ["buyer", "seller", "admin", "operator", "reviewer"].includes(role)),
        onboardingState: String(row.onboarding_state),
        suspended: row.suspended_at !== null,
        facilityCount: Number(row.facility_count ?? 0)
      }));
      const authorized = accounts.length > 0;
      return { authorized, accounts };
    },
    async setManagedStaffRole(input) {
      if (!["operator", "reviewer"].includes(input.role) || !["active", "revoked"].includes(input.status) || input.reason.trim().length < 3 || input.reason.trim().length > 1e3) {
        throw new FieldPilotPolicyError("A valid managed role, status and bounded reason are required.");
      }
      const rows = await retryDatabase(() => sql`
        with admin as (
          select a.id
          from v2_accounts a
          join v2_account_roles ar on ar.account_id = a.id and ar.role = 'admin' and ar.status = 'active'
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
      const row = rows[0];
      if (!row) throw new FieldPilotPolicyError("The Admin session is not authorized or the target account is unavailable.");
      return { accountId: String(row.account_id), role: String(row.role), status: String(row.status) };
    },
    async createSellerFacility(input) {
      if (!input.name.trim() || input.name.trim().length > 180 || !Number.isFinite(input.latitude) || !Number.isFinite(input.longitude) || input.latitude < -90 || input.latitude > 90 || input.longitude < -180 || input.longitude > 180 || !input.idempotencyKey.trim() || input.idempotencyKey.length > 180) {
        throw new SellerCataloguePolicyError("INVALID_INPUT");
      }
      const rows = await retryDatabase(() => sql`
        with seller as (
          select a.id
          from v2_accounts a
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and a.onboarding_state = 'seller_ready'
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
        ), inserted as (
          insert into v2_facilities
            (account_id, source_kind, source_name, source_ref, name, category, description, latitude, longitude, address, trust_state)
          select available_slot.account_id, 'created', 'seller', ${input.idempotencyKey.trim()}, ${input.name.trim()}, ${input.category?.trim() || null}, ${input.description?.trim() || null}, ${input.latitude}, ${input.longitude}, ${input.address?.trim() || null}, 'verification_draft'
          from available_slot
          where not exists (select 1 from existing)
          returning id as facility_id
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
      const row = rows[0];
      if (!row) throw new SellerCataloguePolicyError("FORBIDDEN_OR_SLOT_REQUIRED");
      return { facilityId: String(row.facility_id), slotId: String(row.slot_id), trustState: "verification_draft", created: row.created === true };
    },
    async createPublicFacilityImport(input) {
      if (input.provider !== "openstreetmap" || !input.sourceRef.trim() || !input.name.trim() || !Number.isFinite(input.latitude) || !Number.isFinite(input.longitude) || input.latitude < -90 || input.latitude > 90 || input.longitude < -180 || input.longitude > 180) {
        throw new FieldPilotPolicyError("The public facility import payload is invalid.");
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
      const actor = actorRows[0];
      if (!actor) throw new FieldPilotPolicyError("An active Omni operator role is required for public imports.");
      let sourceRows = await retryDatabase(() => sql`
        select id from v2_public_sources where provider = ${input.provider} limit 1
      `);
      if (!sourceRows[0]) {
        sourceRows = await retryDatabase(() => sql`
          insert into v2_public_sources (provider, attribution)
          values (${input.provider}, ${input.attribution})
          returning id
        `);
      }
      const source = sourceRows[0];
      if (!source) throw new FieldPilotPolicyError("The public source could not be prepared.");
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
      const row = rows[0];
      if (!row) throw new FieldPilotPolicyError("The public facility import did not produce a recoverable result.");
      return { runId: String(row.run_id), facilityId: String(row.facility_id), sourceRef: input.sourceRef.trim(), created: row.created === true, trust: "unclaimed" };
    },
    async listOperatorRuns(input) {
      const authorizationRows = await retryDatabase(() => sql`
        select a.id
        from v2_accounts a
        join v2_account_roles ar on ar.account_id = a.id and ar.role in ('operator', 'reviewer') and ar.status = 'active'
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        limit 1
      `);
      if (!authorizationRows[0]) return { authorized: false, runs: [] };
      const rows = await retryDatabase(() => sql`
        select r.id, r.operation, r.provider, r.outcome, r.result_count, r.error_class, r.started_at, r.finished_at
        from v2_operator_runs r
        join v2_accounts a on a.id = r.operator_account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        order by r.started_at desc, r.id desc
        limit 100
      `);
      return { authorized: true, runs: rows.map((row) => ({ id: String(row.id), operation: String(row.operation), provider: row.provider === null ? null : String(row.provider), outcome: String(row.outcome), resultCount: Number(row.result_count), errorClass: row.error_class === null ? null : String(row.error_class), startedAt: new Date(String(row.started_at)).toISOString(), finishedAt: row.finished_at === null ? null : new Date(String(row.finished_at)).toISOString() })) };
    },
    async canUploadClaimEvidence(input) {
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
      return Boolean(rows[0]);
    },
    async getClaimEvidenceForViewer(input) {
      if (!Number.isInteger(input.index) || input.index < 0 || input.index >= 12) throw new FieldPilotPolicyError("The evidence index is invalid.");
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
      const row = rows[0];
      if (!row) return null;
      return { objectKey: String(row.object_key), evidenceKind: String(row.evidence_kind), contentType: row.content_type === null ? null : String(row.content_type), size: row.size === null ? null : Number(row.size) };
    },
    async createClaimDraft(input) {
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
      const row = rows[0];
      if (!row) throw new FieldPilotPolicyError("The facility is unavailable for a claim or already claimed by another account.");
      return { requestId: String(row.request_id), facilityId: String(row.facility_id), state: row.state ? String(row.state) : "draft", version: Number(row.version), created: row.created === true };
    },
    async cancelClaim(input) {
      if (!Number.isInteger(input.version) || input.version < 1) throw new FieldPilotPolicyError("The claim version is invalid.");
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
      const row = rows[0];
      if (!row) throw new FieldPilotPolicyError("The claim cannot be cancelled from this account or version.");
      return { requestId: String(row.request_id), facilityId: String(row.facility_id), state: "cancelled", version: Number(row.version) };
    },
    async submitClaimEvidence(input) {
      const allowedKinds = /* @__PURE__ */ new Set(["identity", "company", "facility", "product", "service", "location"]);
      if (!Number.isInteger(input.version) || input.version < 1 || !Array.isArray(input.evidence) || input.evidence.length < 1 || input.evidence.length > 12 || input.evidence.some((item) => !allowedKinds.has(item.evidenceKind) || typeof item.objectKey !== "string" || !item.objectKey.startsWith("private://omni/") || item.objectKey.length > 512 || /(?:https?:|data:|\s)/i.test(item.objectKey) || item.checksum !== null && item.checksum !== void 0 && (typeof item.checksum !== "string" || item.checksum.length > 128))) {
        throw new FieldPilotPolicyError("Provide one to twelve typed private evidence references; raw files and public URLs are not accepted.");
      }
      if (!hasPrivateBlobConfiguration()) throw new EvidenceStoragePolicyError("Private evidence storage is not configured; the claim remains a resumable draft.");
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
      if (!candidateRows[0]) throw new FieldPilotPolicyError("The claim cannot be submitted from this account or version.");
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
      const row = rows[0];
      if (!row) throw new FieldPilotPolicyError("The claim cannot be submitted from this account or version.");
      return { requestId: String(row.request_id), facilityId: String(row.facility_id), state: "submitted", facilityTrust: "verification_submitted", version: Number(row.version), evidenceCount: Number(row.evidence_count), created: true };
    },
    async listReviewQueue(input) {
      const authorizationRows = await retryDatabase(() => sql`
        select a.id
        from v2_accounts a
        join v2_account_roles ar on ar.account_id = a.id and ar.role = 'reviewer' and ar.status = 'active'
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        limit 1
      `);
      if (!authorizationRows[0]) return { authorized: false, requests: [] };
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
      return { authorized: true, requests: rows.map((row) => ({ requestId: String(row.request_id), facilityId: String(row.facility_id), facilityName: String(row.facility_name), facilityTrust: String(row.trust_state), state: String(row.state), version: Number(row.version), createdAt: new Date(String(row.created_at)).toISOString(), submittedAt: row.submitted_at === null ? null : new Date(String(row.submitted_at)).toISOString(), evidenceCount: Number(row.evidence_count ?? 0), evidenceKinds: Array.isArray(row.evidence_kinds) ? row.evidence_kinds.map(String) : [] })) };
    },
    async reviewFacilityClaim(input) {
      if (!["certified", "rejected", "needs_more_evidence"].includes(input.outcome) || input.reason.trim().length < 3 || input.reason.trim().length > 1e3) {
        throw new FieldPilotPolicyError("A review outcome and a bounded reason are required.");
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
      const row = rows[0];
      if (!row) throw new FieldPilotPolicyError("The claim is not reviewable by this reviewer or is no longer pending.");
      const facilityTrust = row.facility_trust ? String(row.facility_trust) : input.outcome === "certified" ? "unconfirmed" : input.outcome === "needs_more_evidence" ? "verification_draft" : "rejected";
      return { requestId: String(row.request_id), facilityId: String(row.facility_id), outcome: input.outcome, state: input.outcome, facilityTrust, version: Number(row.version) };
    },
    async listSellerActivationQueue(input) {
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
      if (!rows.length && !reviewerRows.length) {
        throw new FieldPilotPolicyError("The account is not authorized to review seller activation.");
      }
      return { candidates: rows.map((row) => ({ accountId: String(row.account_id), authUserId: String(row.auth_user_id), onboardingState: String(row.onboarding_state), facilityCount: Number(row.facility_count), createdAt: new Date(String(row.created_at)).toISOString(), suspended: row.suspended_at !== null })) };
    },
    async activateSellerAccount(input) {
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
      const row = rows[0];
      if (!row) throw new FieldPilotPolicyError("The account is not eligible for separate seller activation.");
      return { accountId: String(row.id), onboardingState: "seller_ready", activated: true };
    },
    async setSellerAccountSuspension(input) {
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
      const row = rows[0];
      if (!row) throw new FieldPilotPolicyError("The account is not eligible for this suspension change.");
      return { accountId: String(row.id), suspended: input.suspended };
    },
    async listNotificationInbox(input) {
      const rows = await retryDatabase(() => sql`
        select e.id, e.event_type, e.entity_type, e.entity_id, e.state, e.created_at, e.seen_at, e.payload
        from v2_notification_events e
        join v2_accounts a on a.id = e.recipient_account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        order by e.created_at desc, e.id desc
        limit 100
      `);
      return { notifications: rows.map((row) => {
        const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
        const outcome = payload.outcome;
        return { id: String(row.id), eventType: String(row.event_type), entityType: String(row.entity_type), entityId: String(row.entity_id), state: String(row.state), createdAt: new Date(String(row.created_at)).toISOString(), seenAt: row.seen_at === null ? null : new Date(String(row.seen_at)).toISOString(), ...outcome === "certified" || outcome === "needs_more_evidence" || outcome === "rejected" ? { reviewOutcome: outcome } : {} };
      }) };
    },
    async markNotificationSeen(input) {
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
      const row = rows[0];
      if (!row) throw new FieldPilotPolicyError("The notification is not available to this account.");
      return { notificationId: String(row.id), seen: true };
    },
    async upsertWebPushSubscription(input) {
      if (!/^https:\/\//.test(input.endpoint) || input.endpoint.length > 2048 || !input.p256dh.trim() || !input.auth.trim() || (input.userAgent?.length ?? 0) > 512) {
        throw new FieldPilotPolicyError("The Web Push subscription payload is invalid.");
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
      const row = rows[0];
      if (!row) throw new FieldPilotPolicyError("The subscription account is not available.");
      return { subscriptionId: String(row.id), state: "granted", created: row.created === true };
    },
    async revokeWebPushSubscription(input) {
      if (!/^https:\/\//.test(input.endpoint) || input.endpoint.length > 2048) throw new FieldPilotPolicyError("The Web Push endpoint is invalid.");
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
      if (!rows[0]) throw new FieldPilotPolicyError("The subscription is not available to this account.");
      return { revoked: true, endpoint: input.endpoint };
    },
    async listWebPushSubscriptionStatus(input) {
      const rows = await retryDatabase(() => sql`
        select count(*)::int as active
        from v2_web_push_subscriptions s
        join v2_accounts a on a.id = s.account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and s.permission_state = 'granted'
          and s.revoked_at is null
      `);
      return { active: Number(rows[0]?.active ?? 0) };
    },
    async listPublicFacilities(bounds, query, category) {
      return retryDatabase(async () => {
        const [west, south, east, north] = bounds ?? [-180, -90, 180, 90];
        const queryText = query?.trim() ?? "";
        const categoryText = category?.trim() ?? "";
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
        return rows.map(toFacility);
      });
    },
    async getFacilityDetail(id) {
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
      const row = facilities[0];
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
      return { ...toFacility(row), products: products.map(toProduct) };
    },
    async rebindDemoSeller(input) {
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
      const target = rows[0];
      if (!target || target.labeled_demo_facility !== true) {
        throw new SellerAuthorizationPolicyError("The labeled Seller demonstration fixture is unavailable.");
      }
      if (target.conflicting_auth_binding === true) {
        throw new SellerAuthorizationPolicyError("This Auth identity is already bound to another Omni account.");
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
      if (!updated[0]) {
        throw new SellerAuthorizationPolicyError("The Seller demonstration fixture could not be safely rebound.");
      }
      return { authorized: true };
    },
    async listSellerCatalogue(input) {
      const authorizationRows = await retryDatabase(() => sql`
        select a.id
        from v2_accounts a
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and a.onboarding_state = 'seller_ready'
        limit 1
      `);
      if (!authorizationRows[0]) return { authorized: false, facilities: [], products: [] };
      const facilityRows = await retryDatabase(() => sql`
        select
          f.id,
          f.name,
          coalesce(f.category, 'Autre') as category,
          f.address,
          'XOF' as currency,
          count(p.id)::int as product_count
        from v2_facilities f
        join v2_accounts a on a.id = f.account_id
        join v2_facility_slots fs on fs.facility_id = f.id and fs.account_id = a.id and fs.status = 'assigned'
        left join v2_products p on p.facility_id = f.id and p.publication_state <> 'archived'
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and a.onboarding_state = 'seller_ready'
        group by f.id
        order by f.name asc, f.id asc
      `);
      const facilities = facilityRows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        category: String(row.category),
        address: row.address === null ? null : String(row.address),
        currency: String(row.currency),
        slotState: "active",
        productCount: Number(row.product_count ?? 0)
      }));
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
      const products = rows.map((row) => ({
        id: String(row.id),
        facilityId: String(row.facility_id),
        facilityName: String(row.facility_name),
        name: String(row.name),
        description: row.description === null ? null : String(row.description),
        unit: String(row.unit),
        priceMinor: Number(row.price_minor),
        currency: String(row.currency),
        discountKind: row.discount_kind === null ? null : row.discount_kind,
        discountValueMinor: row.discount_value_minor === null ? null : Number(row.discount_value_minor),
        netPriceMinor: row.net_price_minor === null ? null : Number(row.net_price_minor),
        publicationState: String(row.publication_state)
      }));
      return { authorized: true, facilities, products };
    },
    async createSellerProductDraft(input) {
      if (!input.name.trim() || input.name.trim().length > 180 || !Number.isInteger(input.priceMinor) || input.priceMinor <= 0 || !Number.isInteger(input.discountValueMinor) || input.discountValueMinor <= 0) {
        throw new SellerCataloguePolicyError("INVALID_INPUT");
      }
      if (input.discountKind === "percentage" && input.discountValueMinor > 90) throw new SellerCataloguePolicyError("DISCOUNT_TOO_LARGE");
      if (input.discountKind === "fixed" && input.discountValueMinor >= input.priceMinor) throw new SellerCataloguePolicyError("DISCOUNT_TOO_LARGE");
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
          select of.id, ${input.name.trim()}, ${input.description?.trim() || null}, ${input.unit.trim() || "unit"}, ${input.priceMinor}, ${input.currency.toUpperCase()}, ${input.discountKind}, ${input.discountValueMinor}, ${input.idempotencyKey}, 'draft'
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
      const row = rows[0];
      if (!row) throw new SellerCataloguePolicyError("FORBIDDEN_OR_SLOT_REQUIRED");
      if (String(row.discount_kind) !== input.discountKind || Number(row.discount_value_minor) !== input.discountValueMinor || String(row.name ?? input.name) !== input.name.trim()) throw new SellerCataloguePolicyError("IDEMPOTENCY_CONFLICT");
      const discount = input.discountKind === "percentage" ? Math.floor(input.priceMinor * input.discountValueMinor / 100) : input.discountValueMinor;
      return { productId: String(row.id), facilityId: String(row.facility_id), publicationState: "draft", netPriceMinor: input.priceMinor - discount };
    },
    async updateSellerProductDraft(input) {
      if (!input.name.trim() || input.name.trim().length > 180 || !Number.isInteger(input.priceMinor) || input.priceMinor <= 0 || !Number.isInteger(input.discountValueMinor) || input.discountValueMinor <= 0) throw new SellerCataloguePolicyError("INVALID_INPUT");
      if (input.discountKind === "percentage" && input.discountValueMinor > 90) throw new SellerCataloguePolicyError("DISCOUNT_TOO_LARGE");
      if (input.discountKind === "fixed" && input.discountValueMinor >= input.priceMinor) throw new SellerCataloguePolicyError("DISCOUNT_TOO_LARGE");
      const rows = await retryDatabase(() => sql`
        update v2_products p
        set name = ${input.name.trim()}, description = ${input.description?.trim() || null}, unit = ${input.unit.trim() || "unit"}, price_minor = ${input.priceMinor}, currency = ${input.currency.toUpperCase()}, discount_kind = ${input.discountKind}, discount_value_minor = ${input.discountValueMinor}, publication_state = case when p.publication_state = 'published' then 'draft' else p.publication_state end, updated_at = now()
        from v2_facilities f join v2_accounts a on a.id = f.account_id
        where p.id = ${input.productId}::uuid and p.facility_id = f.id
          and a.auth_user_id = ${input.authUserId} and a.suspended_at is null and a.onboarding_state = 'seller_ready'
          and p.publication_state in ('draft', 'published')
        returning p.id, p.publication_state
      `);
      const row = rows[0];
      if (!row) throw new SellerCataloguePolicyError("FORBIDDEN_OR_NOT_EDITABLE");
      const discount = input.discountKind === "percentage" ? Math.floor(input.priceMinor * input.discountValueMinor / 100) : input.discountValueMinor;
      return { productId: String(row.id), publicationState: "draft", netPriceMinor: input.priceMinor - discount };
    },
    async transitionSellerProduct(input) {
      const rows = await retryDatabase(() => sql`
        with owned as (
          select p.id, p.facility_id, p.publication_state, f.commercial_plan
          from v2_products p join v2_facilities f on f.id = p.facility_id join v2_accounts a on a.id = f.account_id
          where p.id = ${input.productId}::uuid and a.auth_user_id = ${input.authUserId} and a.suspended_at is null and a.onboarding_state = 'seller_ready'
        ), published_count as (
          select count(*)::int as count from v2_products p where p.facility_id = (select facility_id from owned) and p.publication_state = 'published'
        ), changed as (
          update v2_products p set publication_state = ${input.to}, updated_at = now()
          where p.id = (select id from owned)
            and ((select publication_state from owned) = 'draft' and ${input.to} = 'published' and (((select commercial_plan from owned) = 'pro_active') or (select count from published_count) < 5))
              or ((select publication_state from owned) = 'published' and ${input.to} = 'archived')
          returning p.id, p.publication_state
        ) select * from changed
      `);
      const row = rows[0];
      if (!row) throw new SellerCataloguePolicyError("FORBIDDEN_OR_LIMIT_REACHED");
      return { productId: String(row.id), publicationState: String(row.publication_state) };
    },
    async getSellerAvailabilityQueue(input) {
      const sellerRows = await retryDatabase(() => sql`
        select a.id
        from v2_accounts a
        where a.auth_user_id = ${input.authUserId}
          and a.onboarding_state in ('seller_ready', 'complete')
          and a.suspended_at is null
        limit 1
      `);
      const seller = sellerRows[0];
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
        requests: rows.map((row) => ({
          id: String(row.id),
          facilityId: String(row.facility_id),
          facilityName: String(row.facility_name),
          facilityCategory: String(row.facility_category ?? "Local supply"),
          facilityTrust: row.facility_trust,
          facilityPlan: row.facility_plan,
          productId: String(row.product_id),
          productName: String(row.product_name),
          requestedQuantity: Number(row.requested_quantity),
          budgetMode: row.budget_mode,
          budgetMinor: row.budget_minor === null ? null : Number(row.budget_minor),
          requestStatus: row.request_status,
          createdAt: new Date(String(row.created_at)).toISOString(),
          expiresAt: new Date(String(row.expires_at)).toISOString(),
          responseStatus: row.response_status === null || row.response_status === void 0 ? null : row.response_status,
          responseObservedAt: row.response_observed_at === null || row.response_observed_at === void 0 ? null : new Date(String(row.response_observed_at)).toISOString(),
          freshness: row.freshness
        }))
      };
    },
    async getBuyerAvailabilityRequests(input) {
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
        requests: rows.map((row) => ({
          id: String(row.id),
          facilityId: String(row.facility_id),
          facilityName: String(row.facility_name),
          facilityCategory: String(row.facility_category ?? "Local supply"),
          productId: String(row.product_id),
          productName: String(row.product_name),
          requestedQuantity: Number(row.requested_quantity),
          budgetMode: row.budget_mode,
          budgetMinor: row.budget_minor === null ? null : Number(row.budget_minor),
          requestStatus: row.request_status,
          createdAt: new Date(String(row.created_at)).toISOString(),
          expiresAt: new Date(String(row.expires_at)).toISOString(),
          responseCount: Number(row.response_count)
        }))
      };
    },
    async getAvailabilityResponses(input) {
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
      const typedRows = rows;
      const first = typedRows[0];
      if (!first) throw new AvailabilityPolicyError("Availability request was not found or is not owned by this account.");
      const expiresAt = new Date(String(first.expires_at)).toISOString();
      const now = Date.now();
      const responses = typedRows.filter((row) => row.response_id !== null && row.response_id !== void 0).map((row) => ({
        id: String(row.response_id),
        requestId: String(row.request_id),
        facilityId: String(row.response_facility_id),
        facilityName: String(row.facility_name ?? "Facility"),
        facilityCategory: String(row.facility_category ?? "Local supply"),
        productId: String(row.product_id),
        productName: String(row.product_name ?? "Catalogue offer"),
        status: String(row.response_status),
        quantityAvailable: row.quantity_available === null ? null : Number(row.quantity_available),
        priceMinor: row.price_minor === null ? null : Number(row.price_minor),
        currency: String(row.currency ?? "USD"),
        sellerMessage: row.seller_message === null ? null : String(row.seller_message),
        observedAt: new Date(String(row.observed_at)).toISOString(),
        freshness: String(row.freshness)
      }));
      const requestStatus = responses.length > 0 ? "responses" : new Date(expiresAt).getTime() <= now ? "expired" : String(first.request_status) === "responding" ? "responding" : "submitted";
      return {
        requestId: String(first.request_id),
        productId: String(first.product_id),
        facilityId: String(first.facility_id),
        requestStatus,
        expiresAt,
        responses
      };
    },
    async confirmExternalPayment(input) {
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
      const row = rows[0];
      if (!row) throw new TransactionPolicyError("Payment confirmation requires a seller member and a buyer declaration in payment-declared state.");
      return {
        declarationId: String(row.declaration_id),
        transactionId: String(row.transaction_id),
        buyerAccountId: String(row.buyer_account_id),
        sellerAccountId: String(row.seller_account_id),
        state: "payment_confirmed"
      };
    },
    async declareExternalPayment(input) {
      if (!["cash", "mobile_money", "pay_on_delivery"].includes(input.method)) {
        throw new TransactionPolicyError("External payment method is not supported.");
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
      const row = rows[0];
      if (!row) throw new TransactionPolicyError("Payment declaration requires a buyer member after QR verification.");
      if (String(row.method) !== input.method) {
        throw new TransactionPolicyError("A different external payment method was already declared for this transaction.");
      }
      return {
        declarationId: String(row.id),
        transactionId: String(row.transaction_id),
        method: row.method,
        buyerAccountId: String(row.buyer_account_id)
      };
    },
    async submitTransactionRating(input) {
      const note = input.note?.trim() || null;
      if (!Number.isInteger(input.score) || input.score < 1 || input.score > 5) {
        throw new TransactionPolicyError("A rating score between 1 and 5 is required.");
      }
      if (note && note.length > 500) throw new TransactionPolicyError("The rating note must be 500 characters or fewer.");
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
        ),         rated_event as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
          select e.transaction_id, e.actor_account_id, 'rated', jsonb_build_object('score', r.score), ${input.now}::timestamptz
          from eligible e
          join v2_ratings r on r.transaction_id = e.transaction_id
          where e.current_state = 'received'
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        ),
        closed_event as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
          select e.transaction_id, e.actor_account_id, 'closed', jsonb_build_object('reason', 'buyer_rating_completed'), ${input.now}::timestamptz
          from eligible e
          join v2_ratings r on r.transaction_id = e.transaction_id
          where e.current_state in ('received', 'rated')
          on conflict (transaction_id, state) do nothing
          returning transaction_id
        ),
        qualified_facility as (
          update v2_facilities f
          set qualifying_sales = least(3, f.qualifying_sales + 1),
              trust_state = case when f.qualifying_sales + 1 >= 3 then 'confirmed' else f.trust_state end,
              bonus_unlocked_at = case when f.qualifying_sales + 1 >= 3 then ${input.now}::timestamptz else f.bonus_unlocked_at end,
              updated_at = ${input.now}::timestamptz
          from v2_transaction_snapshots s
          join closed_event c on c.transaction_id = s.transaction_id
          where f.id = s.facility_id
            and f.qualifying_sales < 3
          returning f.id as facility_id, f.account_id, f.qualifying_sales
        ),
        bonus_wallet as (
          select q.facility_id, q.account_id, w.id as wallet_id
          from qualified_facility q
          join v2_wallets w on w.account_id = q.account_id
          where q.qualifying_sales >= 3
        ),
        bonus_grant as (
          insert into v2_wallet_ledger_entries
            (wallet_id, kind, amount_minor, status, reference, facility_id, created_at, confirmed_at)
          select bw.wallet_id, 'bonus_grant', 2000, 'confirmed', 'facility-bonus:' || bw.facility_id::text, bw.facility_id, ${input.now}::timestamptz, ${input.now}::timestamptz
          from bonus_wallet bw
          on conflict (wallet_id, kind, reference) do nothing
          returning id, facility_id
        ),
        audited as (
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
      const row = rows[0];
      if (!row) throw new TransactionPolicyError("Rating is available only after the Buyer confirms receipt.");
      return { ratingId: String(row.id), transactionId: String(row.transaction_id), score: Number(row.score), note: row.note === null || row.note === void 0 ? null : String(row.note), state: "rated" };
    },
    async transitionTransaction(input) {
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
      const row = rows[0];
      if (!row) throw new TransactionPolicyError("Transaction state is stale, membership is invalid, or the actor transition is not allowed.");
      return {
        accepted: true,
        transactionId: String(row.transaction_id),
        from: input.from,
        to: input.to,
        actorRole: input.actorRole
      };
    },
    async getWalletOverview(input) {
      const walletRows = await retryDatabase(() => sql`
        insert into v2_wallets (account_id)
        select a.id
        from v2_accounts a
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        on conflict (account_id) do update set currency = v2_wallets.currency
        returning id, account_id, currency
      `);
      const wallet = walletRows[0];
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
          select f.id as facility_id, f.name as facility_name, f.commercial_plan,
                 coalesce(last_entitlement.price_minor, 1000)::int as pro_price_minor,
                 coalesce(last_entitlement.billing_currency, 'USD') as billing_currency
          from v2_facilities f
          join v2_accounts a on a.id = f.account_id
          join v2_facility_slots fs on fs.facility_id = f.id and fs.account_id = a.id and fs.status = 'assigned'
          left join lateral (
            select e.price_minor, e.billing_currency
            from v2_facility_entitlements e
            where e.facility_id = f.id and e.entitlement_kind = 'facility_pro'
            order by e.created_at desc
            limit 1
          ) last_entitlement on true
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
          order by f.name asc, f.id asc
        `)
      ]);
      const balance = balanceRows[0];
      return {
        walletId,
        currency: String(wallet.currency ?? "USD"),
        balanceMinor: Number(balance?.balance_minor ?? 0),
        entries: entryRows.map((row) => ({
          id: String(row.id),
          kind: String(row.kind),
          amountMinor: Number(row.amount_minor),
          status: String(row.status),
          reference: String(row.reference),
          facilityId: row.facility_id === null || row.facility_id === void 0 ? null : String(row.facility_id),
          createdAt: new Date(String(row.created_at)).toISOString(),
          confirmedAt: row.confirmed_at === null || row.confirmed_at === void 0 ? null : new Date(String(row.confirmed_at)).toISOString()
        })),
        facilities: facilityRows.map((row) => ({
          facilityId: String(row.facility_id),
          facilityName: String(row.facility_name),
          plan: String(row.commercial_plan),
          slotState: "active",
          proPriceMinor: Number(row.pro_price_minor),
          billingCurrency: String(row.billing_currency)
        }))
      };
    },
    async unlockFacilityBonus(input) {
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
      const row = rows[0];
      if (!row) throw new WalletPolicyError("Facility bonus requires confirmed trust, three qualifying sales and an owned wallet.");
      return {
        ledgerEntryId: String(row.id),
        walletId: String(row.wallet_id),
        kind: "bonus_grant",
        amountMinor: 2e3,
        status: "confirmed",
        facilityId: String(row.facility_id)
      };
    },
    async createWalletRecharge(input) {
      if (!Number.isInteger(input.amountMinor) || input.amountMinor < 100 || input.amountMinor > 1e8) {
        throw new WalletPolicyError("Recharge amount must be between 100 and 100,000,000 minor units.");
      }
      const currency = input.currency.trim().toUpperCase();
      if (currency !== "XOF" || !input.idempotencyKey.trim() || input.idempotencyKey.length > 180) {
        throw new WalletPolicyError("Recharge currency or idempotency key is invalid.");
      }
      if (!isFedaPayConfigured()) {
        throw new WalletPolicyError("FedaPay recharge is not configured for this environment.");
      }
      const existingRows = await retryDatabase(() => sql`
        select r.id, r.account_id, r.amount_minor, r.currency, r.status, r.provider_transaction_id, r.checkout_url
        from v2_wallet_recharge_intents r
        join v2_accounts a on a.id = r.account_id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
          and r.idempotency_key = ${input.idempotencyKey}
        limit 1
      `);
      const existing = existingRows[0];
      if (existing) {
        if (Number(existing.amount_minor) !== input.amountMinor || String(existing.currency) !== currency) {
          throw new WalletPolicyError("The recharge idempotency key is already used with different terms.");
        }
        if (!existing.provider_transaction_id || !existing.checkout_url || String(existing.status) !== "pending") {
          throw new WalletPolicyError("The existing recharge cannot be resumed automatically.");
        }
        return { rechargeId: String(existing.id), accountId: String(existing.account_id), amountMinor: Number(existing.amount_minor), currency, status: "pending", providerTransactionId: String(existing.provider_transaction_id), checkoutUrl: String(existing.checkout_url) };
      }
      const intentRows = await retryDatabase(() => sql`
        insert into v2_wallet_recharge_intents (account_id, wallet_id, amount_minor, currency, idempotency_key)
        select a.id, w.id, ${input.amountMinor}, ${currency}, ${input.idempotencyKey}
        from v2_accounts a
        join v2_wallets w on w.account_id = a.id
        where a.auth_user_id = ${input.authUserId}
          and a.suspended_at is null
        returning id, account_id
      `);
      const intent = intentRows[0];
      if (!intent) throw new WalletPolicyError("An active account Wallet is required for recharge.");
      const checkout = await createFedaPayCheckout({
        rechargeId: String(intent.id),
        amountMinor: input.amountMinor,
        currency,
        description: "Recharge Omni Wallet",
        callbackUrl: input.callbackUrl,
        customer: input.customer
      });
      const updatedRows = await retryDatabase(() => sql`
        update v2_wallet_recharge_intents
        set provider_transaction_id = ${checkout.transactionId}, checkout_url = ${checkout.checkoutUrl}, updated_at = now()
        where id = ${String(intent.id)}::uuid and status = 'pending'
        returning id, account_id, amount_minor, currency, status, provider_transaction_id, checkout_url
      `);
      const updated = updatedRows[0];
      if (!updated) throw new WalletPolicyError("Recharge state changed while creating the provider checkout.");
      return { rechargeId: String(updated.id), accountId: String(updated.account_id), amountMinor: Number(updated.amount_minor), currency: String(updated.currency), status: "pending", providerTransactionId: String(updated.provider_transaction_id), checkoutUrl: String(updated.checkout_url) };
    },
    async reconcileWalletRecharge(input) {
      const providerTransactionId = input.providerTransactionId.trim();
      const providerEventId = input.providerEventId.trim();
      if (!providerTransactionId || !providerEventId || !Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
        throw new WalletPolicyError("FedaPay webhook payload is invalid.");
      }
      const currency = input.currency.trim().toUpperCase();
      if (currency !== "XOF") throw new WalletPolicyError("FedaPay webhook currency is not supported.");
      const existingEventRows = await retryDatabase(() => sql`
        select id from v2_wallet_recharge_intents where provider_event_id = ${providerEventId} limit 1
      `);
      if (existingEventRows[0]) return { status: "ignored" };
      const intentRows = await retryDatabase(() => sql`
        select r.id, r.account_id, r.wallet_id, r.amount_minor, r.currency, r.status, r.provider_transaction_id
        from v2_wallet_recharge_intents r
        where r.provider_transaction_id = ${providerTransactionId}
        limit 1
      `);
      const intent = intentRows[0];
      if (!intent) throw new WalletPolicyError("FedaPay webhook does not match a pending Omni recharge.");
      if (input.omniRechargeId && String(intent.id) !== input.omniRechargeId) throw new WalletPolicyError("FedaPay webhook reference does not match the Omni recharge.");
      if (Number(intent.amount_minor) !== input.amountMinor || String(intent.currency).toUpperCase() !== currency) throw new WalletPolicyError("FedaPay webhook amount or currency does not match the Omni recharge.");
      if (String(intent.status) !== "pending") return { status: String(intent.status) === "confirmed" ? "confirmed" : String(intent.status) === "failed" ? "failed" : "canceled", rechargeId: String(intent.id) };
      const nextStatus = input.status === "approved" ? "confirmed" : input.status === "canceled" ? "canceled" : input.status === "declined" ? "failed" : "pending";
      if (nextStatus === "pending") return { status: "pending", rechargeId: String(intent.id) };
      const rows = await retryDatabase(() => sql`
        with locked as (
          select r.id, r.wallet_id, r.account_id, r.amount_minor, r.currency
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
        )
        select u.id as recharge_id, (select id from ledger limit 1) as ledger_entry_id from updated u
      `);
      const row = rows[0];
      if (!row) return { status: "ignored" };
      return { status: nextStatus, rechargeId: String(row.recharge_id), ledgerEntryId: row.ledger_entry_id ? String(row.ledger_entry_id) : void 0 };
    },
    async spendWallet(input) {
      if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0 || !input.reference.trim()) {
        throw new WalletPolicyError("Wallet spend amount and reference are invalid.");
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
      const row = rows[0];
      if (!row) throw new WalletPolicyError("Wallet is unavailable, facility ownership is invalid, or confirmed funds are insufficient.");
      if (String(row.kind) !== input.kind || Number(row.amount_minor) !== input.amountMinor || String(row.facility_id) !== input.facilityId) {
        throw new WalletPolicyError("The wallet reference is already used for a different spend.");
      }
      return {
        ledgerEntryId: String(row.id),
        walletId: String(row.wallet_id),
        kind: row.kind,
        amountMinor: Number(row.amount_minor),
        status: "confirmed",
        facilityId: String(row.facility_id)
      };
    },
    async activateFacilityPro(input) {
      if (!input.reference.trim() || input.reference.length > 180) throw new WalletPolicyError("Pro activation reference is invalid.");
      const rows = await retryDatabase(() => sql`
        with seller as (
          select a.id as account_id, w.id as wallet_id
          from v2_accounts a
          join v2_wallets w on w.account_id = a.id
          where a.auth_user_id = ${input.authUserId}
            and a.suspended_at is null
            and a.onboarding_state in ('seller_ready', 'complete')
        ), facility as (
          select f.id as facility_id, f.account_id,
                 coalesce(last_entitlement.price_minor, 1000)::int as price_minor,
                 coalesce(last_entitlement.billing_currency, 'USD') as billing_currency
          from v2_facilities f
          join seller s on s.account_id = f.account_id
          join v2_facility_slots fs on fs.facility_id = f.id and fs.account_id = f.account_id and fs.status = 'assigned'
          left join lateral (
            select e.price_minor, e.billing_currency
            from v2_facility_entitlements e
            where e.facility_id = f.id and e.entitlement_kind = 'facility_pro'
            order by e.created_at desc
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
          insert into v2_facility_entitlements (facility_id, entitlement_kind, state, starts_at, ends_at, source, price_minor, billing_currency, renewal_opt_in)
          select f.facility_id, 'facility_pro', 'active', ${input.now}::timestamptz, ${input.now}::timestamptz + interval '30 days', 'wallet', f.price_minor, f.billing_currency, false
          from facility f join effective_spend s on s.facility_id = f.facility_id
          where not exists (select 1 from active_entitlement)
          returning id, facility_id, ends_at
        ), updated as (
          update v2_facilities f
          set commercial_plan = 'pro_active', updated_at = ${input.now}::timestamptz
          from entitlement e
          where f.id = e.facility_id
          returning f.id
        )
        select e.id as entitlement_id, e.facility_id, e.ends_at, s.id as spend_ledger_entry_id
        from entitlement e join effective_spend s on s.facility_id = e.facility_id
        union all
        select ae.id as entitlement_id, f.facility_id, ae.ends_at, es.id as spend_ledger_entry_id
        from active_entitlement ae cross join facility f left join existing_spend es on true
        limit 1
      `);
      const row = rows[0];
      if (!row) throw new WalletPolicyError("Pro activation requires an assigned facility slot and sufficient confirmed Wallet funds.");
      return { facilityId: String(row.facility_id), entitlementId: String(row.entitlement_id), endsAt: new Date(String(row.ends_at)).toISOString(), spendLedgerEntryId: String(row.spend_ledger_entry_id ?? "") };
    },
    async respondAvailability(input) {
      if (!["available", "partial", "unavailable"].includes(input.status)) {
        throw new AvailabilityResponsePolicyError("Choose an allowed availability response status.");
      }
      if (input.status === "unavailable") {
        if (input.quantityAvailable !== 0 || input.priceMinor !== null) {
          throw new AvailabilityResponsePolicyError("An unavailable response must have zero quantity and no price.");
        }
      } else if (!Number.isInteger(input.quantityAvailable) || Number(input.quantityAvailable) < 1 || !Number.isInteger(input.priceMinor) || Number(input.priceMinor) < 0) {
        throw new AvailabilityResponsePolicyError("An available or partial response requires a positive quantity and non-negative price.");
      }
      if (input.sellerMessage && input.sellerMessage.length > 1e3) {
        throw new AvailabilityResponsePolicyError("The seller message is too long.");
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
      const row = rows[0];
      if (!row) throw new AvailabilityResponsePolicyError("The seller is not authorized for this request, facility or product.");
      const responseShapeMatches = String(row.request_id) === input.requestId && String(row.facility_id) === input.facilityId && String(row.product_id) === input.productId && String(row.status) === input.status && (row.quantity_available === null ? null : Number(row.quantity_available)) === input.quantityAvailable && (row.price_minor === null ? null : Number(row.price_minor)) === input.priceMinor;
      if (!responseShapeMatches) {
        throw new AvailabilityResponsePolicyError("The idempotency key is already used for a different availability response.");
      }
      return {
        responseId: String(row.id),
        requestId: String(row.request_id),
        facilityId: String(row.facility_id),
        productId: String(row.product_id),
        status: row.status,
        quantityAvailable: row.quantity_available === null ? null : Number(row.quantity_available),
        priceMinor: row.price_minor === null ? null : Number(row.price_minor),
        observedAt: new Date(String(row.observed_at)).toISOString()
      };
    },
    async issueBuyerQrToken(input) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 10 * 60 * 1e3).toISOString();
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
      const row = rows[0];
      if (!row) throw new TransactionPolicyError("Buyer QR issuance requires an authorized buyer transaction in intent-created state.");
      return {
        transactionId: String(row.transaction_id),
        token,
        expiresAt: new Date(String(row.expires_at)).toISOString()
      };
    },
    async issueQrToken(input) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 10 * 60 * 1e3).toISOString();
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
      const row = rows[0];
      if (!row) throw new TransactionPolicyError("QR issuance requires an authorized seller transaction in intent-created state.");
      return {
        transactionId: String(row.transaction_id),
        token,
        expiresAt: new Date(String(row.expires_at)).toISOString()
      };
    },
    async createPurchaseIntent(input) {
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
      const row = rows[0];
      if (!row) throw new PurchaseIntentPolicyError("No eligible availability response belongs to the authenticated buyer.");
      if (String(row.response_id) !== input.responseId) {
        throw new PurchaseIntentPolicyError("The idempotency key is already used for a different purchase intent.");
      }
      return {
        intentId: String(row.id),
        responseId: String(row.response_id),
        transactionId: String(row.transaction_id),
        buyerAccountId: String(row.buyer_account_id),
        state: String(row.state)
      };
    },
    async verifyQrToken(input) {
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
      const row = rows[0];
      if (!row) return { accepted: false, transactionId: input.transactionId, reason: "NOT_VERIFIED" };
      return {
        accepted: true,
        transactionId: String(row.transaction_id),
        verifiedAt: new Date(String(row.verified_at)).toISOString(),
        nextReplayCount: Number(row.replay_count),
        facilityId: String(row.facility_id),
        productId: String(row.product_id),
        productName: String(row.product_name ?? "Offre catalogue"),
        quantity: Number(row.quantity),
        unitPriceMinor: Number(row.unit_price_minor),
        couponCode: row.coupon_code === null || row.coupon_code === void 0 ? null : String(row.coupon_code),
        netAmountMinor: Number(row.net_amount_minor)
      };
    },
    async listTransactionMessages(input) {
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
      const mapped = rows.map((row) => ({
        id: String(row.id),
        transactionId: String(row.transaction_id),
        senderRole: String(row.sender_role),
        body: String(row.body),
        createdAt: new Date(String(row.created_at)).toISOString(),
        seenAt: row.seen_at ? new Date(String(row.seen_at)).toISOString() : null
      }));
      return { transactionId: input.transactionId, messages: mapped };
    },
    async createTransactionMessage(input) {
      const body = input.body.trim();
      if (!body || body.length > 2e3) throw new TransactionPolicyError("MESSAGE_INVALID");
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
      const row = rows[0];
      if (!row) throw new TransactionPolicyError("FORBIDDEN");
      return {
        id: String(row.id),
        transactionId: String(row.transaction_id),
        senderRole: String(row.sender_role),
        body: String(row.body),
        createdAt: new Date(String(row.created_at)).toISOString(),
        seenAt: row.seen_at ? new Date(String(row.seen_at)).toISOString() : null
      };
    },
    async getTransaction(input) {
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
      const row = rows[0];
      if (!row) return null;
      return {
        transactionId: String(row.transaction_id),
        state: String(row.current_state),
        actorRole: String(row.actor_role),
        productId: String(row.product_id),
        facilityId: String(row.facility_id),
        quantity: Number(row.quantity),
        unitPriceMinor: Number(row.unit_price_minor),
        couponCode: row.coupon_code === null || row.coupon_code === void 0 ? null : String(row.coupon_code),
        netAmountMinor: Number(row.net_amount_minor)
      };
    },
    async createAvailabilityRequest(input) {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1e3).toISOString();
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
      const row = rows[0];
      if (!row) throw new AvailabilityPolicyError("The selected product is not published at the requested facility.");
      if (String(row.product_id) !== input.productId || String(row.facility_id) !== input.facilityId || Number(row.requested_quantity) !== input.quantity || String(row.budget_mode) !== input.budgetMode || (row.budget_minor === null ? null : Number(row.budget_minor)) !== input.budgetMinor) {
        throw new AvailabilityPolicyError("The idempotency key is already used for a different availability request.");
      }
      return {
        requestId: String(row.id),
        productId: String(row.product_id),
        facilityId: String(row.facility_id),
        status: String(row.status),
        expiresAt: new Date(String(row.expires_at)).toISOString(),
        message: "Request sent. The facility can now confirm the live availability."
      };
    }
  };
}

// src/server/evidence-storage.ts
import { get } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
var REQUEST_ID_PATTERN2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var EVIDENCE_KINDS2 = /* @__PURE__ */ new Set(["identity", "company", "facility", "product", "service", "location"]);
var ClaimEvidenceNotFoundError = class extends Error {
  constructor(message = "The requested private evidence was not found.") {
    super(message);
    this.name = "ClaimEvidenceNotFoundError";
  }
};
function requiredBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new EvidenceStoragePolicyError("Private evidence storage is not configured; no upload token was issued.");
  return token;
}
function parseClientPayload(value) {
  if (!value) throw new FieldPilotPolicyError("Evidence category is required.");
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed.evidenceKind !== "string" || !EVIDENCE_KINDS2.has(parsed.evidenceKind)) throw new Error("invalid category");
    return { evidenceKind: parsed.evidenceKind };
  } catch {
    throw new FieldPilotPolicyError("Evidence category is invalid.");
  }
}
function requestFromHeaders(url, headers, body) {
  const requestHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") requestHeaders.set(key, value);
    else if (Array.isArray(value)) requestHeaders.set(key, value.join(", "));
  }
  return new Request(url, { method: "POST", headers: requestHeaders, body: JSON.stringify(body) });
}
async function handleClaimEvidenceUpload(input) {
  if (!hasPrivateBlobConfiguration()) throw new EvidenceStoragePolicyError("Private evidence storage is not configured; no upload token was issued.");
  if (!REQUEST_ID_PATTERN2.test(input.requestId)) throw new FieldPilotPolicyError("The claim request is invalid.");
  const token = requiredBlobToken();
  const repository = createTrunkRepository();
  const webRequest = requestFromHeaders(input.url, input.headers, input.body);
  return handleUpload({
    body: input.body,
    request: webRequest,
    token,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const authUserId = await getAuthUserId(input.headers);
      if (!authUserId) throw new FieldPilotPolicyError("An authenticated claimant session is required for evidence upload.");
      const payload = parseClientPayload(clientPayload);
      const expectedPrefix = `claims/${input.requestId}/${payload.evidenceKind}/`;
      const filePart = pathname.startsWith(expectedPrefix) ? pathname.slice(expectedPrefix.length) : "";
      if (!filePart || filePart.includes("/") || filePart.includes("..") || filePart.includes("\\") || /\s/.test(filePart)) throw new FieldPilotPolicyError("The upload path is not bound to this claim.");
      const authorized = await repository.canUploadClaimEvidence({ authUserId, requestId: input.requestId });
      if (!authorized) throw new FieldPilotPolicyError("Only the claimant of an open draft may upload evidence.");
      return {
        allowedContentTypes: [...CLAIM_EVIDENCE_CONTENT_TYPES],
        maximumSizeInBytes: CLAIM_EVIDENCE_MAX_BYTES,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ requestId: input.requestId, evidenceKind: payload.evidenceKind })
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      let payload;
      try {
        payload = JSON.parse(tokenPayload ?? "{}");
      } catch {
        throw new FieldPilotPolicyError("The upload completion context is invalid.");
      }
      if (!payload.requestId || !payload.evidenceKind || !blob.pathname.startsWith(`claims/${payload.requestId}/${payload.evidenceKind}/`)) throw new FieldPilotPolicyError("The completed object is not bound to the claim.");
    }
  });
}
async function readPrivateEvidence(objectKey) {
  if (!hasPrivateBlobConfiguration()) throw new EvidenceStoragePolicyError("Private evidence storage is not configured.");
  const result = await get(providerPathFromInternalKey(objectKey), { access: "private", token: requiredBlobToken(), useCache: false });
  if (!result) throw new ClaimEvidenceNotFoundError();
  const body = Buffer.from(await new Response(result.stream).arrayBuffer());
  if (body.length < 1 || body.length > CLAIM_EVIDENCE_MAX_BYTES) throw new FieldPilotPolicyError("The private evidence object exceeds the allowed size.");
  return { body, contentType: result.blob.contentType ?? "application/octet-stream", size: body.length };
}

// src/server/http.ts
var json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};
var errorBody = (correlationId, code, message, retryable = false) => ({
  ok: false,
  correlationId,
  error: { code, message, retryable }
});
var ApiInputError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ApiInputError";
  }
};
function toApiErrorResponse(correlationId, error) {
  if (error instanceof ApiInputError) {
    return { status: 400, body: errorBody(correlationId, "INVALID_INPUT", error.message) };
  }
  if (error instanceof EvidenceStoragePolicyError) {
    return { status: 409, body: errorBody(correlationId, "EVIDENCE_STORAGE_UNAVAILABLE", error.message) };
  }
  if (error instanceof ClaimEvidenceNotFoundError) {
    return { status: 404, body: errorBody(correlationId, "EVIDENCE_NOT_FOUND", error.message) };
  }
  if (error instanceof AvailabilityPolicyError || error instanceof AvailabilityResponsePolicyError || error instanceof PurchaseIntentPolicyError || error instanceof SellerAuthorizationPolicyError || error instanceof SellerCataloguePolicyError || error instanceof TransactionPolicyError || error instanceof FieldPilotPolicyError || error instanceof WalletPolicyError) {
    return { status: 409, body: errorBody(correlationId, "POLICY_REJECTED", error.message) };
  }
  return {
    status: 500,
    body: errorBody(correlationId, "INTERNAL_RECOVERABLE", "The service is temporarily unavailable. Please try again.", true)
  };
}
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}
async function parseRequestBody(req) {
  const raw = await readRawBody(req);
  if (!raw) return {};
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ApiInputError("Request body must be valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new ApiInputError("Request body must be an object.");
  return parsed;
}
var TRANSACTION_STATES = [
  "intent_created",
  "qr_ready",
  "qr_verified",
  "payment_declared",
  "payment_confirmed",
  "fulfilment_pending",
  "fulfilled",
  "received",
  "rated",
  "closed"
];
var isTransactionState = (value) => typeof value === "string" && TRANSACTION_STATES.includes(value);
function numberParam(url, key, fallback) {
  const value = Number(url.searchParams.get(key));
  return Number.isFinite(value) ? value : fallback;
}
async function handleApi(req, res, pathname, url) {
  const correlationId = crypto.randomUUID();
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.end();
    return true;
  }
  if (!pathname.startsWith("/api/v2/")) return false;
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN ?? "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key");
  try {
    const repository = createTrunkRepository();
    if (req.method === "GET" && pathname === "/api/v2/account/context") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in to load your Omni account context."));
        return true;
      }
      const result = await repository.getAccountContext({ authUserId });
      if (!result) {
        json(res, 403, errorBody(correlationId, "ACCOUNT_UNAVAILABLE", "Your Omni account context is not available yet."));
        return true;
      }
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/admin/role-management") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an Omni Admin to manage staff roles."));
        return true;
      }
      const result = await repository.listRoleManagementAccounts({ authUserId });
      if (!result.authorized) {
        json(res, 403, errorBody(correlationId, "FORBIDDEN", "An active Omni Admin role is required for role management."));
        return true;
      }
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/admin/role-management") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an Omni Admin to manage staff roles."));
        return true;
      }
      const input = await parseRequestBody(req);
      const accountId = typeof input.accountId === "string" ? input.accountId.trim() : "";
      const role = input.role === "operator" || input.role === "reviewer" ? input.role : "";
      const status = input.status === "active" || input.status === "revoked" ? input.status : "";
      const reason = typeof input.reason === "string" ? input.reason.trim() : "";
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(accountId) || !role || !status || reason.length < 3 || reason.length > 1e3) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide a valid account, managed role, status and bounded reason."));
        return true;
      }
      const result = await repository.setManagedStaffRole({ authUserId, accountId, role, status, reason, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/public/facilities" && url.searchParams.get("action") === "operator-import-batch") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized Omni operator before importing public facilities."));
        return true;
      }
      const input = await parseRequestBody(req);
      const provider = input.provider === "openstreetmap" ? "openstreetmap" : "";
      const attribution = typeof input.attribution === "string" ? input.attribution.trim() : "";
      const items = Array.isArray(input.items) ? input.items : [];
      if (provider !== "openstreetmap" || !attribution || items.length === 0 || items.length > 100) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide OpenStreetMap attribution and between 1 and 100 bounded facilities."));
        return true;
      }
      const normalized = items.map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) throw new ApiInputError("Each batch facility must be an object.");
        const value = item;
        const sourceRef = typeof value.sourceRef === "string" ? value.sourceRef.trim() : "";
        const name = typeof value.name === "string" ? value.name.trim() : "";
        const category = value.category === null || value.category === void 0 ? null : String(value.category).trim() || null;
        const address = value.address === null || value.address === void 0 ? null : String(value.address).trim() || null;
        const latitude = Number(value.latitude);
        const longitude = Number(value.longitude);
        if (!sourceRef || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || sourceRef.length > 180 || name.length > 180) {
          throw new ApiInputError("Each batch facility needs a bounded source reference, name and valid coordinates.");
        }
        return { sourceRef, name, category, address, latitude, longitude };
      });
      const results = [];
      for (const item of normalized) {
        results.push(await repository.createPublicFacilityImport({ authUserId, provider, attribution, ...item, correlationId }));
      }
      json(res, 200, { ok: true, correlationId, data: { imported: results.length, created: results.filter((result) => result.created).length, existing: results.filter((result) => !result.created).length, results } });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/public/facilities" && url.searchParams.get("action") === "operator-import") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized Omni operator before importing a public facility."));
        return true;
      }
      const input = await parseRequestBody(req);
      const provider = input.provider === "openstreetmap" ? "openstreetmap" : "";
      const sourceRef = typeof input.sourceRef === "string" ? input.sourceRef.trim() : "";
      const name = typeof input.name === "string" ? input.name.trim() : "";
      const category = input.category === null || input.category === void 0 ? null : String(input.category).trim() || null;
      const address = input.address === null || input.address === void 0 ? null : String(input.address).trim() || null;
      const latitude = Number(input.latitude);
      const longitude = Number(input.longitude);
      const attribution = typeof input.attribution === "string" ? input.attribution.trim() : "";
      if (provider !== "openstreetmap" || !sourceRef || !name || !attribution || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || sourceRef.length > 180 || name.length > 180) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide a bounded OpenStreetMap source, facility name, attribution and valid coordinates."));
        return true;
      }
      const result = await repository.createPublicFacilityImport({ authUserId, provider, attribution, sourceRef, name, category, latitude, longitude, address, correlationId });
      json(res, result.created ? 201 : 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/notifications/push" && url.searchParams.get("action") === "subscribe") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before enabling device notifications."));
        return true;
      }
      const input = await parseRequestBody(req);
      const endpoint = typeof input.endpoint === "string" ? input.endpoint.trim() : "";
      const keys = input.keys && typeof input.keys === "object" && !Array.isArray(input.keys) ? input.keys : {};
      const p256dh = typeof keys.p256dh === "string" ? keys.p256dh.trim() : "";
      const auth = typeof keys.auth === "string" ? keys.auth.trim() : "";
      const userAgent = typeof input.userAgent === "string" ? input.userAgent.trim() || null : null;
      if (!endpoint || !p256dh || !auth || endpoint.length > 2048 || userAgent && userAgent.length > 512) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide a valid browser Push subscription."));
        return true;
      }
      const result = await repository.upsertWebPushSubscription({ authUserId, endpoint, p256dh, auth, userAgent });
      json(res, result.created ? 201 : 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/notifications/push" && url.searchParams.get("action") === "revoke") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before changing device notifications."));
        return true;
      }
      const input = await parseRequestBody(req);
      const endpoint = typeof input.endpoint === "string" ? input.endpoint.trim() : "";
      if (!endpoint) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide the subscription endpoint to revoke."));
        return true;
      }
      const result = await repository.revokeWebPushSubscription({ authUserId, endpoint });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/notifications/push" && url.searchParams.get("status") === "1") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before reading device notification status."));
        return true;
      }
      const result = await repository.listWebPushSubscriptionStatus({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/public/facilities" && url.searchParams.get("operator") === "runs") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized Omni operator to view field runs."));
        return true;
      }
      const result = await repository.listOperatorRuns({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/public/facilities" && url.searchParams.get("reviewer") === "queue") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized Omni reviewer to view the review queue."));
        return true;
      }
      const result = await repository.listReviewQueue({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/public/facilities" && url.searchParams.get("inbox") === "1") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in to view your Omni inbox."));
        return true;
      }
      const result = await repository.listNotificationInbox({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname.startsWith("/api/v2/facilities/") && url.searchParams.get("action") === "claim") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Create or open your Omni account before starting a facility claim."));
        return true;
      }
      const facilityId = pathname.slice("/api/v2/facilities/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(facilityId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid facility."));
        return true;
      }
      const result = await repository.createClaimDraft({ authUserId, facilityId });
      json(res, result.created ? 201 : 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname.startsWith("/api/v2/facilities/") && url.searchParams.get("action") === "claim-storage-status") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before checking private claim storage."));
        return true;
      }
      const facilityId = pathname.slice("/api/v2/facilities/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(facilityId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid facility."));
        return true;
      }
      json(res, 200, { ok: true, correlationId, data: { available: hasPrivateBlobConfiguration() } });
      return true;
    }
    if (req.method === "POST" && pathname.startsWith("/api/v2/facilities/") && url.searchParams.get("action") === "claim-upload") {
      const requestId = pathname.slice("/api/v2/facilities/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(requestId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid claim request."));
        return true;
      }
      const body = await parseRequestBody(req);
      const result = await handleClaimEvidenceUpload({ body, headers: req.headers, url: url.toString(), requestId });
      json(res, 200, result);
      return true;
    }
    if (req.method === "GET" && pathname.startsWith("/api/v2/facilities/") && url.searchParams.get("action") === "claim-evidence") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before reading private claim evidence."));
        return true;
      }
      const facilityId = pathname.slice("/api/v2/facilities/".length);
      const requestId = url.searchParams.get("requestId") ?? "";
      const index = Number(url.searchParams.get("index") ?? "0");
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(facilityId) || !uuidPattern.test(requestId) || !Number.isInteger(index) || index < 0 || index >= 12) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid claim evidence reference."));
        return true;
      }
      const evidence = await repository.getClaimEvidenceForViewer({ authUserId, facilityId, requestId, index });
      if (!evidence) {
        json(res, 404, errorBody(correlationId, "EVIDENCE_NOT_FOUND", "The private evidence is unavailable to this account."));
        return true;
      }
      const result = await readPrivateEvidence(evidence.objectKey);
      res.statusCode = 200;
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Length", String(result.size));
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.end(result.body);
      return true;
    }
    if (req.method === "POST" && pathname.startsWith("/api/v2/facilities/") && url.searchParams.get("action") === "claim-submit") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before submitting private claim evidence."));
        return true;
      }
      const requestId = pathname.slice("/api/v2/facilities/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const input = await parseRequestBody(req);
      const version = Number(input.version);
      const rawEvidence = Array.isArray(input.evidence) ? input.evidence : [];
      const allowedKinds = /* @__PURE__ */ new Set(["identity", "company", "facility", "product", "service", "location"]);
      const evidence = rawEvidence.map((item) => {
        const value = item && typeof item === "object" ? item : {};
        return { evidenceKind: typeof value.evidenceKind === "string" ? value.evidenceKind : "", objectKey: typeof value.objectKey === "string" ? value.objectKey : "", checksum: value.checksum === null || value.checksum === void 0 ? null : String(value.checksum) };
      });
      if (!uuidPattern.test(requestId) || !Number.isInteger(version) || version < 1 || evidence.length < 1 || evidence.length > 12 || evidence.some((item) => !allowedKinds.has(item.evidenceKind) || !/^private:\/\/omni\//.test(item.objectKey) || item.objectKey.length > 512 || /(?:https?:|data:|\s)/i.test(item.objectKey) || item.checksum !== null && item.checksum.length > 128)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide a valid claim version and typed private evidence references."));
        return true;
      }
      const result = await repository.submitClaimEvidence({ authUserId, requestId, version, evidence, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname.startsWith("/api/v2/facilities/") && url.searchParams.get("action") === "claim-cancel") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before cancelling your claim draft."));
        return true;
      }
      const requestId = pathname.slice("/api/v2/facilities/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const input = await parseRequestBody(req);
      const version = Number(input.version);
      if (!uuidPattern.test(requestId) || !Number.isInteger(version) || version < 1) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide a valid claim and version."));
        return true;
      }
      const result = await repository.cancelClaim({ authUserId, requestId, version, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname.startsWith("/api/v2/facilities/") && url.searchParams.get("action") === "review") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized Omni reviewer before reviewing a claim."));
        return true;
      }
      const requestId = pathname.slice("/api/v2/facilities/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const input = await parseRequestBody(req);
      const outcome = input.outcome === "certified" || input.outcome === "rejected" || input.outcome === "needs_more_evidence" ? input.outcome : "";
      const reason = typeof input.reason === "string" ? input.reason.trim() : "";
      if (!uuidPattern.test(requestId) || !outcome || reason.length < 3 || reason.length > 1e3) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide a valid claim, review outcome and bounded reason."));
        return true;
      }
      const result = await repository.reviewFacilityClaim({ authUserId, requestId, outcome, reason, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/public/facilities" && url.searchParams.get("reviewer") === "seller-activations") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized reviewer to view seller activation candidates."));
        return true;
      }
      const result = await repository.listSellerActivationQueue({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname.startsWith("/api/v2/facilities/") && url.searchParams.get("action") === "reviewer-seller-suspension") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized reviewer to change seller account status."));
        return true;
      }
      const accountId = pathname.slice("/api/v2/facilities/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const input = await parseRequestBody(req);
      const suspended = input.suspended === true || input.suspended === false ? input.suspended : null;
      const reason = typeof input.reason === "string" ? input.reason.trim() : "";
      if (!uuidPattern.test(accountId) || suspended === null || reason.length < 3 || reason.length > 1e3) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide a valid account status and bounded reason."));
        return true;
      }
      const result = await repository.setSellerAccountSuspension({ authUserId, accountId, suspended, reason, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname.startsWith("/api/v2/facilities/") && url.searchParams.get("action") === "reviewer-seller-activation") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized reviewer to activate a seller account."));
        return true;
      }
      const accountId = pathname.slice("/api/v2/facilities/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(accountId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide a valid account identifier."));
        return true;
      }
      const result = await repository.activateSellerAccount({ authUserId, accountId, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/admin/seller-activations") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized reviewer to view seller activation candidates."));
        return true;
      }
      const result = await repository.listSellerActivationQueue({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname.startsWith("/api/v2/admin/seller-accounts/")) {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized reviewer to change seller account status."));
        return true;
      }
      const accountId = pathname.slice("/api/v2/admin/seller-accounts/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const input = await parseRequestBody(req);
      const suspended = input.suspended === true || input.suspended === false ? input.suspended : null;
      const reason = typeof input.reason === "string" ? input.reason.trim() : "";
      if (!uuidPattern.test(accountId) || suspended === null || reason.length < 3 || reason.length > 1e3) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide a valid account status and bounded reason."));
        return true;
      }
      const result = await repository.setSellerAccountSuspension({ authUserId, accountId, suspended, reason, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname.startsWith("/api/v2/admin/seller-activations/")) {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized reviewer to activate a seller account."));
        return true;
      }
      const accountId = pathname.slice("/api/v2/admin/seller-activations/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(accountId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Provide a valid account identifier."));
        return true;
      }
      const result = await repository.activateSellerAccount({ authUserId, accountId, correlationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname.startsWith("/api/v2/facilities/") && url.searchParams.get("action") === "notification-seen") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in to update your Omni inbox."));
        return true;
      }
      const notificationId = pathname.slice("/api/v2/facilities/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(notificationId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid notification."));
        return true;
      }
      const result = await repository.markNotificationSeen({ authUserId, notificationId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/public/facilities") {
      const hasBounds = ["west", "south", "east", "north"].every((key) => url.searchParams.has(key));
      const bounds = hasBounds ? [numberParam(url, "west", -180), numberParam(url, "south", -90), numberParam(url, "east", 180), numberParam(url, "north", 90)] : void 0;
      const category = url.searchParams.get("category")?.trim() || void 0;
      const facilities = await repository.listPublicFacilities(bounds, url.searchParams.get("q") ?? void 0, category);
      json(res, 200, { ok: true, correlationId, data: facilities });
      return true;
    }
    if (req.method === "GET" && pathname.startsWith("/api/v2/facilities/")) {
      const id = pathname.slice("/api/v2/facilities/".length);
      const facility = await repository.getFacilityDetail(id);
      if (!facility) json(res, 404, errorBody(correlationId, "NOT_FOUND", "Facility was not found."));
      else json(res, 200, { ok: true, correlationId, data: facility });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/transaction-transitions" && url.searchParams.get("action") === "snapshot") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in to view this transaction."));
        return true;
      }
      const transactionId = url.searchParams.get("transactionId")?.trim() ?? "";
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid transaction."));
        return true;
      }
      const result = await repository.getTransaction({ authUserId, transactionId });
      if (!result) {
        json(res, 404, errorBody(correlationId, "NOT_FOUND", "The transaction was not found for this account."));
        return true;
      }
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if ((req.method === "GET" || req.method === "POST") && pathname === "/api/v2/transaction-messages") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in to use the transaction chat."));
        return true;
      }
      const transactionId = url.searchParams.get("transactionId")?.trim() ?? "";
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid transaction."));
        return true;
      }
      if (req.method === "GET") {
        const result2 = await repository.listTransactionMessages({ authUserId, transactionId });
        if (!result2) {
          json(res, 404, errorBody(correlationId, "NOT_FOUND", "The transaction was not found for this account."));
          return true;
        }
        json(res, 200, { ok: true, correlationId, data: result2 });
        return true;
      }
      const input = await parseRequestBody(req);
      const body = typeof input.body === "string" ? input.body.trim() : "";
      if (!body || body.length > 2e3) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Message must contain between 1 and 2000 characters."));
        return true;
      }
      const result = await repository.createTransactionMessage({ authUserId, transactionId, body });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname.startsWith("/api/v2/transactions/")) {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in to view this transaction."));
        return true;
      }
      const transactionId = pathname.slice("/api/v2/transactions/".length);
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid transaction."));
        return true;
      }
      const result = await repository.getTransaction({ authUserId, transactionId });
      if (!result) {
        json(res, 404, errorBody(correlationId, "NOT_FOUND", "The transaction was not found for this account."));
        return true;
      }
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/qr-verifications") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before verifying a transaction QR code."));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === "string" ? input.transactionId : "";
      const tokenHash = typeof input.tokenHash === "string" ? input.tokenHash : "";
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId) || tokenHash.length < 16 || tokenHash.length > 512) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid transaction and QR token."));
        return true;
      }
      const result = await repository.verifyQrToken({
        authUserId,
        transactionId,
        tokenHash,
        now: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (!result.accepted) {
        json(res, 409, errorBody(correlationId, "CONFLICT", "The QR code is invalid, expired or already verified."));
        return true;
      }
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/transaction-transitions") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before changing a transaction state."));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === "string" ? input.transactionId : "";
      const from = input.from;
      const to = input.to;
      const actorRole = input.actorRole;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId) || !isTransactionState(from) || !isTransactionState(to) || actorRole !== "buyer" && actorRole !== "seller") {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid transaction, state transition and actor role."));
        return true;
      }
      const result = await repository.transitionTransaction({
        authUserId,
        transactionId,
        from,
        to,
        actorRole,
        correlationId,
        now: (/* @__PURE__ */ new Date()).toISOString()
      });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/transaction-ratings") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before rating a transaction."));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === "string" ? input.transactionId : "";
      const score = typeof input.score === "number" ? input.score : Number.NaN;
      const note = typeof input.note === "string" ? input.note : "";
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId) || !Number.isInteger(score) || score < 1 || score > 5 || note.length > 500) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid transaction, a score from 1 to 5 and a note of 500 characters or fewer."));
        return true;
      }
      const result = await repository.submitTransactionRating({
        authUserId,
        transactionId,
        score,
        note,
        correlationId,
        now: (/* @__PURE__ */ new Date()).toISOString()
      });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/external-payment-confirmations") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before confirming an external payment."));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === "string" ? input.transactionId : "";
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid transaction."));
        return true;
      }
      const result = await repository.confirmExternalPayment({
        authUserId,
        transactionId,
        correlationId,
        now: (/* @__PURE__ */ new Date()).toISOString()
      });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/external-payment-declarations") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before declaring an external payment."));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === "string" ? input.transactionId : "";
      const method = input.method;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId) || !["cash", "mobile_money", "pay_on_delivery"].includes(method)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid transaction and supported external payment method."));
        return true;
      }
      const result = await repository.declareExternalPayment({
        authUserId,
        transactionId,
        method,
        correlationId,
        now: (/* @__PURE__ */ new Date()).toISOString()
      });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/fedapay/webhook") {
      const rawBody = await readRawBody(req);
      const signature = typeof req.headers["x-fedapay-signature"] === "string" ? req.headers["x-fedapay-signature"] : null;
      if (!verifyFedaPayWebhookSignature(rawBody, signature)) {
        json(res, 400, errorBody(correlationId, "WEBHOOK_INVALID", "FedaPay webhook signature is invalid."));
        return true;
      }
      let payload;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "FedaPay webhook body must be valid JSON."));
        return true;
      }
      const eventId = String(payload.id ?? payload.event_id ?? "").trim();
      const eventName = String(payload.name ?? payload.type ?? "").toLowerCase();
      const object = payload.object && typeof payload.object === "object" && !Array.isArray(payload.object) ? payload.object : payload.data && typeof payload.data === "object" && !Array.isArray(payload.data) ? payload.data : payload;
      const transaction = object.transaction && typeof object.transaction === "object" && !Array.isArray(object.transaction) ? object.transaction : object;
      const metadata = transaction.custom_metadata && typeof transaction.custom_metadata === "object" && !Array.isArray(transaction.custom_metadata) ? transaction.custom_metadata : {};
      const status = eventName.includes("approved") ? "approved" : eventName.includes("declined") ? "declined" : eventName.includes("canceled") || eventName.includes("cancelled") ? "canceled" : "pending";
      const result = await repository.reconcileWalletRecharge({
        providerTransactionId: String(transaction.id ?? transaction.reference ?? "").trim(),
        providerEventId: eventId || `${String(transaction.id ?? transaction.reference ?? "")}:${eventName}`,
        status,
        amountMinor: Number(transaction.amount),
        currency: typeof transaction.currency === "string" ? transaction.currency : transaction.currency && typeof transaction.currency === "object" && !Array.isArray(transaction.currency) ? String(transaction.currency.iso ?? "") : "",
        omniRechargeId: metadata.omni_recharge_id ? String(metadata.omni_recharge_id) : metadata.deposit_id ? String(metadata.deposit_id) : null,
        now: (/* @__PURE__ */ new Date()).toISOString()
      });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/wallet/recharges") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before recharging your Omni Wallet."));
        return true;
      }
      const idempotencyKey = String(req.headers["idempotency-key"] ?? "").trim();
      if (!idempotencyKey) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Idempotency-Key is required for Wallet recharge."));
        return true;
      }
      const input = await parseRequestBody(req);
      const customer = input.customer && typeof input.customer === "object" && !Array.isArray(input.customer) ? input.customer : {};
      const result = await repository.createWalletRecharge({
        authUserId,
        amountMinor: Number(input.amountMinor),
        currency: typeof input.currency === "string" ? input.currency : "",
        idempotencyKey,
        callbackUrl: typeof input.callbackUrl === "string" ? input.callbackUrl : "",
        customer: {
          email: typeof customer.email === "string" ? customer.email : null,
          firstName: typeof customer.firstName === "string" ? customer.firstName : null,
          lastName: typeof customer.lastName === "string" ? customer.lastName : null
        }
      });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/wallet/pro") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before activating Omni Pro."));
        return true;
      }
      const idempotencyKey = String(req.headers["idempotency-key"] ?? "").trim();
      const input = await parseRequestBody(req);
      const facilityId = typeof input.facilityId === "string" ? input.facilityId.trim() : "";
      const reference = typeof input.reference === "string" ? input.reference.trim() : idempotencyKey;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(facilityId) || !reference || reference !== idempotencyKey) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "A valid facility and matching Idempotency-Key are required."));
        return true;
      }
      const result = await repository.activateFacilityPro({ authUserId, facilityId, reference, now: (/* @__PURE__ */ new Date()).toISOString() });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/wallet") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in to view your Omni Wallet."));
        return true;
      }
      const result = await repository.getWalletOverview({ authUserId });
      if (!result) {
        json(res, 403, errorBody(correlationId, "FORBIDDEN", "Your account is not available for Wallet access."));
        return true;
      }
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/seller/demo-rebind") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before activating the bounded Seller demonstration."));
        return true;
      }
      const result = await repository.rebindDemoSeller({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/seller/availability-requests") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized seller to view incoming requests."));
        return true;
      }
      const result = await repository.getSellerAvailabilityQueue({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    const sellerProductMatch = pathname.match(/^\/api\/v2\/seller\/catalogue\/([0-9a-f-]{36})$/i);
    if (sellerProductMatch && (req.method === "PATCH" || req.method === "POST")) {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized seller before changing an offer."));
        return true;
      }
      const input = await parseRequestBody(req);
      const productId = sellerProductMatch[1];
      if (req.method === "POST") {
        const to = input.to === "published" || input.to === "archived" ? input.to : null;
        if (!to) throw new ApiInputError("Choose a valid publication transition.");
        const result2 = await repository.transitionSellerProduct({ authUserId, productId, to });
        json(res, 200, { ok: true, correlationId, data: result2 });
        return true;
      }
      const name = typeof input.name === "string" ? input.name : "";
      const description = input.description === null || input.description === void 0 ? null : typeof input.description === "string" ? input.description : "";
      const unit = typeof input.unit === "string" ? input.unit : "unit";
      const currency = typeof input.currency === "string" ? input.currency : "";
      const discountKind = input.discountKind === "percentage" || input.discountKind === "fixed" ? input.discountKind : null;
      const priceMinor = Number(input.priceMinor);
      const discountValueMinor = Number(input.discountValueMinor);
      if (!name.trim() || name.length > 180 || !currency || !discountKind || !Number.isInteger(priceMinor) || !Number.isInteger(discountValueMinor)) throw new ApiInputError("A valid product name, price, currency and reduction are required.");
      const result = await repository.updateSellerProductDraft({ authUserId, productId, name, description, unit, priceMinor, currency, discountKind, discountValueMinor });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/seller/facilities") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized seller to create a facility."));
        return true;
      }
      const input = await parseRequestBody(req);
      const name = typeof input.name === "string" ? input.name : "";
      const category = input.category === null || input.category === void 0 ? null : typeof input.category === "string" ? input.category : "";
      const description = input.description === null || input.description === void 0 ? null : typeof input.description === "string" ? input.description : "";
      const address = input.address === null || input.address === void 0 ? null : typeof input.address === "string" ? input.address : "";
      const latitude = Number(input.latitude);
      const longitude = Number(input.longitude);
      const idempotencyKey = req.headers["idempotency-key"];
      if (!name.trim() || name.length > 180 || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || typeof idempotencyKey !== "string" || idempotencyKey.length < 12 || idempotencyKey.length > 180) {
        throw new ApiInputError("A valid facility name, coordinates and idempotency key are required.");
      }
      const result = await repository.createSellerFacility({ authUserId, name, category, description, address, latitude, longitude, idempotencyKey });
      json(res, result.created ? 201 : 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/seller/catalogue") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized seller to create an offer."));
        return true;
      }
      const input = await parseRequestBody(req);
      const facilityId = typeof input.facilityId === "string" ? input.facilityId : "";
      const name = typeof input.name === "string" ? input.name : "";
      const description = input.description === null || input.description === void 0 ? null : typeof input.description === "string" ? input.description : "";
      const unit = typeof input.unit === "string" ? input.unit : "unit";
      const currency = typeof input.currency === "string" ? input.currency : "";
      const discountKind = input.discountKind === "percentage" || input.discountKind === "fixed" ? input.discountKind : null;
      const priceMinor = Number(input.priceMinor);
      const discountValueMinor = Number(input.discountValueMinor);
      const idempotencyKey = req.headers["idempotency-key"];
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(facilityId) || !name.trim() || name.length > 180 || !currency || !discountKind || !Number.isInteger(priceMinor) || !Number.isInteger(discountValueMinor) || typeof idempotencyKey !== "string" || idempotencyKey.length < 12 || idempotencyKey.length > 180) {
        throw new ApiInputError("A valid facility, product, price, currency, reduction and idempotency key are required.");
      }
      const result = await repository.createSellerProductDraft({ authUserId, facilityId, name, description, unit, priceMinor, currency, discountKind, discountValueMinor, idempotencyKey });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/seller/catalogue") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized seller to view your catalogue."));
        return true;
      }
      const result = await repository.listSellerCatalogue({ authUserId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "GET" && pathname === "/api/v2/availability-responses") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in to view availability responses."));
        return true;
      }
      const requestId = url.searchParams.get("requestId")?.trim() ?? "";
      if (!requestId) {
        const result2 = await repository.getBuyerAvailabilityRequests({ authUserId });
        json(res, 200, { ok: true, correlationId, data: result2 });
        return true;
      }
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(requestId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid availability request."));
        return true;
      }
      const result = await repository.getAvailabilityResponses({ authUserId, requestId });
      json(res, 200, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/availability-responses") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized seller before responding to availability."));
        return true;
      }
      const input = await parseRequestBody(req);
      const requestId = typeof input.requestId === "string" ? input.requestId : "";
      const facilityId = typeof input.facilityId === "string" ? input.facilityId : "";
      const productId = typeof input.productId === "string" ? input.productId : "";
      const status = input.status;
      const rawQuantity = input.quantityAvailable;
      const quantityAvailable = rawQuantity === null || rawQuantity === void 0 ? null : Number(rawQuantity);
      const rawPrice = input.priceMinor;
      const priceMinor = rawPrice === null || rawPrice === void 0 ? null : Number(rawPrice);
      const sellerMessage = input.sellerMessage === null || input.sellerMessage === void 0 ? null : input.sellerMessage;
      const idempotencyKey = req.headers["idempotency-key"] ?? input.idempotencyKey;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(requestId) || !uuidPattern.test(facilityId) || !uuidPattern.test(productId) || status !== "available" && status !== "partial" && status !== "unavailable") {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid request, facility, product and response status."));
        return true;
      }
      if (quantityAvailable !== null && !Number.isInteger(quantityAvailable) || priceMinor !== null && !Number.isInteger(priceMinor)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Quantity and price must be whole numbers when provided."));
        return true;
      }
      if (sellerMessage !== null && typeof sellerMessage !== "string") {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Seller message must be text."));
        return true;
      }
      if (typeof idempotencyKey !== "string" || idempotencyKey.length < 8) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "A stable idempotency key is required."));
        return true;
      }
      const result = await repository.respondAvailability({
        authUserId,
        requestId,
        facilityId,
        productId,
        status,
        quantityAvailable,
        priceMinor,
        sellerMessage,
        idempotencyKey,
        correlationId
      });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && (pathname === "/api/v2/buyer-qr-issuances" || pathname === "/api/v2/qr-issuances" && url.searchParams.get("actor") === "buyer")) {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as the Buyer before showing a transaction QR code."));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === "string" ? input.transactionId : "";
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid transaction."));
        return true;
      }
      const result = await repository.issueBuyerQrToken({ authUserId, transactionId, correlationId });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/qr-issuances") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in as an authorized seller before showing a transaction QR code."));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === "string" ? input.transactionId : "";
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(transactionId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid transaction."));
        return true;
      }
      const result = await repository.issueQrToken({ authUserId, transactionId, correlationId });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/purchase-intents") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before choosing an offer."));
        return true;
      }
      const input = await parseRequestBody(req);
      const responseId = typeof input.responseId === "string" ? input.responseId : "";
      const idempotencyKey = req.headers["idempotency-key"] ?? input.idempotencyKey;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(responseId)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a valid availability response."));
        return true;
      }
      if (typeof idempotencyKey !== "string" || idempotencyKey.length < 8) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "A stable idempotency key is required."));
        return true;
      }
      const result = await repository.createPurchaseIntent({ authUserId, responseId, idempotencyKey });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    if (req.method === "POST" && pathname === "/api/v2/availability") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Create your account or sign in to verify availability."));
        return true;
      }
      const input = await parseRequestBody(req);
      const productId = typeof input.productId === "string" ? input.productId : "";
      const facilityId = typeof input.facilityId === "string" ? input.facilityId : "";
      const quantity = Number(input.quantity);
      const budgetMode = input.budgetMode === "maximum" ? "maximum" : "unlimited";
      const budgetMinor = input.budgetMinor === null || input.budgetMinor === void 0 ? null : Number(input.budgetMinor);
      const idempotencyKey = req.headers["idempotency-key"] ?? input.idempotencyKey;
      if (!productId || !facilityId || !Number.isInteger(quantity) || quantity < 1 || budgetMinor !== null && (!Number.isInteger(budgetMinor) || budgetMinor < 0)) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "Choose a product and a positive quantity."));
        return true;
      }
      if (typeof idempotencyKey !== "string" || idempotencyKey.length < 8) {
        json(res, 400, errorBody(correlationId, "INVALID_INPUT", "A stable idempotency key is required."));
        return true;
      }
      const result = await repository.createAvailabilityRequest({ authUserId, productId, facilityId, quantity, budgetMode, budgetMinor, idempotencyKey });
      json(res, 201, { ok: true, correlationId, data: result });
      return true;
    }
    json(res, 404, errorBody(correlationId, "NOT_FOUND", "V2 API route was not found."));
    return true;
  } catch (error) {
    const errorName = error instanceof Error ? error.name : typeof error;
    const errorRecord = typeof error === "object" && error !== null ? error : null;
    const errorCode = String(errorRecord?.code ?? "").slice(0, 32) || void 0;
    const errorMessage = String(errorRecord?.message ?? "").replace(/[0-9a-f]{8,}/gi, "[redacted]").replace(/Bearer\s+\S+/gi, "[redacted]").slice(0, 180) || void 0;
    const errorFields = {
      detail: String(errorRecord?.detail ?? "").slice(0, 120) || void 0,
      hint: String(errorRecord?.hint ?? "").slice(0, 120) || void 0,
      position: String(errorRecord?.position ?? "").slice(0, 32) || void 0,
      table: String(errorRecord?.table ?? "").slice(0, 80) || void 0,
      column: String(errorRecord?.column ?? "").slice(0, 80) || void 0,
      constraint: String(errorRecord?.constraint ?? "").slice(0, 80) || void 0
    };
    console.error("v2_api_error", { pathname, errorName, errorCode, errorMessage, ...errorFields });
    const failure = toApiErrorResponse(correlationId, error);
    json(res, failure.status, failure.body);
    return true;
  }
}

// src/server/vercel-handlers.ts
function requestUrl(req, fallbackPath) {
  const protocol = String(req.headers?.["x-forwarded-proto"] ?? "https");
  const host = String(req.headers?.host ?? "localhost");
  return new URL(String(req.url ?? fallbackPath), `${protocol}://${host}`);
}
async function qrIssuanceHandler(req, res) {
  const url = requestUrl(req, "/api/v2/qr-issuances");
  await handleApi(req, res, "/api/v2/qr-issuances", url);
}

// src/server/vercel/qr-issuances.ts
async function handler(req, res) {
  await qrIssuanceHandler(req, res);
}
export {
  handler as default
};
