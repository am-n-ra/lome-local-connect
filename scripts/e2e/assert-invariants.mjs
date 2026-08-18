import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");
const sql = neon(databaseUrl);
const enforcementSince = process.env.OMNI_E2E_ENFORCE_AFTER;
if (!enforcementSince) {
  throw new Error("OMNI_E2E_ENFORCE_AFTER doit être défini pour distinguer les fixtures legacy.");
}

const checks = {
  completedWithoutReview: await sql`
    SELECT count(*)::int AS count
    FROM public.transactions t
    WHERE t.status = 'completed'
      AND t.completed_at >= ${enforcementSince}::timestamptz
      AND NOT EXISTS (SELECT 1 FROM public.reviews r WHERE r.transaction_id = t.id)
  `,
  legacyCompletedWithoutReview: await sql`
    SELECT count(*)::int AS count
    FROM public.transactions t
    WHERE t.status = 'completed'
      AND t.completed_at < ${enforcementSince}::timestamptz
      AND NOT EXISTS (SELECT 1 FROM public.reviews r WHERE r.transaction_id = t.id)
  `,
  activeWithoutIntentKey: await sql`
    SELECT count(*)::int AS count
    FROM public.transactions
    WHERE status IN ('pending','qr_generated','qr_verified','payment_pending','paid','fulfillment','received','rating_pending')
      AND intent_key IS NULL
  `,
  duplicateActiveIntentKeys: await sql`
    SELECT count(*)::int AS count
    FROM (
      SELECT buyer_id, intent_key
      FROM public.transactions
      WHERE buyer_id IS NOT NULL AND intent_key IS NOT NULL
        AND status IN ('pending','qr_generated','qr_verified','payment_pending','paid','fulfillment','received','rating_pending')
      GROUP BY buyer_id, intent_key HAVING count(*) > 1
    ) duplicate_groups
  `,
  duplicateCouponRedemptions: await sql`
    SELECT count(*)::int AS count
    FROM (
      SELECT coupon_id, user_id, transaction_id
      FROM public.redemptions
      GROUP BY coupon_id, user_id, transaction_id HAVING count(*) > 1
    ) duplicate_groups
  `,
  approvedDepositsWithoutLedger: await sql`
    SELECT count(*)::int AS count
    FROM public.wallet_deposits d
    WHERE d.status = 'approved'
      AND NOT EXISTS (
        SELECT 1 FROM public.wallet_accounts a
        JOIN public.wallet_ledger_entries e ON e.account_id = a.id
        WHERE a.facility_id = d.facility_id
          AND e.reference_type = 'fedapay_deposit'
          AND e.reference_id = d.id::text
          AND e.bucket = 'wallet'
      )
  `,
  walletSnapshotDrift: await sql`
    SELECT count(*)::int AS count
    FROM public.wallet_balance_snapshots s
    WHERE s.available_amount <> GREATEST((
      SELECT COALESCE(sum(e.amount), 0)::bigint
      FROM public.wallet_ledger_entries e
      WHERE e.account_id = s.account_id AND e.bucket = s.bucket
        AND e.status = 'posted' AND e.available_at <= now()
    ), 0)
  `,
};

const failures = Object.entries(checks)
  .filter(([, rows]) => Number(rows[0]?.count ?? 0) !== 0)
  .map(([name, rows]) => ({ name, count: Number(rows[0]?.count ?? 0) }));
console.log(JSON.stringify({ checks, failures, ok: failures.length === 0 }, null, 2));
if (failures.length > 0) process.exitCode = 1;
