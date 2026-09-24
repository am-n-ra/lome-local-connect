#!/usr/bin/env node
// Structural non-regression check for docs/maquette/omni-species-v2-interactive.html.
// Runs with zero dependencies (no node_modules, no network). It guards the two
// real defects found while delivering the Species V2 slices:
//   - the screen inventory must not silently lose or duplicate a SHEET;
//   - a numeric field consumed as a NUMBER must not be read with a 1-based table
//     look-up (the level label off-by-one that shipped twice).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, '..', 'docs/maquette/omni-species-v2-interactive.html');
const html = readFileSync(file, 'utf8');

const failures = [];
const check = (ok, label, detail = '') => {
  if (ok) console.log(`  ok   ${label}`);
  else failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
};

// --- 1. JS syntax: extract the single <script> block and parse it ---
const script = html.match(/<script>([\s\S]*)<\/script>/);
check(!!script, 'script block present');
const js = script ? script[1] : '';

// --- 2. SHEETS inventory: definitions unique, count stable ---
const defs = [...js.matchAll(/SHEETS(?:\.([A-Za-z0-9_-]+)|\[['"]([A-Za-z0-9_-]+)['"]\])\s*=\s*\(\)/g)]
  .map((m) => m[1] || m[2]);
const unique = new Set(defs);
check(defs.length === unique.size, 'no duplicate SHEET definition',
  `${defs.length} defs, ${unique.size} unique`);
check(unique.size >= 73, 'screen inventory not reduced', `${unique.size} screens`);
check(unique.has('entity-empty'), 'entity-level empty state exists');
check(unique.has('offer'), 'offer sheet exists');

// --- 3. Existence scale 0->4: index a NUMBER, never a 1-based look-up ---
check(/const LEVELS = \[/.test(js), 'LEVELS table declared');
check(/LEVELS\[lv\]/.test(js), 'level label read with LEVELS[lv] (0-based)');
check(!/LEVELS\[lv\s*-\s*1\]/.test(js), 'no 1-based LEVELS[lv - 1] look-up');
const labels = ['Presente', 'Revendiquee', 'Offre publiee', 'Disponibilite vivante', 'Transactable'];
const levelBlock = js.match(/const LEVELS = \[([\s\S]*?)\];/);
const levelCount = levelBlock ? (levelBlock[1].match(/\n\s*\[/g) || []).length : 0;
check(levelCount === 5, 'existence scale has exactly 5 levels (0..4)', `found ${levelCount}`);

// --- 4. Both search levels wired to a real outcome ---
check(/searchLevel/.test(js), 'search level state exists');
check(/function doSearchEntity/.test(js), 'entity search handler exists');
check(/function setSearchLevel/.test(js), 'level switch handler exists');

// --- 5. Shared-object field parity: every product producer carries carac + level ---
const producers = [...js.matchAll(/carac:\s*\{/g)].length;
const levels = [...js.matchAll(/level:\s*\d+/g)].length;
check(producers === levels, 'every offer producer carries both carac and level',
  `${producers} carac vs ${levels} level`);
check(producers >= 3, 'all three offer producers covered', `${producers} producers`);

// --- 6. Registry truth: the Species registry must state the REAL screen count ---
// T-12 found the registry claiming "72 écrans" while the maquette had 73, and a
// row still asserting the level scale was absent after it shipped. The registry
// is the map the founder reads; a map that lags the territory is a false witness.
const registryPath = resolve(here, '..', 'docs/nature-way/omni-species-v2-decision-registry-2026-09-23.md');
let registry = '';
try {
  registry = readFileSync(registryPath, 'utf8');
} catch {
  // absent registry is a hard failure: the map is part of the deliverable.
}
check(!!registry, 'species registry present');
if (registry) {
  // target the HEADER line specifically: historical sections legitimately quote
  // the count that was true when they were written (72 before SP-3 added a screen).
  const headerLine = registry.split('\n').find((l) => /Maquette\s*:/.test(l)) || '';
  const claimed = Number((headerLine.match(/\((\d+)\s+écrans\)/) || [])[1]);
  check(claimed === unique.size, 'registry header screen count equals the maquette',
    `registry header says ${claimed}, maquette has ${unique.size}`);
  // a delivered decision must not still be described as missing
  const delivered = [['S-01', 'SP-1'], ['S-06', 'SP-2'], ['S-11', 'SP-3']];
  for (const [id, slice] of delivered) {
    const row = registry.split('\n').find((l) => l.includes(`**${id}**`));
    if (row) check(/OK/.test(row), `registry row ${id} marked OK after ${slice}`,
      `row still reads: ${row.slice(0, 70)}…`);
  }
  // scope to the S-06 ROW: the section that documents T-12 legitimately quotes the
  // stale wording, so a whole-file phrase match would fail on our own history.
  const s06Row = registry.split('\n').find((l) => l.includes('**S-06**')) || '';
  check(!/aucune surface ne montre le NIVEAU/.test(s06Row),
    'registry S-06 row no longer claims the level scale is absent');
}

if (failures.length) {
  console.error(`\nMAQUETTE V2 CHECK FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  FAIL ${f}`);
  process.exit(1);
}
console.log(`\nMAQUETTE V2 OK: ${unique.size} screens, ${levelCount} levels, registry truthful, no duplicates.`);
