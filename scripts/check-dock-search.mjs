#!/usr/bin/env node
/**
 * DS-3 guard — falsifiable checks over the source for the dock/search slice.
 *
 * Each rule reads a real source file and asserts a property that a regression
 * could break. `--selftest` mutates each target in memory and confirms the rule
 * FIRES — a guard that cannot fail proves nothing (repo rule).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const APP = 'src/trunk/TrunkAppV13.tsx';
const SORT = 'src/trunk/results-sort.ts';

// [id, description, (sources) => boolean]
const RULES = [
  ['search-01-sortbar', 'results render the 4 sort chips from RESULTS_SORTS', (s) =>
    /RESULTS_SORTS\.map\(/.test(s[APP]) && /className=\{`sortchip/.test(s[APP])],
  ['search-01-ordered', 'the map/rail use orderedResults, not raw results', (s) =>
    /visibleFacilities = useMemo\(\(\) => filterFacilities\(orderedResults/.test(s[APP]) && /orderedResults\.map\(/.test(s[APP])],
  ['search-01-price', 'result cards show the entry price with the offer currency', (s) =>
    /facility\.minPriceMinor/.test(s[APP]) && /currencyFor\(facility\.priceCurrency\)/.test(s[APP])],
  ['search-01-near-honest', 'Plus proche never invents a distance without a position', (s) =>
    /if \(key === 'near'\) \{\s*if \(!userPosition\) return \[\.\.\.results\]/.test(s[SORT])],
  ['dock-02-operator', 'the operator gets its own terrain dock (Tournée)', (s) =>
    /if \(isOperator\) return \[/.test(s[APP]) && /label: 'Tournée'/.test(s[APP])],
  ['menu-01-seller', 'the seller menu offers Demandes entrantes -> seller-reply', (s) =>
    /className="menuitem"[^\n]*setSheet\('seller-reply'\)[^\n]*Demandes entrantes/.test(s[APP])],
  ['menu-03-header', 'the menu header is "Menu · <Rôle>" + "Tout Omni, depuis ici"', (s) =>
    /className="eyebrow">Menu · \{/.test(s[APP]) && /Tout Omni, depuis ici/.test(s[APP])],
  ['opt-02-kicker', 'constraint families + scopes use the .eyebrow kicker (not .label)', (s) =>
    /<div className="eyebrow">\{group\.label\}<\/div>/.test(s[APP]) &&
    /<div className="eyebrow">Portée de recherche<\/div>/.test(s[APP]) &&
    !/constraint-zone[\s\S]{0,4000}?className="label"/.test(s[APP].slice(s[APP].indexOf('constraint-zone')))],
];

function run(sources) {
  const failures = [];
  for (const [id, desc, fn] of RULES) {
    let ok = false;
    try { ok = fn(sources); } catch { ok = false; }
    if (!ok) failures.push(`${id} — ${desc}`);
  }
  return failures;
}

const sources = { [APP]: read(APP), [SORT]: read(SORT) };

if (process.argv.includes('--selftest')) {
  // Each mutation should make at least its rule fire.
  const mutations = [
    [APP, 'RESULTS_SORTS.map(', 'RESULTS_SORTS.filter('],
    [APP, 'filterFacilities(orderedResults', 'filterFacilities(facilities'],
    [APP, 'currencyFor(facility.priceCurrency)', 'currencyFor(undefined)'],
    [SORT, "if (key === 'near') {\n    if (!userPosition) return [...results];", "if (key === 'near') {\n    // mutated"],
    [APP, 'if (isOperator) return [', 'if (false) return ['],
    [APP, 'Demandes entrantes', 'Demandes recues'],
    [APP, 'Tout Omni, depuis ici', 'Tout Omni'],
    [APP, '<div className="eyebrow">{group.label}</div>', '<div className="label">{group.label}</div>'],
  ];
  let fired = 0;
  for (const [file, from, to] of mutations) {
    const mutated = { ...sources, [file]: sources[file].replace(from, to) };
    const failures = run(mutated);
    if (failures.length > 0) { fired += 1; console.log(`falsified: ${failures[0]}`); }
    else console.log(`NOT FALSIFIED for mutation in ${file}: ${from}`);
  }
  console.log(fired === mutations.length ? `\nSELFTEST: PASS (${fired}/${mutations.length} rules fired)` : `\nSELFTEST: FAIL (${fired}/${mutations.length})`);
  process.exit(fired === mutations.length ? 0 : 1);
}

const failures = run(sources);
if (failures.length === 0) {
  console.log(`DOCK-SEARCH GUARD: PASS (${RULES.length} rules)`);
  process.exit(0);
}
console.error('DOCK-SEARCH GUARD: FAIL');
for (const f of failures) console.error('  - ' + f);
process.exit(1);
