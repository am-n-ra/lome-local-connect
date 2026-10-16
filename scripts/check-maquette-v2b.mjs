#!/usr/bin/env node
// Structural non-regression check for docs/maquette/omni-species-v2b-entry-guide.html.
// Zero dependencies. It guards the three real defects found while writing the extension:
//   - a container rendered OUTSIDE the sheet (missing `.sheet` class) → the grid swallows taps;
//   - an `<svg>` with only a viewBox (no intrinsic size) → 300x150 (recurring class);
//   - the existence scale (S-06) shown as a bar but the five WORDS never taught.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, '..', 'docs/maquette/omni-species-v2b-entry-guide.html');
const html = readFileSync(file, 'utf8');

const failures = [];
const check = (ok, label, detail = '') => {
  if (ok) console.log(`  ok   ${label}`);
  else failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
};

// --- 1. JS syntax: the single <script> block must parse ---
const script = html.match(/<script>([\s\S]*)<\/script>/);
check(!!script, 'script block present');
const js = script ? script[1] : '';
try {
  new Function(js.replace(/document|window/g, 'globalThis'));
  check(true, 'JS parses');
} catch (e) {
  check(false, 'JS parses', String(e.message).slice(0, 120));
}

// --- 2. Inventory: the three entry screens exist, nothing else added silently ---
const sheets = [...js.matchAll(/SHEETS(?:\.([A-Za-z0-9_-]+)|\[['"]([A-Za-z0-9_-]+)['"]\])\s*=\s*\(\)/g)]
  .map((m) => m[1] || m[2]);
const unique = new Set(sheets);
check(sheets.length === unique.size, 'no duplicate screen', `${sheets.length} defs, ${unique.size} unique`);
for (const s of ['welcome', 'how-it-works', 'spotlight']) check(unique.has(s), `screen "${s}" exists`);

// --- 3. The container must carry `.sheet` (else it renders under `.grid`) ---
check(/<div id="sheet" class="sheet">/.test(html), 'render container carries class="sheet"');

// --- 4. Every svg declares width AND height (no 300x150 fallback) ---
const svgs = html.match(/<svg[^>]*>/g) || [];
const unsized = svgs.filter((s) => !/width=/.test(s) || !/height=/.test(s));
check(unsized.length === 0, 'every svg is sized', `${unsized.length} unsized of ${svgs.length}`);

// --- 5. S-06: the five locked words are TAUGHT, not just drawn ---
for (const w of ['Présente', 'Revendiquée', 'Offre publiée', 'Disponibilité vivante', 'Transactable']) {
  check(js.includes(w), `scale word taught · ${w}`);
}

// --- 6. NR-11: the automation explains its ABSTENTION (the part the plan omitted) ---
check(/négoci/i.test(html), 'abstention on negotiation is stated');
check(/4 heures|4 h/i.test(html), 'freshness window is stated');
check(/se tait|s’abstient|abstention/i.test(html), 'the silence is named, not implied');

// --- 7. Copy rule: no em dash in visible text (COPY-PASS) ---
const visible = html.replace(/<!--[\s\S]*?-->/g, '');
check(!/—/.test(visible), 'no em dash in visible copy');

// --- 8. Accent stays reserved: no block background uses --accent ---
const accentBg = (html.match(/background:\s*var\(--accent\)/g) || []).length;
check(accentBg === 0, 'accent never used as a block background', `${accentBg} occurrences`);

// --- 9. Tokens inherited from Species V2, never re-invented ---
for (const t of ['--ink:#0f0f0f', '--accent:#2e8b6f', '--panel:#f7f7f7', '--line:#e6e6e6']) {
  check(html.includes(t), `token inherited · ${t}`);
}

if (failures.length) {
  console.log(`\ncheck:maquette-v2b FAILED (${failures.length})`);
  for (const f of failures) console.log(`  FAIL ${f}`);
  process.exit(1);
}
console.log('\ncheck:maquette-v2b OK');
