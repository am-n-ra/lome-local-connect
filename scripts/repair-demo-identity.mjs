import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
const sourceId = process.env.OMNI_SOURCE_PROFILE_ID;
const canonicalId = process.env.OMNI_CANONICAL_PROFILE_ID;
const secondaryId = process.env.OMNI_SECONDARY_PROFILE_ID;
const runId = process.env.OMNI_IDENTITY_REPAIR_RUN_ID;
const snapshotPath = process.env.OMNI_IDENTITY_SNAPSHOT_PATH;
if (!databaseUrl || !sourceId || !canonicalId || !secondaryId || !runId || !snapshotPath) {
  throw new Error("Database, three profile IDs, repair run ID and snapshot path are required.");
}
if (process.env.OMNI_IDENTITY_REPAIR_TARGET !== "current-test-dataset") {
  throw new Error("Refusing to mutate: OMNI_IDENTITY_REPAIR_TARGET must be current-test-dataset.");
}
if (process.env.OMNI_IDENTITY_REPAIR_ALLOW !== "1") {
  throw new Error("Refusing to mutate: OMNI_IDENTITY_REPAIR_ALLOW=1 is required.");
}
if (process.env.OMNI_IDENTITY_REPAIR_CONFIRM !== "TEST_ONLY_NO_NEON_DELETE") {
  throw new Error("Refusing to mutate: explicit no-Neon-Auth-delete confirmation is required.");
}
for (const id of [sourceId, canonicalId, secondaryId]) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Profile IDs must be UUIDs.");
}
if (!/^[A-Za-z0-9._:-]{8,100}$/.test(runId)) throw new Error("Invalid repair run ID.");

const snapshot = await readFile(snapshotPath);
const snapshotChecksum = createHash("sha256").update(snapshot).digest("hex");
const sql = neon(databaseUrl);
const redacted = (value) => `${String(value).slice(0, 8)}…${String(value).slice(-4)}`;
const identityIds = [sourceId, canonicalId, secondaryId];
const updateTargets = [
  ["facilities", "owner_id"],
  ["user_roles", "user_id"],
  ["user_interests", "user_id"],
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
  ["wallet_ledger_entries", "actor_user_id"],
  ["wallet_transfers", "actor_user_id"],
];
const availableRows = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
`;
const availableTables = new Set(availableRows.map((row) => row.table_name));
const targets = updateTargets.filter(([table]) => availableTables.has(table));

const preflight = await sql`
  SELECT
    (SELECT count(*)::int FROM neon_auth.user WHERE id::text = ${canonicalId}) AS canonical_auth_count,
    (SELECT count(*)::int FROM neon_auth.user WHERE id::text IN (${sourceId}, ${secondaryId})) AS legacy_auth_count,
    (SELECT count(*)::int FROM public.profiles WHERE id::text IN (${sourceId}, ${canonicalId}, ${secondaryId})) AS profile_count,
    (SELECT count(*)::int FROM public.user_plans WHERE user_id::text = ${secondaryId}) AS secondary_plan_count,
    (SELECT count(*)::int FROM public.user_plans WHERE user_id::text = ${canonicalId}) AS canonical_plan_count,
    (SELECT count(*)::int FROM public.wallet_ledger_entries WHERE actor_user_id::text IN (${sourceId}, ${secondaryId})) AS legacy_ledger_actor_count,
    (SELECT coalesce(sum(amount), 0)::text FROM public.wallet_ledger_entries) AS ledger_total,
    (SELECT count(*)::int FROM public.transactions WHERE buyer_id::text IN (${sourceId}, ${secondaryId})) AS legacy_transaction_count
`;
const check = preflight[0];
if (check.canonical_auth_count !== 1)
  throw new Error("Canonical ID is not exactly one Neon Auth user.");
if (check.legacy_auth_count !== 0)
  throw new Error("Refusing to relink a legacy ID that still exists in Neon Auth.");
if (check.profile_count !== 3)
  throw new Error("Expected exactly three duplicate application profiles.");
if (Number(check.legacy_transaction_count) > 0) {
  throw new Error(
    "Legacy profiles own transactions; transaction-owner merge requires a separate decision.",
  );
}

const results = await sql.transaction((tx) => [
  tx`SELECT pg_advisory_xact_lock(hashtextextended(${runId}, 0))`,
  ...targets.map(([table, column]) =>
    tx.query(
      `UPDATE public.${table} SET ${column} = $1 WHERE ${column}::text IN ($2::text, $3::text) RETURNING 1`,
      [canonicalId, sourceId, secondaryId],
    ),
  ),
  tx`INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, detail)
     SELECT ${canonicalId}, 'identity_repair_test_merge', 'profile_mapping', ${runId},
       jsonb_build_object(
         'source_profile_id', ${sourceId}::text,
         'secondary_profile_id', ${secondaryId}::text,
         'canonical_profile_id', ${canonicalId}::text,
         'snapshot_checksum', ${snapshotChecksum}::text,
         'user_plans_policy', 'preserved_legacy_and_canonical_rows',
         'neon_auth_delete', false
       )
     WHERE NOT EXISTS (
       SELECT 1 FROM public.audit_log
       WHERE action = 'identity_repair_test_merge' AND entity_type = 'profile_mapping' AND entity_id = ${runId}
     )
     RETURNING 1`,
]);

const updateCounts = Object.fromEntries(
  targets.map(([table, column], index) => [`${table}.${column}`, results[index + 1]?.length ?? 0]),
);
const after = await sql`
  SELECT
    (SELECT count(*)::int FROM neon_auth.user WHERE id::text = ${canonicalId}) AS canonical_auth_count,
    (SELECT count(*)::int FROM neon_auth.user WHERE id::text IN (${sourceId}, ${secondaryId})) AS legacy_auth_count,
    (SELECT count(*)::int FROM public.profiles WHERE id::text IN (${sourceId}, ${canonicalId}, ${secondaryId})) AS profile_count,
    (SELECT count(*)::int FROM public.facilities WHERE owner_id::text IN (${sourceId}, ${secondaryId})) AS legacy_facility_count,
    (SELECT count(*)::int FROM public.wallet_ledger_entries WHERE actor_user_id::text IN (${sourceId}, ${secondaryId})) AS legacy_ledger_actor_count,
    (SELECT coalesce(sum(amount), 0)::text FROM public.wallet_ledger_entries) AS ledger_total,
    (SELECT count(*)::int FROM public.user_plans WHERE user_id::text = ${secondaryId}) AS secondary_plan_count,
    (SELECT count(*)::int FROM public.user_plans WHERE user_id::text = ${canonicalId}) AS canonical_plan_count
`;
const result = after[0];
if (result.canonical_auth_count !== 1 || result.legacy_auth_count !== 0)
  throw new Error("Post-repair Neon Auth invariant failed.");
if (result.profile_count !== 3)
  throw new Error("Post-repair application-profile preservation failed.");
if (result.legacy_facility_count !== 0)
  throw new Error("Post-repair facility ownership invariant failed.");
if (result.legacy_ledger_actor_count !== 0)
  throw new Error("Post-repair wallet actor invariant failed.");
if (String(result.ledger_total) !== String(check.ledger_total))
  throw new Error("Wallet ledger total changed.");
if (
  result.secondary_plan_count !== check.secondary_plan_count ||
  result.canonical_plan_count !== check.canonical_plan_count
)
  throw new Error("User plan rows changed unexpectedly.");

console.log(
  JSON.stringify(
    {
      run_id: runId,
      source_profile: redacted(sourceId),
      secondary_profile: redacted(secondaryId),
      canonical_profile: redacted(canonicalId),
      updated_rows: updateCounts,
      audit_event_inserted: (results.at(-1)?.length ?? 0) === 1,
      snapshot_checksum: snapshotChecksum,
      invariants: {
        canonical_auth_count: result.canonical_auth_count,
        legacy_auth_count: result.legacy_auth_count,
        application_profiles_preserved: result.profile_count,
        legacy_facilities_remaining: result.legacy_facility_count,
        legacy_wallet_actors_remaining: result.legacy_ledger_actor_count,
        wallet_ledger_total_unchanged: true,
        user_plans_preserved: true,
      },
      neon_auth_modified: false,
      raw_ids_emitted: false,
    },
    null,
    2,
  ),
);
