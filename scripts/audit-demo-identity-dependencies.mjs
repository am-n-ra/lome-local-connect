import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
const sourceId = process.env.OMNI_SOURCE_PROFILE_ID;
const canonicalId = process.env.OMNI_CANONICAL_PROFILE_ID;
const secondaryId = process.env.OMNI_SECONDARY_PROFILE_ID;
if (!databaseUrl || !sourceId || !canonicalId || !secondaryId) {
  throw new Error(
    "DATABASE_URL, OMNI_SOURCE_PROFILE_ID, OMNI_CANONICAL_PROFILE_ID and OMNI_SECONDARY_PROFILE_ID are required",
  );
}
const sql = neon(databaseUrl);
const ids = { source: sourceId, canonical: canonicalId, secondary: secondaryId };
const digest = (value) => createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
const redacted = (value) => `${String(value).slice(0, 8)}…${String(value).slice(-4)}`;

const profileRows = await sql`
  SELECT id, email, onboarding_done
  FROM public.profiles
  WHERE id IN (${sourceId}, ${canonicalId}, ${secondaryId})
  ORDER BY id
`;
const authRows = await sql`
  SELECT id, email
  FROM neon_auth.user
  WHERE id IN (${sourceId}, ${canonicalId}, ${secondaryId})
  ORDER BY id
`;
const tables = [
  ["facilities", "owner_id"],
  ["user_roles", "user_id"],
  ["user_plans", "user_id"],
  ["demand_requests", "buyer_id"],
  ["carts", "buyer_id"],
  ["transactions", "buyer_id"],
  ["messages", "buyer_id"],
  ["messages", "sender_id"],
  ["reviews", "buyer_id"],
  ["coupons", "target_user_id"],
  ["coupon_assignments", "user_id"],
  ["redemptions", "user_id"],
  ["notifications", "user_id"],
  ["favorites", "user_id"],
  ["wishlists", "user_id"],
  ["wallet_accounts", "user_id"],
  ["wallet_deposits", "user_id"],
  ["credit_ledger", "user_id"],
  ["analytics_consents", "user_id"],
  ["product_events", "user_id"],
  ["offer_events", "user_id"],
];
const dependencies = [];
for (const [table, column] of tables) {
  const rows = await sql.query(
    `SELECT ${column} AS identity_id, count(*)::int AS row_count
     FROM public.${table}
     WHERE ${column} IN ($1, $2, $3)
     GROUP BY ${column}
     ORDER BY ${column}`,
    [sourceId, canonicalId, secondaryId],
  );
  dependencies.push({
    table,
    column,
    rows: rows.map((row) => ({
      identity: Object.entries(ids).find(([, id]) => id === row.identity_id)?.[0] ?? "unknown",
      row_count: row.row_count,
    })),
  });
}
const transactionTotals = await sql`
  SELECT buyer_id, count(*)::int AS row_count,
         coalesce(sum(amount), 0)::numeric AS amount_total,
         array_agg(DISTINCT status ORDER BY status) AS statuses
  FROM public.transactions
  WHERE buyer_id IN (${sourceId}, ${canonicalId}, ${secondaryId})
  GROUP BY buyer_id
  ORDER BY buyer_id
`;
const walletAccounts = await sql`
  SELECT user_id, count(*)::int AS row_count
  FROM public.wallet_accounts
  WHERE user_id IN (${sourceId}, ${canonicalId}, ${secondaryId})
  GROUP BY user_id
  ORDER BY user_id
`;
console.log(
  JSON.stringify(
    {
      identities: {
        source: { id: redacted(sourceId), id_hash: digest(sourceId) },
        canonical: { id: redacted(canonicalId), id_hash: digest(canonicalId) },
        secondary: { id: redacted(secondaryId), id_hash: digest(secondaryId) },
      },
      profiles: profileRows.map((row) => ({
        id: redacted(row.id),
        email_hash: digest(String(row.email ?? "").toLowerCase()),
        onboarding_done: row.onboarding_done,
      })),
      auth_users: authRows.map((row) => ({
        id: redacted(row.id),
        email_hash: digest(String(row.email ?? "").toLowerCase()),
      })),
      dependencies,
      transaction_totals: transactionTotals.map((row) => ({
        identity: Object.entries(ids).find(([, id]) => id === row.buyer_id)?.[0] ?? "unknown",
        row_count: row.row_count,
        amount_total: String(row.amount_total),
        statuses: row.statuses,
      })),
      wallet_accounts: walletAccounts.map((row) => ({
        identity: Object.entries(ids).find(([, id]) => id === row.user_id)?.[0] ?? "unknown",
        row_count: row.row_count,
      })),
      read_only: true,
      raw_emails_emitted: false,
      raw_ids_emitted: false,
    },
    null,
    2,
  ),
);
