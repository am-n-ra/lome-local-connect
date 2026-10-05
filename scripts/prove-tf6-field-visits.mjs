// TF-6 M2 — round-trip proof of the DELIVERED field-visit code (createTrunkRepository)
// against a throwaway branch. Never run against canonical: writes visits + reports.
//
//   TF6_PROOF_DATABASE_URL=postgresql://... npx tsx scripts/prove-tf6-field-visits.mjs
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository, FieldPilotPolicyError } from '../src/server/trunk-repository.ts';

const dbUrl = process.env.TF6_PROOF_DATABASE_URL;
if (!dbUrl) { console.error('tf6-proof: missing TF6_PROOF_DATABASE_URL'); process.exit(2); }

const sql = neon(dbUrl);
const repo = createTrunkRepository(sql);

const ADMIN = '6dfee45e-a86a-4e57-b2fd-ae203aa5e309';     // admin + reviewer
const OPERATOR = 'a82873a0-f925-4d9e-8032-5a0dcfbfeee3';  // operator
const BUYER = 'e20b882d-37e3-4db1-9581-6314a6f416ff';     // no roles

let failures = 0;
function step(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) { failures += 1; process.exitCode = 1; }
}
async function rejects(label, fn, expectMsg) {
  try { await fn(); step(label, false, 'no rejection'); }
  catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    step(label, !expectMsg || m.includes(expectMsg), m.slice(0, 90));
  }
}

// A real published facility as the visited subject.
const fac = await sql`select id, name from v2_facilities where account_id is not null limit 1`;
const subjectId = String(fac[0].id);
console.log(`tf6-proof subject facility=${subjectId} (${fac[0].name})`);

// --- M1: the DB CHECKs reject bad values (direct SQL, no repo) ---------------
await rejects('check subject bogus rejected',
  () => sql`insert into v2_field_visits (subject_type, subject_id) values ('bogus', ${subjectId}::uuid)`,
  'v2_field_visits_subject_check');
await rejects('check state bogus rejected',
  () => sql`insert into v2_field_visits (subject_type, subject_id, state) values ('claim', ${subjectId}::uuid, 'bogus')`,
  'v2_field_visits_state_check');

// --- round-trip: create → claim → report → re-create allowed ---------------
const visit = await repo.createFieldVisit({ authUserId: ADMIN, subjectType: 'claim', subjectId, zone: 'Zone A', correlationId: 'tf6-proof-1' });
step('createFieldVisit', visit.state === 'a_visiter' && visit.zone === 'Zone A', `id=${visit.id} state=${visit.state}`);

await rejects('2nd active visit on same subject refused',
  () => repo.createFieldVisit({ authUserId: ADMIN, subjectType: 'claim', subjectId, correlationId: 'tf6-proof-2' }));

await rejects('buyer without role cannot claim',
  () => repo.claimVisit({ authUserId: BUYER, visitId: visit.id, correlationId: 'tf6-proof-3' }),
  'cannot be taken');

const claimed = await repo.claimVisit({ authUserId: OPERATOR, visitId: visit.id, correlationId: 'tf6-proof-4' });
step('claimVisit (operator)', claimed.state === 'en_cours' && claimed.alreadyMine === false, `state=${claimed.state}`);
const re = await repo.claimVisit({ authUserId: OPERATOR, visitId: visit.id, correlationId: 'tf6-proof-5' });
step('re-claim by same operator is an honest no-op', re.alreadyMine === true, `alreadyMine=${re.alreadyMine}`);

const photo = `visits/${visit.id}/photo/constat.jpg`;
await rejects('report without position rejected',
  () => repo.submitVisitReport({ authUserId: OPERATOR, visitId: visit.id, lieuOk: true, activite: 'ok', contactOk: true, photoRefs: [photo], latitude: NaN, longitude: 1.2, correlationId: 'tf6-proof-6' }),
  'POSITION_REQUIRED');
await rejects('report with a photo not bound to the visit rejected',
  () => repo.submitVisitReport({ authUserId: OPERATOR, visitId: visit.id, lieuOk: true, activite: 'ok', contactOk: true, photoRefs: ['visits/other/photo/x.jpg'], latitude: 6.13, longitude: 1.22, correlationId: 'tf6-proof-7' }),
  'PHOTO_NOT_BOUND');

const reported = await repo.submitVisitReport({ authUserId: OPERATOR, visitId: visit.id, lieuOk: true, activite: 'Commerce ouvert, stock visible', contactOk: true, photoRefs: [photo], latitude: 6.1319, longitude: 1.2254, correlationId: 'tf6-proof-8' });
step('submitVisitReport (transmitted)', reported.state === 'transmis', `state=${reported.state}`);

const again = await repo.createFieldVisit({ authUserId: ADMIN, subjectType: 'claim', subjectId, zone: 'Zone A', correlationId: 'tf6-proof-9' });
step('same subject re-accepted after transmis', again.id !== visit.id && again.state === 'a_visiter', `newId=${again.id}`);

// --- M1: report CHECKs (direct SQL) ---------------------------------------
await rejects('activite empty rejected',
  () => sql`insert into v2_visit_reports (visit_id, lieu_ok, activite, contact_ok) values (${again.id}::uuid, true, '   ', true)`,
  'v2_visit_reports_activite_check');
await rejects('reserve 501 chars rejected',
  () => sql`insert into v2_visit_reports (visit_id, lieu_ok, activite, contact_ok, reserve) values (${again.id}::uuid, true, 'ok', true, ${'x'.repeat(501)})`,
  'v2_visit_reports_reserve_check');

// --- queue read (authorized operator) -------------------------------------
const queue = await repo.listVisitQueue({ authUserId: OPERATOR });
step('listVisitQueue authorized + lists the new dossier', queue.authorized === true && queue.visits.some((v) => v.id === again.id), `visits=${queue.visits.length}`);

// --- cleanup (throwaway branch, but leave it empty) -----------------------
await sql`delete from v2_visit_reports where visit_id in (${visit.id}::uuid, ${again.id}::uuid)`;
await sql`delete from v2_field_visits where id in (${visit.id}::uuid, ${again.id}::uuid)`;
await sql`delete from v2_audit_events where correlation_id like 'tf6-proof-%'`;
const leftover = await sql`select (select count(*) from v2_field_visits) as visits, (select count(*) from v2_visit_reports) as reports`;
console.log(`residue: visits=${leftover[0].visits} reports=${leftover[0].reports}`);
console.log(`tf6-proof RESULT: ${failures === 0 ? 'PASS' : `FAIL (${failures})`}`);
