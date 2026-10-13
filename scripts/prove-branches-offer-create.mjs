// BRANCHES-OFFER-CREATE — prove the fix against a DISPOSABLE branch, using the shipped code.
//
// Reproduces the founder's exact defect: an account holding a facility + ASSIGNED slot but
// stuck at `buyer_ready` (created before `account_promoted` existed). Before the fix:
//   * getAccountContext reports sellerWorkspace=false → the seller UI never loads the catalogue;
//   * createSellerProductDraft refuses FORBIDDEN_OR_SLOT_REQUIRED with no visible cause.
// After the fix, the account self-heals on load and an offer can be created.
//
// Run on a throwaway branch:  BD_PROOF_ALLOW_DISPOSABLE_BRANCH=1 BD_PROOF_DATABASE_URL=<branch>
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository, SellerCataloguePolicyError } from '../src/server/trunk-repository.ts';

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

// Fixture: the DESYNCED state — account at buyer_ready, but a facility + assigned slot.
const auth = `desync-${tag}`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${auth}, 'buyer_ready')`;
const acc = (await sql`select id from v2_accounts where auth_user_id = ${auth}`)[0];
const entityId = (await sql`insert into v2_entities (account_id, kind, display_name, trust_state) values (${acc.id}::uuid, 'organisation', ${`Desync ${tag}`}, 'unconfirmed') returning id`)[0].id;
const facilityId = (await sql`insert into v2_facilities (account_id, entity_id, source_kind, source_name, source_ref, name, facility_type, trust_state) values (${acc.id}::uuid, ${entityId}::uuid, 'created', 'seller', ${`fac-${tag}`}, ${`Desync ${tag}`}, 'fixe', 'unconfirmed') returning id`)[0].id;
await sql`insert into v2_facility_slots (account_id, facility_id, source, status) values (${acc.id}::uuid, ${facilityId}::uuid, 'free', 'assigned')`;

const before = (await sql`select onboarding_state from v2_accounts where auth_user_id = ${auth}`)[0];
step('T0 fixture is desynced (buyer_ready WITH assigned slot)', before.onboarding_state === 'buyer_ready', before.onboarding_state);

// T1 — loading the account context reports the seller capability (it used to say false).
const ctx = await repo.getAccountContext({ authUserId: auth });
step('T1 context reports sellerWorkspace=true (healed)', ctx?.capabilities.sellerWorkspace === true, JSON.stringify(ctx?.capabilities));

// T2 — the DB row is actually repaired (not just the returned value).
const after = (await sql`select onboarding_state from v2_accounts where auth_user_id = ${auth}`)[0];
step('T2 onboarding_state persisted as seller_ready', after.onboarding_state === 'seller_ready', after.onboarding_state);

// T3 — the founder's failing action now succeeds.
let created = false; let thrown = '';
try {
  await repo.createSellerProductDraft({
    authUserId: auth, facilityId, name: `Desync Offer ${tag}`, description: null, unit: 'unit',
    prixOriginal: 1000, currency: 'XOF', pourcentageReduction: 10, stockLoueOmni: 3,
    idempotencyKey: `offer-${tag}-${randomUUID()}`,
    positionKind: 'fixe', uniquenessKind: 'renouvelable', handoverKind: 'retrait', priceKind: 'fixe', conditionKind: 'neuf',
  });
  created = true;
} catch (e) { thrown = `${e.name}:${e.message}`; }
step('T3 offer creation succeeds for the healed account', created, thrown);

// T4 — idempotent: a second context load is a no-op (row already seller_ready).
const before2 = (await sql`select updated_at from v2_accounts where auth_user_id = ${auth}`)[0].updated_at;
await repo.getAccountContext({ authUserId: auth });
const after2 = (await sql`select updated_at from v2_accounts where auth_user_id = ${auth}`)[0].updated_at;
step('T4 self-heal is a no-op once consistent', String(before2) === String(after2), `${before2} -> ${after2}`);

// T5 — a suspended account is NEVER promoted (guard rail preserved).
const sus = `desync-sus-${tag}`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state, suspended_at) values (${sus}, 'buyer_ready', now())`;
const susAcc = (await sql`select id from v2_accounts where auth_user_id = ${sus}`)[0];
await sql`insert into v2_facility_slots (account_id, source, status) values (${susAcc.id}::uuid, 'free', 'assigned')`;
await repo.getAccountContext({ authUserId: sus });
const susAfter = (await sql`select onboarding_state from v2_accounts where auth_user_id = ${sus}`)[0];
step('T5 suspended account is NOT promoted', susAfter.onboarding_state === 'buyer_ready', susAfter.onboarding_state);

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
