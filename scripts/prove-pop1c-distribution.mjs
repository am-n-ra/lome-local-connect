// POP-1c-O O2 — zero-write classifier distribution for a matched point set.
// Reads the transform's `<country>.all.json` (ALL matched points, incl. nameless)
// and reports the pilot/world/quarantine split WITH reasons, the pre-filter count,
// the world-scope admission, and a per-country frontmatter. NO DB, NO network.
//
// Usage: npx tsx scripts/prove-pop1c-distribution.mjs <all.json> [label]
import { readFileSync } from 'node:fs';
import { admitIntakeBatch, classifyIntakePoint } from '../src/domain/place-intake.ts';
import { isInsidePilotZone } from '../src/server/routing-adapter.ts';

const path = process.argv[2];
const label = process.argv[3] ?? 'pop1c';
if (!path) {
  console.error('usage: npx tsx scripts/prove-pop1c-distribution.mjs <all.json> [label]');
  process.exit(2);
}
const points = JSON.parse(readFileSync(path, 'utf8'));

const tierCounts = { pilot: 0, world: 0, quarantine: 0 };
const reasonCounts = {};
for (const p of points) {
  const v = classifyIntakePoint(p, isInsidePilotZone);
  tierCounts[v.tier] += 1;
  const key = v.reasons.join('+') || '(clean-admit)';
  reasonCounts[key] = (reasonCounts[key] ?? 0) + 1;
}
const prefilteredEmptyName = points.filter((p) => !String(p.name ?? '').trim()).length;
const admissionWorld = admitIntakeBatch(points, 'world', isInsidePilotZone);
const admissionPilot = admitIntakeBatch(points, 'pilot', isInsidePilotZone);

console.log(JSON.stringify({
  label,
  matched: points.length,
  prefilteredEmptyName,
  tiers: tierCounts,
  reasons: reasonCounts,
  worldScope: { admitted: admissionWorld.admitted.length, skippedQuarantine: admissionWorld.skippedQuarantine, skippedOutOfZone: admissionWorld.skippedOutOfZone },
  pilotScope: { admitted: admissionPilot.admitted.length, skippedQuarantine: admissionPilot.skippedQuarantine, skippedOutOfZone: admissionPilot.skippedOutOfZone },
}, null, 2));
