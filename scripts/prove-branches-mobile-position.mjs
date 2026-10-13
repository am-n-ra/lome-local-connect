// BRANCHES-MOBILE-POSITION — prove the shipped code against a DISPOSABLE branch.
//
// A mobile seller (ambulant) says "je suis ici": the point moves and is timestamped as
// DECLARED, never as verified (S-31). A fixed place corrects its point. A digital origin has
// no place to move and is refused. Out-of-zone coordinates are refused.
//
// Run:  BD_PROOF_DATABASE_URL=<throwaway branch>  npx tsx scripts/prove-branches-mobile-position.mjs
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

async function fixture(type) {
  const auth = `pos-${type}-${tag}`;
  await sql`insert into v2_accounts (auth_user_id, onboarding_state) values (${auth}, 'seller_ready')`;
  const acc = (await sql`select id from v2_accounts where auth_user_id = ${auth}`)[0];
  const entityId = (await sql`insert into v2_entities (account_id, kind, display_name, trust_state) values (${acc.id}::uuid, 'organisation', ${`Pos ${type} ${tag}`}, 'unconfirmed') returning id`)[0].id;
  const facilityId = (await sql`insert into v2_facilities (account_id, entity_id, source_kind, source_name, source_ref, name, facility_type, rayon_km, latitude, longitude, trust_state) values (${acc.id}::uuid, ${entityId}::uuid, 'created', 'seller', ${`pos-${type}-${tag}`}, ${`Pos ${type} ${tag}`}, ${type}, ${type === 'mobile' ? 5 : null}, 6.13, 1.22, 'unconfirmed') returning id`)[0].id;
  await sql`insert into v2_facility_slots (account_id, facility_id, source, status) values (${acc.id}::uuid, ${facilityId}::uuid, 'free', 'assigned')`;
  return { auth, facilityId };
}

// T1 — a mobile (ambulant) moves: the point changes and is timestamped as DECLARED.
const mobile = await fixture('mobile');
const moved = await repo.declareSellerFacilityPosition({ authUserId: mobile.auth, facilityId: mobile.facilityId, latitude: 6.1720, longitude: 1.2400 });
step('T1 mobile position moves', Math.abs(moved.latitude - 6.1720) < 1e-6 && Math.abs(moved.longitude - 1.2400) < 1e-6, JSON.stringify({ lat: moved.latitude, lng: moved.longitude }));

const row1 = (await sql`select latitude, longitude, position_declared_at, position_verified_at from v2_facilities where id = ${mobile.facilityId}::uuid`)[0];
step('T2 latitude/longitude persisted', Math.abs(Number(row1.latitude) - 6.1720) < 1e-6, String(row1.latitude));
step('T3 declaration timestamped (declared_at set)', row1.position_declared_at !== null, String(row1.position_declared_at));
step('T4 declared ≠ verified: verified_at stays NULL (S-31)', row1.position_verified_at === null, String(row1.position_verified_at));

// T5 — a fixed place corrects its point with the same gesture.
const fixed = await fixture('fixe');
const corrected = await repo.declareSellerFacilityPosition({ authUserId: fixed.auth, facilityId: fixed.facilityId, latitude: 6.1400, longitude: 1.2100 });
step('T5 fixed place corrects its point', Math.abs(corrected.latitude - 6.1400) < 1e-6, JSON.stringify({ lat: corrected.latitude }));

// T6 — a digital origin has no place to move: refused.
const digital = await fixture('digital');
let digitalRefused = false; let digitalMsg = '';
try { await repo.declareSellerFacilityPosition({ authUserId: digital.auth, facilityId: digital.facilityId, latitude: 6.14, longitude: 1.21 }); }
catch (e) { digitalRefused = e instanceof SellerCataloguePolicyError; digitalMsg = `${e.name}:${e.message}`; }
step('T6 digital origin refused', digitalRefused, digitalMsg);

// T7 — out-of-zone coordinates refused (same perimeter as routing/import).
let zoneRefused = false; let zoneMsg = '';
try { await repo.declareSellerFacilityPosition({ authUserId: mobile.auth, facilityId: mobile.facilityId, latitude: -1.0, longitude: -1.0 }); }
catch (e) { zoneRefused = e instanceof SellerCataloguePolicyError && e.message === 'OUT_OF_ZONE'; zoneMsg = `${e.name}:${e.message}`; }
step('T7 out-of-zone refused', zoneRefused, zoneMsg);

// T8 — a non-owner cannot move someone else's place.
let ownerRefused = false; let ownerMsg = '';
try { await repo.declareSellerFacilityPosition({ authUserId: fixed.auth, facilityId: mobile.facilityId, latitude: 6.15, longitude: 1.23 }); }
catch (e) { ownerRefused = e instanceof SellerCataloguePolicyError; ownerMsg = `${e.name}:${e.message}`; }
step('T8 non-owner refused', ownerRefused, ownerMsg);

// T9 — the seller catalogue exposes positionDeclaredAt (the UI reads it).
const cat = await repo.listSellerCatalogue({ authUserId: mobile.auth });
const fac = cat.facilities.find((f) => f.id === mobile.facilityId);
step('T9 catalogue exposes positionDeclaredAt', Boolean(fac?.positionDeclaredAt), String(fac?.positionDeclaredAt));

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
