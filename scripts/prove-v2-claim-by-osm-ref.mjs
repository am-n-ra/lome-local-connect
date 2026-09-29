// DEC-V2-30 (doctrine lazy) — end-to-end proof against a DISPOSABLE database branch.
//
// Proves the path that had NO code route before this tranche: a claim on a place known ONLY
// from the map tiles (no facility row) resolves-or-materialises the row AND creates the draft
// in one guarded statement — the claim is the moment of materialisation.
//
// Why a disposable branch: it writes and deletes rows. Never point it at the canonical
// branch. Create a throwaway branch from the canonical one, run, then delete it.
//
//   CLAIM_PROOF_ALLOW_DISPOSABLE_BRANCH=1 CLAIM_PROOF_DATABASE_URL=<branch> \
//     npx tsx scripts/prove-v2-claim-by-osm-ref.mjs
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.CLAIM_PROOF_DATABASE_URL;
if (process.env.CLAIM_PROOF_ALLOW_DISPOSABLE_BRANCH !== '1') {
  console.error('claim-proof: set CLAIM_PROOF_ALLOW_DISPOSABLE_BRANCH=1 (this writes and deletes rows)');
  process.exit(2);
}
if (!dbUrl) { console.error('claim-proof: missing CLAIM_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repository = createTrunkRepository(sql);
const tag = randomUUID().slice(0, 8);

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}

console.log(`claim-proof tag=${tag}`);

const claimantA = `claim-a-${tag}`;
const claimantB = `claim-b-${tag}`;
const facilityIds = [];
const accountIds = [];

// The disposable branch is a copy of the canonical one: pick reference ids that provably do
// not collide with any row already present, otherwise T1 would resolve instead of materialise.
let osmBase = 9000001 + (parseInt(tag.slice(0, 4), 16) % 899999);
for (let attempt = 0; attempt < 5; attempt += 1) {
  const probe = await sql`select 1 from v2_facility_source_refs where source_ref in (${`node/${osmBase}`}, ${`way/${osmBase + 1}`}, ${`relation/${osmBase + 2}`}) limit 1`;
  if (probe.length === 0) break;
  osmBase += 1000000;
}

const tileFacts = {
  authUserId: claimantA,
  osmType: 'node',
  osmId: osmBase,
  name: `Pharmacie Preuve ${tag}`,
  category: 'pharmacy',
  address: 'Boulevard de la Paix',
  latitude: 6.1372,
  longitude: 1.2224,
  intakeTier: 'pilot',
};

try {
  // ---- T1: a claim on an unseen OSM reference materialises the facility AND drafts the claim.
  const first = await repository.createClaimDraftFromOsmRef(tileFacts);
  facilityIds.push(first.facilityId);
  step('T1 unseen reference returns created=true materialized=true',
    first.created === true && first.materialized === true && first.state === 'draft' && first.version === 1,
    `created=${first.created} materialized=${first.materialized} state=${first.state}`);
  const materialised = (await sql`
    select f.source_kind, f.source_name, f.source_ref, f.name, f.trust_state, f.account_id,
           (select count(*)::int from v2_facility_source_refs r where r.facility_id = f.id) as ref_count,
           (select raw_metadata from v2_facility_source_refs r where r.facility_id = f.id limit 1) as raw_metadata
    from v2_facilities f where f.id = ${first.facilityId}::uuid`)[0];
  step('T1 facility row is a public import with one source reference',
    materialised?.source_kind === 'public_import' && materialised?.source_name === 'openstreetmap'
    && materialised?.source_ref === `node/${tileFacts.osmId}` && Number(materialised?.ref_count) === 1
    && materialised?.trust_state === 'verification_draft' && materialised?.account_id === null,
    `kind=${materialised?.source_kind} ref=${materialised?.source_ref} refs=${materialised?.ref_count} trust=${materialised?.trust_state}`);
  step('T1 reference metadata names the tile origin and carries no OSM call',
    materialised?.raw_metadata?.provider === 'openstreetmap'
    && materialised?.raw_metadata?.origin === 'claim-on-sight'
    && materialised?.raw_metadata?.intake_tier === 'pilot',
    `metadata=${JSON.stringify(materialised?.raw_metadata)}`);

  // ---- T2: replaying the same reference by the same claimant replays the draft, nothing new.
  const replay = await repository.createClaimDraftFromOsmRef(tileFacts);
  step('T2 replay returns the same draft with created=false materialized=false',
    replay.requestId === first.requestId && replay.created === false && replay.materialized === false,
    `same=${replay.requestId === first.requestId} created=${replay.created} materialized=${replay.materialized}`);
  const draftCount = (await sql`
    select count(*)::int as n from v2_verification_requests where facility_id = ${first.facilityId}::uuid`)[0]?.n;
  step('T2 no duplicate draft row was written', Number(draftCount) === 1, `drafts=${draftCount}`);

  // ---- T3: a second claimant on the same place is refused, not double-drafted.
  let secondError = null;
  try {
    await repository.createClaimDraftFromOsmRef({ ...tileFacts, authUserId: claimantB });
  } catch (error) { secondError = error; }
  step('T3 second claimant is refused', secondError !== null, `error=${secondError ? String(secondError.message).slice(0, 80) : 'NONE'}`);
  const draftCountAfter = (await sql`
    select count(*)::int as n from v2_verification_requests where facility_id = ${first.facilityId}::uuid`)[0]?.n;
  step('T3 refusal wrote no second draft', Number(draftCountAfter) === 1, `drafts=${draftCountAfter}`);

  // ---- T4: a claim on an already-imported facility resolves it without materialising.
  const importedId = (await sql`
    insert into v2_facilities (account_id, source_kind, source_name, source_ref, name, category, latitude, longitude, address, trust_state)
    values (null, 'public_import', 'openstreetmap', ${`way/${tileFacts.osmId + 1}`}, ${`Atelier Preuve ${tag}`}, 'workshop', 6.14, 1.23, null, 'unclaimed')
    returning id`)[0].id;
  facilityIds.push(importedId);
  const sourceId = (await sql`select id from v2_public_sources where provider = 'openstreetmap' limit 1`)[0]?.id;
  await sql`insert into v2_facility_source_refs (facility_id, source_id, source_ref, raw_metadata)
    values (${importedId}::uuid, ${sourceId}::uuid, ${`way/${tileFacts.osmId + 1}`}, '{}'::jsonb)`;
  const onImported = await repository.createClaimDraftFromOsmRef({
    authUserId: claimantB, osmType: 'way', osmId: tileFacts.osmId + 1,
    name: `Atelier Preuve ${tag}`, category: 'workshop', address: null,
    latitude: 6.14, longitude: 1.23, intakeTier: 'pilot',
  });
  step('T4 imported facility resolves without materialising',
    onImported.facilityId === importedId && onImported.created === true && onImported.materialized === false,
    `resolved=${onImported.facilityId === importedId} created=${onImported.created} materialized=${onImported.materialized}`);

  // ---- T5: a claim on an already-claimed (owned) facility is refused.
  const ownedId = (await sql`
    insert into v2_facilities (account_id, source_kind, source_name, source_ref, name, category, latitude, longitude, address, trust_state)
    values (null, 'public_import', 'openstreetmap', ${`relation/${tileFacts.osmId + 2}`}, ${`Marche Preuve ${tag}`}, 'market', 6.15, 1.24, null, 'unclaimed')
    returning id`)[0].id;
  facilityIds.push(ownedId);
  const ownerId = (await sql`insert into v2_accounts (auth_user_id) values (${`claim-owner-${tag}`}) returning id`)[0].id;
  accountIds.push(ownerId);
  await sql`update v2_facilities set account_id = ${ownerId}::uuid where id = ${ownedId}::uuid`;
  let ownedError = null;
  try {
    await repository.createClaimDraftFromOsmRef({
      authUserId: claimantB, osmType: 'relation', osmId: tileFacts.osmId + 2,
      name: `Marche Preuve ${tag}`, category: 'market', address: null,
      latitude: 6.15, longitude: 1.24, intakeTier: 'pilot',
    });
  } catch (error) { ownedError = error; }
  step('T5 owned facility is refused', ownedError !== null, `error=${ownedError ? String(ownedError.message).slice(0, 80) : 'NONE'}`);

  // ---- T6: invalid tile facts are rejected before any SQL runs.
  let invalidError = null;
  try {
    await repository.createClaimDraftFromOsmRef({ ...tileFacts, osmType: 'planet' });
  } catch (error) { invalidError = error; }
  step('T6 invalid reference type is rejected', invalidError !== null);
} catch (error) {
  console.error('claim-proof: UNEXPECTED', String(error?.stack ?? error));
  failures += 1;
  process.exitCode = 1;
} finally {
  for (const id of facilityIds) {
    try { await sql`delete from v2_verification_requests where facility_id = ${id}::uuid`; } catch { /* best-effort */ }
    try { await sql`delete from v2_facility_source_refs where facility_id = ${id}::uuid`; } catch { /* best-effort */ }
    try { await sql`delete from v2_facilities where id = ${id}::uuid`; } catch { /* best-effort */ }
  }
  const createdAccounts = await sql`select id from v2_accounts where auth_user_id in (${claimantA}, ${claimantB}, ${`claim-owner-${tag}`})`;
  for (const row of createdAccounts) {
    try { await sql`delete from v2_accounts where id = ${row.id}::uuid`; } catch { /* best-effort */ }
  }
  for (const id of accountIds) {
    try { await sql`delete from v2_accounts where id = ${id}::uuid`; } catch { /* best-effort */ }
  }
  console.log('claim-proof: cleanup attempted (the branch is disposable — delete it)');
}

console.log(failures === 0 ? 'claim-proof: ALL PASS' : `claim-proof: ${failures} FAILURE(S)`);
