import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");

const sql = neon(databaseUrl);
const columns = await sql`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name IN ('demand_requests', 'demand_responses')
  ORDER BY ordinal_position
`;
const migrations = await sql`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    AND (table_name ILIKE '%migration%' OR table_name ILIKE '%drizzle%')
  ORDER BY table_schema, table_name
`;
console.log(JSON.stringify({ columns, migrations }, null, 2));
