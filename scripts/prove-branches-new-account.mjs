// BRANCHES-NEW-ACCOUNT — prove a NEW account can create an offer, against a DISPOSABLE branch.
//
// The founder's defect was a DESYNCED account (facility + slot but stuck at buyer_ready). The
// self-heal repairs it on load. But the question that matters more is: does a NEW account ever
// get into that state? This proves the forward path is atomic, so no new account can be born
// desynced.
//
//   A) a fresh signup that bought something (row exists at buyer_ready) creates a facility →
//      promoted to seller_ready in the SAME statement → offer creation works with NO self-heal.
//   B) a brand-new auth user with NO account row at all → measured, so we know the boundary.
//
// Run on a throwaway branch:  BD_PROOF_DATABASE_URL=<branch> npx tsx scripts/prove-branches-new-account.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.BD_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('missing BD_PROOF_DATABASE_URL'); process.exit(2); }
const sql = neon(dbUrl);
const repo = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

async function offerAttempt(authUserId, facilityId, label) {
  try {
    await repo.createSellerProductDraft({
      authUserId, facilityId, name: `New ${label} ${tag}`, description: null, unit: 'unit',
      prixOriginal: 1000, currency: 'XOF', pourcentageReduction: 10, stockLoueOmni: 1,
      idempotencyKey: `offer-${label}-${tag}-${randomUUID()}`,
      positionKind: 'fixe', uniquenessKind: 'renouvelable', handoverKind: 'retrait', priceKind: 'fixe', conditionKind: 'neuf',
    });
    return { ok: true, error: '' };
  } catch (e) { return { ok: false, error: `${e.name}:${e.message}` }; }
}

// ── A) fresh signup that bought something: row exists at buyer_ready ────────────────
const authA = `new-buyer-${tag}`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${authA}, 'buyer_ready')`;

const ctxBefore = await repo.getAccountContext({ authUserId: authA });
step('A1 new buyer has NO seller workspace before creating a facility',
  ctxBefore?.capabilities.sellerWorkspace === false, JSON.stringify(ctxBefore?.capabilities));

const fac = await repo.createSellerFacility({
  authUserId: authA, name: `Nouvelle ${tag}`, facilityType: 'fixe', ownerKind: 'organisation',
  category: null, description: null, address: null, latitude: 6.172, longitude: 1.24, rayonKm: null,
  contactPhone: null, contactWhatsapp: null, idempotencyKey: `fac-${tag}`,
});

const stateA = (await sql`select onboarding_state from v2_accounts where auth_user_id = ${authA}`)[0];
step('A2 creating a facility promoted the account IN THE SAME STATEMENT (no self-heal)',
  stateA.onboarding_state === 'seller_ready', stateA.onboarding_state);

const offerA = await offerAttempt(authA, fac.facilityId, 'a');
step('A3 the new account can create an offer immediately', offerA.ok, offerA.error);

// ── B) brand-new auth user, NO account row at all (signup without a phone) ──────────
const authB = `new-signup-${tag}`;
const rowBeforeB = (await sql`select count(*)::int n from v2_accounts where auth_user_id = ${authB}`)[0].n;
step('B1 brand-new user has no account row yet', rowBeforeB === 0, String(rowBeforeB));

const ctxB = await repo.getAccountContext({ authUserId: authB });
step('B2 brand-new user with no row → context is null', ctxB === null, String(ctxB));

// B3 — the fix: creating the FIRST facility materialises the account and provisions the free
// slot in the same path, instead of refusing with a misleading "buy a slot" error.
let facB = null; let facBError = '';
try {
  facB = await repo.createSellerFacility({
    authUserId: authB, name: `Neuf ${tag}`, facilityType: 'fixe', ownerKind: 'organisation',
    category: null, description: null, address: null, latitude: 6.18, longitude: 1.25, rayonKm: null,
    contactPhone: null, contactWhatsapp: null, idempotencyKey: `facb-${tag}`,
  });
} catch (e) { facBError = `${e.name}:${e.message}`; }
step('B3 brand-new user (no row) CAN create their first facility', facB !== null, facBError);

const stateB = (await sql`select onboarding_state from v2_accounts where auth_user_id = ${authB}`)[0];
step('B4 that facility creation promoted the account to seller_ready',
  stateB?.onboarding_state === 'seller_ready', String(stateB?.onboarding_state));

if (facB) {
  const offerB = await offerAttempt(authB, facB.facilityId, 'b');
  step('B5 the brand-new user can then create an offer', offerB.ok, offerB.error);
}

// ── cleanup ─────────────────────────────────────────────────────────────────────────
for (const auth of [authA, authB]) {
  await sql`delete from v2_products where facility_id in (select id from v2_facilities where account_id in (select id from v2_accounts where auth_user_id = ${auth}))`;
  await sql`delete from v2_facility_slots where account_id in (select id from v2_accounts where auth_user_id = ${auth})`;
  await sql`delete from v2_facilities where account_id in (select id from v2_accounts where auth_user_id = ${auth})`;
  await sql`delete from v2_entities where account_id in (select id from v2_accounts where auth_user_id = ${auth})`;
  await sql`delete from v2_accounts where auth_user_id = ${auth}`;
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILED`);
