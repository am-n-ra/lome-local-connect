import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");
const output =
  process.env.OMNI_SNAPSHOT_OUTPUT ??
  "/home/ubuntu/omni-backups/omni-identity-surfaces-20260819.json";
const sql = neon(databaseUrl);

const targetTables = [
  "profiles",
  "user_roles",
  "facilities",
  "facility_media",
  "products",
  "subscriptions",
  "ad_campaigns",
  "seller_unlocks",
  "demand_requests",
  "demand_responses",
  "carts",
  "transactions",
  "transaction_events",
  "messages",
  "notifications",
  "reviews",
  "coupons",
  "coupon_assignments",
  "redemptions",
  "offer_events",
  "analytics_consents",
  "product_events",
  "favorites",
  "wishlists",
  "wallet_accounts",
  "wallet_ledger_entries",
  "wallet_transfers",
  "wallet_bucket_snapshots",
  "wallet_deposits",
  "audit_log",
];

const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;
const normalize = (_key, value) => {
  if (typeof value === "bigint") return value.toString();
  if (Buffer.isBuffer(value)) return { __encoding: "base64", value: value.toString("base64") };
  return value;
};

const catalog = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name
`;
const available = new Set(catalog.map((row) => row.table_name));
const tables = targetTables.filter((table) => available.has(table));
const skipped = targetTables.filter((table) => !available.has(table));
const snapshot = {
  generated_at: new Date().toISOString(),
  target_tables: tables,
  skipped_tables: skipped,
  rows: {},
};

for (const table of tables) {
  const rows = await sql.query(`SELECT * FROM public.${quoteIdentifier(table)}`);
  snapshot.rows[table] = rows;
}

const content = `${JSON.stringify(snapshot, normalize, 2)}\n`;
await writeFile(output, content, { mode: 0o600 });
const checksum = createHash("sha256").update(content).digest("hex");
const counts = Object.fromEntries(tables.map((table) => [table, snapshot.rows[table].length]));
console.log(
  JSON.stringify(
    {
      output,
      checksum,
      table_count: tables.length,
      counts,
      read_only: true,
      raw_database_url_emitted: false,
    },
    null,
    2,
  ),
);
