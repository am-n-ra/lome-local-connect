// src/server/auth-context.ts
import { createRemoteJWKSet, jwtVerify } from "jose";
var keySet = null;
function remoteKeys() {
  const url = process.env.NEON_AUTH_JWKS_URL;
  if (!url) throw new Error("NEON_AUTH_JWKS_URL is not configured for the server runtime.");
  keySet ??= createRemoteJWKSet(new URL(url));
  return keySet;
}
async function getAuthUserId(headers) {
  const authorization = headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;
  const { payload } = await jwtVerify(token, remoteKeys());
  return typeof payload.sub === "string" && payload.sub.length > 0 ? payload.sub : null;
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
var toProduct = (row) => ({
  id: String(row.id),
  facilityId: String(row.facility_id),
  name: String(row.name),
  description: row.description ? String(row.description) : null,
  category: row.category ? String(row.category) : null,
  unit: String(row.unit ?? "unit"),
  priceMinor: Number(row.price_minor),
  currency: String(row.currency ?? "USD"),
  availableQuantity: row.quantity_allocated_omni === null ? null : Number(row.quantity_allocated_omni),
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
               p.price_minor, p.currency, p.quantity_allocated_omni,
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
    async createAvailabilityRequest(input) {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1e3).toISOString();
      const accountRows = await sql`
        insert into v2_accounts (auth_user_id, onboarding_state)
        values (${input.authUserId}, 'buyer_ready')
        on conflict (auth_user_id) do update set updated_at = now()
        returning id
      `;
      const accountId = String(accountRows[0]?.id);
      if (!accountId || accountId === "undefined") throw new Error("Unable to provision V2 account.");
      await sql`
        insert into v2_wallets (account_id) values (${accountId}::uuid)
        on conflict (account_id) do nothing
      `;
      await sql`
        insert into v2_availability_requests
          (buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, budget_minor, status, idempotency_key, expires_at)
        values
          (${accountId}::uuid, ${input.productId}::uuid, array[${input.facilityId}::uuid], ${input.quantity}, ${input.budgetMode}, ${input.budgetMinor}, 'submitted', ${input.idempotencyKey}, ${expiresAt}::timestamptz)
        on conflict (buyer_account_id, idempotency_key) do nothing
      `;
      const rows = await sql`
        select r.id, r.product_id, r.status, r.expires_at
        from v2_availability_requests r
        where r.buyer_account_id = ${accountId}::uuid and r.idempotency_key = ${input.idempotencyKey}
        limit 1
      `;
      const row = rows[0];
      if (!row) throw new Error("Availability request could not be persisted.");
      return {
        requestId: String(row.id),
        productId: String(row.product_id),
        facilityId: input.facilityId,
        status: String(row.status),
        expiresAt: new Date(String(row.expires_at)).toISOString(),
        message: "Request sent. The facility can now confirm the live availability."
      };
    }
  };
}

// src/server/http.ts
var json = (res, status, body2) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body2));
};
var errorBody = (correlationId, code, message, retryable = false) => ({
  ok: false,
  correlationId,
  error: { code, message, retryable }
});
async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Request body must be an object.");
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
    if (req.method === "POST" && pathname === "/api/v2/availability") {
      const authUserId = await getAuthUserId(req.headers);
      if (!authUserId) {
        json(res, 401, errorBody(correlationId, "AUTH_REQUIRED", "Create your account or sign in to verify availability."));
        return true;
      }
      const input = await body(req);
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
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    json(res, 500, errorBody(correlationId, "INTERNAL_RECOVERABLE", message, true));
    return true;
  }
}

// src/server/vercel-handlers.ts
function requestUrl(req, fallbackPath) {
  const protocol = String(req.headers?.["x-forwarded-proto"] ?? "https");
  const host = String(req.headers?.host ?? "localhost");
  return new URL(String(req.url ?? fallbackPath), `${protocol}://${host}`);
}
async function availabilityHandler(req, res) {
  const url = requestUrl(req, "/api/v2/availability");
  await handleApi(req, res, "/api/v2/availability", url);
}

// src/server/vercel/availability.ts
async function handler(req, res) {
  await availabilityHandler(req, res);
}
export {
  handler as default
};
