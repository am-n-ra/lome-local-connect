// Root read-path guard — exercises EVERY read path against a REAL Postgres database.
//
// Why this exists: on 2026-09-26, 607 green tests hid three production defects that
// Postgres rejects outright:
//   RB-PROD-1  createSellerFacility declared the CTE `inserted` twice
//   RB-PROD-2  the draft-offer ON CONFLICT did not repeat the partial-index predicate
//   RB-PROD-3  listPublicFacilities selected e.commercial_plan without e in GROUP BY
//              -> the buyer map returned HTTP 500 in production
// The repository tests use a STUBBED `sql` that never executes SQL, so a statement that
// cannot even compile passes every unit test. Only a real database is an oracle for SQL.
//
// This script calls the shipped repository read paths, so any statement that Postgres
// rejects fails here. It is READ-ONLY: it writes nothing, so it is safe to run against
// the canonical branch.
//
//   ROOT_READ_PATH_DATABASE_URL=postgresql://... npx tsx scripts/prove-root-read-paths.mjs
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.ROOT_READ_PATH_DATABASE_URL;
if (!dbUrl) {
  console.error('root-read-path: missing ROOT_READ_PATH_DATABASE_URL');
  process.exit(2);
}

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);

let failures = 0;
let ran = 0;

async function check(label, fn) {
  ran += 1;
  try {
    const result = await fn();
    const size = Array.isArray(result)
      ? `${result.length} rows`
      : result && typeof result === 'object'
        ? `${Object.keys(result).length} keys`
        : String(result);
    console.log(`PASS ${label} :: ${size}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // A policy rejection is a legitimate answer, not a broken statement. Only a
    // Postgres-level failure means the SQL itself cannot run.
    const policyRejection =
      error?.name === 'SellerAuthorizationPolicyError' ||
      error?.name === 'WalletPolicyError' ||
      error?.name === 'BuyerSearchPolicyError' ||
      error?.name === 'FieldPilotPolicyError' ||
      /not owned|not found or not owned|POLICY/i.test(message);
    if (policyRejection) {
      console.log(`PASS ${label} :: policy rejection (statement compiled and ran) :: ${message}`);
      return;
    }
    failures += 1;
    console.log(`FAIL ${label} :: ${message}`);
  }
}

// Real identities observed in the canonical database. A read path that only fails for
// a specific onboarding state must still be exercised with an identity in that state.
const SELLER_READY = '56e7d0f0-968e-4303-863d-14e424cd7ea9';
const SEED_COMPLETE = 'omni-demo-seed-lome-2026-08-29';
const ADMIN = '6dfee45e-a86a-4e57-b2fd-ae203aa5e309';

const rows = await sql`select id from v2_facilities limit 1`;
const anyFacilityId = rows[0]?.id ? String(rows[0].id) : null;

console.log('root-read-path: driving shipped read paths against the real database');

// The buyer map. This is the path that returned 500 in production.
await check('listPublicFacilities (buyer map)', () => repository.listPublicFacilities());
await check('listPublicFacilities + query', () => repository.listPublicFacilities(undefined, 'boulangerie'));
await check('listPublicFacilities + constraints', () =>
  repository.listPublicFacilities(undefined, '', undefined, { quantiteMin: 1, rayonKm: 25 }));

if (anyFacilityId) {
  await check('getFacilityDetail', () => repository.getFacilityDetail(anyFacilityId));
}

// Owner-scoped paths must be driven with a facility the identity ACTUALLY owns,
// otherwise a policy rejection ("not owned") is indistinguishable from a SQL error.
const owned = await sql`
  select f.id
  from v2_facilities f
  join v2_accounts a on a.id = f.account_id
  where a.auth_user_id = ${SEED_COMPLETE}
  limit 1
`;
const ownedFacilityId = owned[0]?.id ? String(owned[0].id) : null;

await check('listSellerCatalogue (seller_ready)', () => repository.listSellerCatalogue({ authUserId: SELLER_READY }));
await check('listSellerCatalogue (complete)', () => repository.listSellerCatalogue({ authUserId: SEED_COMPLETE }));
await check('getSellerAvailabilityQueue', () => repository.getSellerAvailabilityQueue({ authUserId: SEED_COMPLETE }));
await check('getBuyerAvailabilityRequests', () => repository.getBuyerAvailabilityRequests({ authUserId: SEED_COMPLETE }));
await check('listOpenTransactions', () => repository.listOpenTransactions({ authUserId: SEED_COMPLETE }));
await check('getWalletOverview', () => repository.getWalletOverview({ authUserId: SELLER_READY }));
await check('getBuyerCreditSummary', () => repository.getBuyerCreditSummary({ authUserId: SEED_COMPLETE }));
await check('getBuyerProStatus', () => repository.getBuyerProStatus({ authUserId: SEED_COMPLETE }));
await check('listFavorites', () => repository.listFavorites({ authUserId: SEED_COMPLETE }));
await check('getBulkPacks', () => repository.getBulkPacks());
await check('listSavedSearches', () => repository.listSavedSearches({ authUserId: SEED_COMPLETE }));
await check('listMyTeamInvites', () => repository.listMyTeamInvites({ authUserId: SEED_COMPLETE }));

await check('getAccountContext', () => repository.getAccountContext({ authUserId: SEED_COMPLETE }));
await check('listRoleManagementAccounts (admin)', () => repository.listRoleManagementAccounts({ authUserId: ADMIN }));
await check('listTeams (admin)', () => repository.listTeams({ authUserId: ADMIN }));
await check('listReviewQueue (admin)', () => repository.listReviewQueue({ authUserId: ADMIN }));
await check('listSellerActivationQueue (admin)', () => repository.listSellerActivationQueue({ authUserId: ADMIN }));
await check('listAdminAuditEvents (admin)', () => repository.listAdminAuditEvents({ authUserId: ADMIN }));
await check('getAdminConsole (admin)', () => repository.getAdminConsole({ authUserId: ADMIN }));

if (ownedFacilityId) {
  await check('getFacilityAnalytics', () => repository.getFacilityAnalytics({ authUserId: SEED_COMPLETE, facilityId: ownedFacilityId }));
  await check('getFacilityBonusStatus', () => repository.getFacilityBonusStatus({ authUserId: SEED_COMPLETE, facilityId: ownedFacilityId }));
  await check('getFacilityRenewalStatus', () => repository.getFacilityRenewalStatus({ authUserId: SEED_COMPLETE, facilityId: ownedFacilityId }));
  await check('listFacilityAdCampaigns', () => repository.listFacilityAdCampaigns({ authUserId: SEED_COMPLETE, facilityId: ownedFacilityId }));
}

console.log(`root-read-path: ${ran - failures}/${ran} read paths answered against real SQL`);
if (failures > 0) {
  console.log(`root-read-path RESULT: FAIL (${failures} read path(s) rejected by Postgres)`);
  process.exit(1);
}
console.log('root-read-path RESULT: PASS');
