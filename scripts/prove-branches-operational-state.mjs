// BRANCHES operational state — prove the seller Open/Closed toggle against a DISPOSABLE branch.
//
// The statement once carried a doubled comma (`updated.seller_id,,`) — Postgres rejects it with
// "syntax error at or near \",\"", so the seller could never open or close their facility. The
// stubbed unit tests never compile SQL, so the failure only appeared against a real database.
// `src/server/sql-separator-safety.test.ts` now guards the class; this script proves the fix.
//
// Run:  BD_PROOF_DATABASE_URL=<throwaway branch>  npx tsx scripts/prove-branches-operational-state.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.BD_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('missing BD_PROOF_DATABASE_URL'); process.exit(2); }
const sql = neon(dbUrl);
const repo = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);
const auth = `opstate-${tag}`;
await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${auth}, 'seller_ready')`;
const acc = (await sql`select id from v2_accounts where auth_user_id = ${auth}`)[0];
const entityId = (await sql`insert into v2_entities (account_id, kind, display_name, trust_state) values (${acc.id}::uuid, 'organisation', ${`Op ${tag}`}, 'unconfirmed') returning id`)[0].id;
const facilityId = (await sql`insert into v2_facilities (account_id, entity_id, source_kind, source_name, source_ref, name, facility_type, trust_state) values (${acc.id}::uuid, ${entityId}::uuid, 'created', 'seller', ${`op-${tag}`}, ${`Op ${tag}`}, 'fixe', 'unconfirmed') returning id`)[0].id;
await sql`insert into v2_facility_slots (account_id, facility_id, source, status) values (${acc.id}::uuid, ${facilityId}::uuid, 'free', 'assigned')`;
try {
  const r = await repo.setSellerFacilityOperationalState({ authUserId: auth, facilityId, state: 'ferme', correlationId: randomUUID() });
  console.log('OPSTATE OK', r);
} catch (e) { console.log('OPSTATE THREW:', e.name, '::', e.message); }
