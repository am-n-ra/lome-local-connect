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

if (failures.length) {
  console.error(`\nMAQUETTE V2 CHECK FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  FAIL ${f}`);
  process.exit(1);
}
console.log(`\nMAQUETTE V2 OK: ${unique.size} screens, ${levelCount} levels, no duplicates.`);
