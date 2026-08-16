import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");

const sql = neon(databaseUrl);
const before = await sql`
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'demand_requests' AND column_name = 'credit_cost'
  ) AS exists
`;

await sql`
  ALTER TABLE public.demand_requests
    ADD COLUMN IF NOT EXISTS credit_cost integer NOT NULL DEFAULT 1
`;
await sql`
  UPDATE public.demand_requests
  SET credit_cost = GREATEST(1, COALESCE(targeted_count, 1))
  WHERE credit_cost IS NULL OR credit_cost < 1
`;
await sql`
  ALTER TABLE public.demand_requests
    DROP CONSTRAINT IF EXISTS demand_requests_credit_cost_check
`;
await sql`
  ALTER TABLE public.demand_requests
    ADD CONSTRAINT demand_requests_credit_cost_check CHECK (credit_cost > 0)
`;

const after = await sql`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'demand_requests' AND column_name = 'credit_cost'
`;
console.log(JSON.stringify({ before: before[0], after: after[0] }, null, 2));
