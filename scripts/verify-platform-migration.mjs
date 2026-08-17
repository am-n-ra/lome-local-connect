import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");
const sql = neon(databaseUrl);
const tables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('facility_state_events', 'balance_ledger', 'seller_unlocks')
  ORDER BY table_name
`;
const unlocks = await sql`
  SELECT COUNT(*)::int AS count FROM public.seller_unlocks
`;
console.log(JSON.stringify({ tables, unlocks }, null, 2));
