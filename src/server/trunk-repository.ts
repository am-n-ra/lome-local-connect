import { neon } from '@neondatabase/serverless';
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
