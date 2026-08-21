import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");
const sql = neon(databaseUrl);
const authTables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'neon_auth'
  ORDER BY table_name
`;
const authUsers = await sql`
  SELECT id, name, email
  FROM neon_auth.user
  WHERE lower(email) = lower('demo@omni.tg')
`;
const users = await sql`
  SELECT id, name, email, onboarding_done
  FROM public.profiles
  WHERE lower(email) = lower('demo@omni.tg')
`;
const facilities = users.length
  ? await sql`
      SELECT id, name, status, owner_id
      FROM public.facilities
      WHERE owner_id = ${users[0].id}
      ORDER BY created_at DESC
    `
  : [];
const transactions = users.length
  ? await sql`
      SELECT id, facility_id, status, payment_mode, qr_token, qr_authorised_at,
             paid_at, completed_at, created_at
      FROM public.transactions
      WHERE buyer_id = ${users[0].id}
      ORDER BY created_at DESC
      LIMIT 20
    `
  : [];
const demandRequests = authUsers.length
  ? await sql`
      SELECT id, buyer_id, search_term, quantity, radius_km, status, mode,
             targeted_count, credit_cost, created_at, expires_at
      FROM public.demand_requests
      WHERE buyer_id = ${authUsers[0].id}
      ORDER BY created_at DESC
      LIMIT 10
    `
  : [];
const demandResponses = demandRequests.length
  ? await sql`
      SELECT r.id, r.request_id, r.facility_id, r.available, r.kind,
             r.price, r.quantity, r.message, r.created_at
      FROM public.demand_responses r
      WHERE r.request_id = ANY(${demandRequests.map((request) => request.id)}::uuid[])
      ORDER BY r.created_at DESC
    `
  : [];
console.log(JSON.stringify({ authTables, authUsers, users, facilities, transactions, demandRequests, demandResponses }, null, 2));
