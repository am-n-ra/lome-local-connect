import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env["DATABASE_URL"] ?? process.env["NEON_DATABASE_URL"];
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");
const sql = neon(databaseUrl);

const [parity] = await sql.query(`
  WITH legacy AS (
    SELECT COALESCE(SUM(GREATEST(wallet_balance, 0)), 0)::bigint AS wallet_total,
           COALESCE(SUM(GREATEST(payout_balance, 0)), 0)::bigint AS payout_total
    FROM public.subscriptions
  ), projected AS (
    SELECT COALESCE(SUM(available_amount) FILTER (WHERE bucket = 'wallet'), 0)::bigint AS wallet_total,
           COALESCE(SUM(available_amount) FILTER (WHERE bucket = 'payout'), 0)::bigint AS payout_total,
           COUNT(*) FILTER (WHERE bucket = 'wallet')::int AS wallet_rows,
           COUNT(*) FILTER (WHERE bucket = 'payout')::int AS payout_rows,
           COUNT(DISTINCT account_id)::int AS accounts
    FROM public.wallet_balance_snapshots
  )
  SELECT legacy.wallet_total AS legacy_wallet,
         legacy.payout_total AS legacy_payout,
         projected.wallet_total AS projected_wallet,
         projected.payout_total AS projected_payout,
         projected.wallet_rows,
         projected.payout_rows,
         projected.accounts
  FROM legacy CROSS JOIN projected
`);

const functions = await sql.query(`
  SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN ('omni_ensure_wallet_account', 'omni_append_wallet_entry', 'omni_transfer_wallet_buckets', 'omni_rebuild_wallet_snapshot')
  ORDER BY routine_name
`);

const checks = {
  walletParity: Number(parity.legacy_wallet) === Number(parity.projected_wallet),
  payoutParity: Number(parity.legacy_payout) === Number(parity.projected_payout),
  fiveBucketsPerAccount: Number(parity.wallet_rows) === Number(parity.accounts) && Number(parity.payout_rows) === Number(parity.accounts),
  sqlFunctions: functions.length === 4,
};

console.log(JSON.stringify({ parity, functions, checks }, null, 2));
if (!Object.values(checks).every(Boolean)) process.exit(1);
