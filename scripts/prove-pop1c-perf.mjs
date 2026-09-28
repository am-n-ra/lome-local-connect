// POP-1c — measures p95 of the real listPublicFacilities query.
// Usage: POP1C_PERF_ALLOW=1 POP1C_DATABASE_URL=<branch> [POP1C_PERF_N=20] npx tsx scripts/prove-pop1c-perf.mjs
import { neon } from '@neondatabase/serverless';
import { createTrunkRepository } from '../src/server/trunk-repository.ts';

const url = process.env.POP1C_DATABASE_URL ?? '';
if (process.env.POP1C_PERF_ALLOW !== '1' || !url.trim()) {
  console.error('REFUSED: set POP1C_PERF_ALLOW=1 and POP1C_DATABASE_URL.');
  process.exit(2);
}
const n = Number(process.env.POP1C_PERF_N ?? 20); // sequential samples
const sql = neon(url);
const repository = createTrunkRepository(sql);

// Lomé pilot-window bounds (west, south, east, north) + a wide world bounds.
const bounds = [1.0, 5.85, 2.45, 6.5];
const wide = [-180, -90, 180, 90];
const samples = [];
const wideSamples = [];
for (let i = 0; i < n; i += 1) {
  const t = Date.now();
  const rows = await repository.listPublicFacilities(bounds);
  samples.push({ ms: Date.now() - t, rows: rows.length });
}
const w = await repository.listPublicFacilities(wide);
const count = await sql`select count(*)::int as c from v2_facilities`;
const pct = (arr, p) => arr.length ? arr.slice().sort((a, b) => a - b)[Math.min(arr.length - 1, Math.floor(arr.length * p))] : 0;
console.log(JSON.stringify({
  facilities: count[0].c,
  lomeBounds: { p50: pct(samples.map((s) => s.ms), 0.5), p95: pct(samples.map((s) => s.ms), 0.95), max: Math.max(...samples.map((s) => s.ms)), rowsLast: samples[samples.length - 1].rows },
  worldBoundsRows: w.length,
  samples: samples.map((s) => s.ms),
}, null, 2));
