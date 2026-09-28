// POP-1b world dry-run — exercises the DELIVERED classifier + pilot predicate on
// REAL canonical sample points, read on a DISPOSABLE branch (a byte-copy of the
// canonical). Strictly READ-ONLY: no insert, no update, no delete, on the branch
// or the canonical. "Zero canonical impact" is proved separately by comparing
// canonical counts before/after (captured with the DB tool).
//
// It imports the real modules (no re-implementation): a proof that the SHIPPED
// classifier — not a paraphrase of it — produces the tier distribution.
//
// Usage:
//   POP1B_DRYRUN_ALLOW=1 POP1B_DATABASE_URL=<disposable> npx tsx scripts/prove-pop1b-world-dryrun.mjs
import { admitIntakeBatch, parseIntakeScope, classifyIntakePoint } from '../src/domain/place-intake.ts';
import { isInsidePilotZone } from '../src/server/routing-adapter.ts';
import { neon } from '@neondatabase/serverless';

const url = process.env.POP1B_DATABASE_URL ?? '';
if (process.env.POP1B_DRYRUN_ALLOW !== '1' || !url.trim()) {
  console.error('REFUSED: set POP1B_DRYRUN_ALLOW=1 and POP1B_DATABASE_URL=<disposable branch url>.');
  process.exit(2);
}
if (url.includes('dawn-hill')) {
  console.error('REFUSED: the URL looks like the CANONICAL branch. Use a disposable branch.');
  process.exit(2);
}

const sql = neon(url);

const lomeRows = await sql`
  select name, latitude::float8 as lat, longitude::float8 as lng, address
  from v2_facilities
  where longitude between 1.0 and 2.45 and latitude between 5.85 and 6.5
  limit 5`;
const ghanaRows = await sql`
  select name, latitude::float8 as lat, longitude::float8 as lng, address
  from v2_facilities
  where longitude < 0
  limit 20`;

const toPoint = (r) => ({ latitude: r.lat, longitude: r.lng, name: r.name, address: r.address });

// Synthetic points to reach quarantine branches the real data may not cover.
const synthetic = [
  { latitude: 0, longitude: 0, name: 'Null Island', address: 'Nowhere' },
  { latitude: 999, longitude: 1.2, name: 'Insane', address: null },
  { latitude: 6.13, longitude: -0.55, name: '', address: 'Some Street, Accra' },
  { latitude: 6.13, longitude: -0.55, name: '', address: null },
];

const real = [...lomeRows.map(toPoint), ...ghanaRows.map(toPoint)];

const perPoint = real.map((p) => ({ name: p.name, lng: p.longitude, ...classifyIntakePoint(p, isInsidePilotZone) }));
const countsReal = {
  pilot: perPoint.filter((v) => v.tier === 'pilot').length,
  world: perPoint.filter((v) => v.tier === 'world').length,
  quarantine: perPoint.filter((v) => v.tier === 'quarantine').length,
};
const reasonHistogram = {};
for (const v of perPoint) for (const r of v.reasons) reasonHistogram[r] = (reasonHistogram[r] ?? 0) + 1;

const all = [...real, ...synthetic];
const pilotScope = admitIntakeBatch(all, parseIntakeScope(undefined), isInsidePilotZone);
const worldScope = admitIntakeBatch(all, parseIntakeScope('world'), isInsidePilotZone);

const branchFacilities = await sql`select count(*)::int as n from v2_facilities`;

const out = {
  sampleRealPoints: real.length,
  syntheticPoints: synthetic.length,
  countsReal,
  reasonHistogram,
  admittedTiersWorldScope: worldScope.admitted.reduce((a, x) => ((a[x.intakeTier] = (a[x.intakeTier] ?? 0) + 1), a), {}),
  pilotScope: { admitted: pilotScope.admitted.length, skippedOutOfZone: pilotScope.skippedOutOfZone, skippedQuarantine: pilotScope.skippedQuarantine },
  worldScope: { admitted: worldScope.admitted.length, skippedOutOfZone: worldScope.skippedOutOfZone, skippedQuarantine: worldScope.skippedQuarantine },
  branchFacilitiesReadOnly: branchFacilities[0].n,
  writesAttempted: 0,
  perPoint,
};
console.log(JSON.stringify(out, null, 2));
