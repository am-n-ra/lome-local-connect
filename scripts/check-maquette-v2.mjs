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

// --- 3bis. CSS integrity: no orphan declaration outside a rule block ---
// Real defect (2026-09-25): a stray declaration tail with no selector sat between
// `.navpill{…}` and `.navpill button{…}`. A CSS parser then consumes it as a
// (invalid) selector up to the next `{`, and the error-recovery rule DISCARDS the
// whole rule — so `.navpill button` lost its width/height/color and the dock icons
// rendered ink-on-black (invisible). Balance alone would not catch it: the stray
// line ended with `}`, keeping the count even.
const css = (html.match(/<style>([\s\S]*?)<\/style>/g) || [])
  .map((b) => b.replace(/<\/?style>/g, ''))
  .join('\n');
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
let depth = 0;
const strayLines = [];
cssNoComments.split('\n').forEach((ln, i) => {
  const before = depth;
  depth += (ln.match(/\{/g) || []).length;
  depth -= (ln.match(/\}/g) || []).length;
  // outside any block, a non-empty line that carries declarations but opens no block
  if (before <= 0 && /\S/.test(ln) && ln.includes(':') && !ln.includes('{')) {
    strayLines.push(i + 1);
  }
});
check(cssNoComments.split('{').length === cssNoComments.split('}').length,
  'CSS braces balanced');
check(strayLines.length === 0, 'no orphan CSS declaration outside a rule',
  `stray at line(s) ${strayLines.join(', ')}`);
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

// --- 5bis. S-32: integrity + reputation must be VISIBLE AT CHOICE TIME ---
// The gap was that a buyer only saw trust AFTER opening an offer. So the results
// cards must carry the mark, the offer sheet must READ it from the offer (not
// hardcode it), and every offer producer must carry both fields - the same parity
// rule that caught the SP-1 crash.
// scope to the RESULTS sheet and to <small> marks: the stepper uses a .trust class
// too, so a whole-file count both over-counted and let a card lose its mark.
const resultsBlock = (js.match(/SHEETS\.results = \(\) => `([\s\S]*?)`;/m) || [])[1] || '';
const trustMarks = (resultsBlock.match(/<small class="trust/g) || []).length;
check(trustMarks >= 3, 'results cards carry the trust mark (S-32)', `${trustMarks} marks`);
check(/S\.product\.integ/.test(js) && /S\.product\.rep/.test(js),
  'offer sheet reads integrity/reputation from the offer');
const integFields = (js.match(/\binteg:/g) || []).length;
const repFields = (js.match(/\brep:/g) || []).length;
check(integFields >= 3 && integFields === repFields,
  'every offer producer carries integrity and reputation',
  `${integFields} integ vs ${repFields} rep`);

// --- 5ter. S-10: the model is NOT limited to the physical ---
// Real estate had zero surface, and the geographic ORIGIN of an intangible offer was
// never shown. Both now live inside the SAME seven characteristics - origin is a
// POSITION, not a new field. Guard the claim: a place exists on the map for immo,
// origin is carried in position for the digital, and each offer producer has all 7.
check(/openOffer\('immo'\)/.test(js), 'real estate offer is reachable (S-10)');
// An intangible offer must not offer a route: "Itinéraire vers ce vendeur" on an
// online course is a lie the buyer would act on. Found by reading the rendered
// sheet, not the code - the hero emoji was also the shop's for both new shapes.
const offerSheet = (js.match(/SHEETS\.offer = \(\) => `[\s\S]*?`;/) || [])[0] || '';
check(/sans déplacement[\s\S]{0,200}Où ça se passe/.test(offerSheet),
  'intangible offer offers no route (S-10)');
// window from the producer function up to the next section: `\n}` stops inside the
// immo/digital branch, which would hide the later shapes from the count.
const caracBlock = js.slice(js.indexOf('function openOffer'), js.indexOf('/* ---------- SHEETS')) || '';
check(/origine\s*:/.test(caracBlock), 'intangible offer states its geographic origin (S-10)');
const shapes = (caracBlock.match(/\bcarac:\s*\{/g) || []).length;
check(shapes >= 4, 'immobilier and digital join the two physical shapes', `${shapes} shapes`);
for (const f of ['qte', 'depletion', 'unique', 'position', 'temporalite', 'remise', 'etat', 'prix']) {
  const n = (caracBlock.match(new RegExp(`\\b${f}\\s*:`, 'g')) || []).length;
  // PARITY, not a floor: a floor of 5 passed with 4 shapes and let one shape lose a
  // field. Every shape must carry every field - that is the model's whole claim.
  check(n === shapes, `every offer shape carries "${f}"`, `${n} for ${shapes} shapes`);
}

// --- 5quater. SP-6 complements (S-22 / S-25 / S-14 / economy) ---
// The registry declared four gaps. Measuring the FOND (not the literal strings the
// registry searched for) showed two were FALSE: "Partager (WhatsApp/SMS)" and
// "3 / 20 (gratuit)" already existed. That is the T-12 class of defect - a map that
// lags the territory. Guards below pin the two that were really missing, plus the
// two genuinely present, so the claim cannot drift either way.
check(/Partager \(WhatsApp\/SMS\)/.test(js), 'QR circulates off-Omni (WhatsApp/SMS) (S-22)');
check(/3 \/ 20 \(gratuit\)/.test(js), 'free offer ceiling is stated as 3 / 20 (economy)');
check(/Cette offre appartient \u00e0/.test(js) && /dit <i>o\u00f9<\/i>, jamais <i>\u00e0 qui<\/i>/.test(js),
  'owning ENTITY is explicit; place says where, never whose (S-25)');
check(/Bonus confiance<\/span><b>20 USD verrouill\u00e9 \u2192 3 ventes \u00e0 des acheteurs distincts/.test(js),
  'trust bonus is locked to 3 DISTINCT buyers (economy)');
check(/Preuves exig\u00e9es<\/span><b>1 vente \(particulier\) \u00b7 3 ventes \(commerce\)/.test(js),
  'verification threshold scales by volume (S-14)');

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
  const delivered = [['S-01', 'SP-1'], ['S-06', 'SP-2'], ['S-11', 'SP-3'], ['S-32', 'SP-4'], ['S-10', 'SP-5'], ['S-25', 'SP-6'], ['S-14', 'SP-6']];
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
