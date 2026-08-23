import { neon } from '@neondatabase/serverless';
import { createHash, randomBytes } from 'node:crypto';

import type { QrVerificationResult, TransactionState, WalletEntryKind } from '../domain/contracts';
import type { AvailabilityResult, FacilityDetail, PublicFacility, PublicProduct } from '../trunk/types';

export interface DatabaseClient {
  query(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>;
  transaction?(queries: unknown[], options?: Record<string, unknown>): Promise<unknown[]>;
}

function database(): ReturnType<typeof neon> {
  const url = process.env.V2_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('V2_DATABASE_URL is not configured for the server runtime.');
  return neon(url);
}

const toFacility = (row: Record<string, unknown>): PublicFacility => ({
  id: String(row.id),
  name: String(row.name),
  category: String(row.category ?? 'Local supply'),
  address: row.address ? String(row.address) : null,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  trust: String(row.trust_state) as PublicFacility['trust'],
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
          select ar.id, ar.request_id, ar.facility_id, ar.product_id, ar.status,
                 ar.quantity_available, ar.price_minor, ar.observed_at,
                 ar.responder_account_id
          from v2_availability_responses ar
          join seller s on s.seller_account_id = ar.responder_account_id
          where ar.idempotency_key = ${input.idempotencyKey}
        ),
        eligible as (
          select r.id as request_id, f.id as facility_id, p.id as product_id,
                 s.seller_account_id,
                 case when ${input.status} = 'unavailable' then 0 else ${input.quantityAvailable} end as quantity_available,
                 case when ${input.status} = 'unavailable' then null else ${input.priceMinor} end as price_minor
          from v2_availability_requests r
          join v2_facilities f on f.id = ${input.facilityId}::uuid
          join v2_products p on p.id = ${input.productId}::uuid and p.facility_id = f.id
          join seller s on s.seller_account_id = f.account_id
          where r.id = ${input.requestId}::uuid
            and f.id = any(r.facility_scope)
            and p.publication_state = 'published'
            and r.product_id = p.id
            and (case when ${input.status} = 'unavailable' then 0 else ${input.quantityAvailable} end) <= p.quantity_allocated_omni
            and (case when ${input.status} = 'unavailable' then true else ${input.priceMinor} is not null end)
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
            coalesce((
              select e.state
              from v2_transaction_events e
              where e.transaction_id = q.transaction_id
              order by e.created_at desc, e.id desc
              limit 1
            ), 'intent_created') as current_state
          from v2_qr_tokens q
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
        select transaction_id, verified_at, replay_count
        from updated
        limit 1
      `);
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return { accepted: false, transactionId: input.transactionId, reason: 'NOT_VERIFIED' };
      return {
        accepted: true,
        transactionId: String(row.transaction_id),
        verifiedAt: new Date(String(row.verified_at)).toISOString(),
        nextReplayCount: Number(row.replay_count),
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
