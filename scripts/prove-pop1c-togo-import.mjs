// POP-1c C2/C3 — exercises the DELIVERED write path for the world backfill.
//
// It does NOT go through HTTP (no operator JWT is available in this environment,
// and a secret must never be pasted into the chat). Instead it calls the exact
// repository method the route calls — `createTrunkRepository().createPublicFacilityImport`
// — with the SAME composition as http.ts: admitIntakeBatch(scope='world') then one
// import per admitted point. The operator-role guard in the repository is exercised
// for real (a real operator account's auth_user_id is required).
//
// Safety: refuses to run UNLESS POP1C_ALLOW=1. Writes ONLY to the URL given. On the
// CANONICAL branch the URL contains 'dawn-hill', so a second explicit opt-in
// (POP1C_ALLOW_CANONICAL=1) is required — a dry-run must never touch canonical by slip.
//
// Usage dry-run : POP1C_ALLOW=1 POP1C_DATABASE_URL=<throwaway>
// Usage canonique: POP1C_ALLOW=1 POP1C_ALLOW_CANONICAL=1 POP1C_DATABASE_URL=<canonical>
//   POP1C_OPERATOR_AUTH_USER_ID=<uuid> POP1C_PAYLOADS=<country>.json [POP1C_LIMIT=100]
//   [POP1C_CONCURRENCY=12] [POP1C_LABEL=ghana]
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';
import { admitIntakeBatch } from '../src/domain/place-intake.ts';
import { isInsidePilotZone } from '../src/server/routing-adapter.ts';

const url = process.env.POP1C_DATABASE_URL ?? '';
const operator = process.env.POP1C_OPERATOR_AUTH_USER_ID ?? '';
const payloadsPath = process.env.POP1C_PAYLOADS ?? '';
const label = process.env.POP1C_LABEL ?? 'pop1c';
if (process.env.POP1C_ALLOW !== '1' || !url.trim() || !operator.trim() || !payloadsPath) {
  console.error('REFUSED: set POP1C_ALLOW=1, POP1C_DATABASE_URL, POP1C_OPERATOR_AUTH_USER_ID, POP1C_PAYLOADS.');
  process.exit(2);
}
if (url.includes('dawn-hill') && process.env.POP1C_ALLOW_CANONICAL !== '1') {
  console.error('REFUSED: the URL looks like the CANONICAL branch. Set POP1C_ALLOW_CANONICAL=1 to write canonically.');
  process.exit(2);
}
const limit = process.env.POP1C_LIMIT ? Number(process.env.POP1C_LIMIT) : Infinity;

const sql = neon(url);
const repository = createTrunkRepository(sql);

const all = JSON.parse(readFileSync(payloadsPath, 'utf8'));
const limited = Number.isFinite(limit) ? all.slice(0, limit) : all;

// Mirror http.ts normalization EXACTLY: the route throws ApiInputError (400, whole
// batch) when an item lacks a name, a bounded sourceRef or finite in-range coords.
// So nameless OSM nodes never reach the classifier through the route — they are
// rejected at normalization. We reproduce that filter and count it separately.
const normalized = [];
let rejectedByNormalization = 0;
for (const item of limited) {
  const sourceRef = typeof item.sourceRef === 'string' ? item.sourceRef.trim() : '';
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  const lat = Number(item.latitude);
  const lng = Number(item.longitude);
  const ok = sourceRef && name && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && sourceRef.length <= 180 && name.length <= 180;
  if (!ok) {
    rejectedByNormalization += 1;
    continue;
  }
  normalized.push({ ...item, sourceRef, name, latitude: lat, longitude: lng });
}

// Same admission as the route: scope=world, over the NORMALIZED items.
const admission = admitIntakeBatch(normalized, 'world', isInsidePilotZone);

const t0 = Date.now();
let created = 0;
let existing = 0;
const runIds = new Set();
const latencies = [];
const admitted = admission.admitted;
const concurrency = Math.max(1, Math.min(16, Number(process.env.POP1C_CONCURRENCY ?? 1)));
let cursor = 0;

async function importOne(item) {
  const result = await repository.createPublicFacilityImport({
    authUserId: operator,
    provider: 'openstreetmap',
    attribution: '© OpenStreetMap contributors (ODbL)',
    sourceRef: item.sourceRef,
    name: item.name,
    category: item.category,
    latitude: item.latitude,
    longitude: item.longitude,
    address: item.address,
    correlationId: `pop1c-${label}-${item.sourceRef.replace('/', '-')}`,
    intakeTier: item.intakeTier,
  });
  runIds.add(result.runId);
  if (result.created) created += 1;
  else existing += 1;
}

async function worker() {
  while (cursor < admitted.length) {
    const item = admitted[cursor];
    cursor += 1;
    const s = Date.now();
    await importOne(item);
    latencies.push(Date.now() - s);
  }
}
await Promise.all(Array.from({ length: concurrency }, () => worker()));
latencies.sort((a, b) => a - b);
const p95 = latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] : 0;

console.log(JSON.stringify({
  label,
  input: limited.length,
  rejectedByNormalization,
  admitted: admission.admitted.length,
  skippedOutOfZone: admission.skippedOutOfZone,
  skippedQuarantine: admission.skippedQuarantine,
  created,
  existing,
  distinctRunIds: runIds.size,
  distinctSourceRefs: new Set(admission.admitted.map((a) => a.sourceRef)).size,
  writeLatencyMs: { p50: latencies[Math.floor(latencies.length * 0.5)] ?? 0, p95, max: latencies[latencies.length - 1] ?? 0 },
  wallClockMs: Date.now() - t0,
}, null, 2));
