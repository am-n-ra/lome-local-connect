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
function database() {
  const url = process.env.V2_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("V2_DATABASE_URL is not configured for the server runtime.");
  return neon(url);
}
var toFacility = (row) => ({
  id: String(row.id),
  name: String(row.name),
  category: String(row.category ?? "Local supply"),
  address: row.address ? String(row.address) : null,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  trust: String(row.trust_state),
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
var PurchaseIntentPolicyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PurchaseIntentPolicyError";
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
            and m.role = ${input.actorRole}
          for update of s
        ),
        eligible as (
          select * from locked
          where current_state = ${input.to}
             or (
               current_state = ${input.from}
               and (
                 (${input.actorRole} = 'seller' and current_state = 'qr_ready' and ${input.to} = 'qr_verified')
                 or (${input.actorRole} = 'buyer' and current_state = 'qr_verified' and ${input.to} = 'payment_declared')
                 or (${input.actorRole} = 'seller' and current_state = 'payment_declared' and ${input.to} = 'payment_confirmed')
                 or (${input.actorRole} = 'seller' and current_state = 'payment_confirmed' and ${input.to} = 'fulfilment_pending')
                 or (${input.actorRole} = 'seller' and current_state = 'fulfilment_pending' and ${input.to} = 'fulfilled')
                 or (${input.actorRole} = 'buyer' and current_state = 'fulfilled' and ${input.to} = 'received')
                 or (${input.actorRole} = 'buyer' and current_state = 'received' and ${input.to} = 'rated')
               )
             )
        ),
        inserted as (
          insert into v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
          select e.transaction_id, e.actor_account_id, ${input.to}, jsonb_build_object('from', e.current_state, 'actor_role', ${input.actorRole}), ${input.now}::timestamptz
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
          select r.actor_account_id, 'transaction_state_transition', 'transaction', r.transaction_id::text, ${input.correlationId}, ${input.from} || '->' || ${input.to}, ${input.now}::timestamptz
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
            ar.product_id,
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
        update v2_qr_tokens q
        set verified_at = ${input.now}::timestamptz,
            replay_count = q.replay_count + 1
        where q.transaction_id = ${input.transactionId}::uuid
          and q.token_hash = ${input.tokenHash}
          and q.verified_at is null
          and q.replay_count = 0
          and q.expires_at > ${input.now}::timestamptz
          and exists (
            select 1
            from v2_transaction_members m
            join v2_accounts a on a.id = m.account_id
            where m.transaction_id = q.transaction_id
              and a.auth_user_id = ${input.authUserId}
              and m.role = 'seller'
          )
        returning q.transaction_id, q.verified_at, q.replay_count
      `);
      const row = rows[0];
      if (!row) return { accepted: false, transactionId: input.transactionId, reason: "NOT_VERIFIED" };
      return {
        accepted: true,
        transactionId: String(row.transaction_id),
        verifiedAt: new Date(String(row.verified_at)).toISOString(),
        nextReplayCount: Number(row.replay_count)
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
  if (error instanceof AvailabilityPolicyError || error instanceof PurchaseIntentPolicyError || error instanceof TransactionPolicyError) {
    return { status: 409, body: errorBody(correlationId, "POLICY_REJECTED", error.message) };
  }
  return {
    status: 500,
    body: errorBody(correlationId, "INTERNAL_RECOVERABLE", "The service is temporarily unavailable. Please try again.", true)
  };
}
async function parseRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  let parsed;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiInputError("Request body must be valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new ApiInputError("Request body must be an object.");
  return parsed;
}
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
    if (req.method === "POST" && pathname === "/api/v2/external-payment-declarations") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before declaring an external payment."));
        return true;
      }
      const input = await parseRequestBody(req);
      const transactionId = typeof input.transactionId === "string" ? input.transactionId : "";
      const method = input.method;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
    if (req.method === "POST" && pathname === "/api/v2/purchase-intents") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Sign in before choosing an offer."));
        return true;
      }
      const input = await parseRequestBody(req);
      const responseId = typeof input.responseId === "string" ? input.responseId : "";
      const idempotencyKey = req.headers["idempotency-key"] ?? input.idempotencyKey;
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
async function purchaseIntentHandler(req, res) {
  const url = requestUrl(req, "/api/v2/purchase-intents");
  await handleApi(req, res, "/api/v2/purchase-intents", url);
}

// src/server/vercel/purchase-intents.ts
async function handler(req, res) {
  await purchaseIntentHandler(req, res);
}
export {
  handler as default
};
