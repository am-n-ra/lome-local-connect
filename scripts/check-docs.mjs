#!/usr/bin/env node
/**
 * check:docs — no document may re-declare a stale pre-V2 master as the single source of truth.
 *
 * Why this exists (2026-09-25): `docs/README.md` declared
 * `OMNI_MASTER_PRODUCT_INTERFACE.md` — dated 2026-08-21, i.e. BEFORE the V2 Seed (2026-09-23) —
 * as "l'unique document normatif d'Omni". That master has zero knowledge of the entity model
 * (S-25): the offer belongs to the ENTITY, not the facility. A newcomer following the README
 * learned an abandoned model. This is the same defect class as the stale coherence register:
 * a document asserting an authority that no longer holds.
 *
 * The V2 authority is a CHAIN (Seed -> SDM -> Root contract -> maquette -> state/plan), not one
 * file. This guard enforces that:
 *   1. no live document claims a single/master normative source outside the V2 chain;
 *   2. the README still declares the chain;
 *   3. the masters are still marked historical.
 *
 * `--selftest` falsifies it: the guard must FAIL on the old README text and PASS on the new one.
 */
import { readFileSync, existsSync } from 'node:fs';

// Documents that constitute the V2 authority chain. A "master" claim pointing at anything else
// is a stale assertion.
const V2_CHAIN = [
  'omni-intent-brief-v2-2026-09-23.md',
  'omni-system-dependency-map-2026-09-23.md',
  'omni-root-v2-entity-layer-contract-2026-09-23.md',
  'omni-species-v2-interactive.html',
];

// A document "asserts a single master" when it uses one of these phrases about a NON-chain file.
const SINGLE_MASTER_PHRASES = [
  /unique\s+document\s+normatif/i,
  /unique\s+source\s+de\s+v[ée]rit[ée]\s+normative/i,
  /l'unique\s+master/i,
  /single\s+source\s+of\s+truth\s+for\s+the\s+whole/i,
];

// Live documents whose authority claims matter. Historical/archived docs may keep old wording.
const LIVE_DOCS = [
  'docs/README.md',
  'docs/decisions/omni-decision-log.md',
  'docs/founder-hq/current-state.md',
  'docs/founder-hq/founder-hq-board.md',
  'docs/founder-hq/founder-hq-master-plan.md',
];

// The pre-V2 masters. Naming them as normative is the defect.
const STALE_MASTERS = [
  'OMNI_MASTER_PRODUCT_INTERFACE.md',
  'OMNI_MASTER.md',
];

export function checkDocs({ read = (p) => readFileSync(p, 'utf8'), exists = existsSync } = {}) {
  const errors = [];

  // 1. The README must declare the V2 chain, not a single master.
  const readme = read('docs/README.md');
  for (const link of V2_CHAIN) {
    if (!readme.includes(link)) {
      errors.push(`docs/README.md: does not reference the V2 chain member "${link}" — the front door must name the authority chain`);
    }
  }

  // 2. No live document may pair a single-master phrase with a stale master name in the same
  //    sentence/line. Historical framing (struck-through, "historique") is allowed.
  for (const file of LIVE_DOCS) {
    if (!exists(file)) continue;
    const text = read(file);
    for (const line of text.split('\n')) {
      // Skip lines that explicitly mark the stale master as historical / superseded / corrected.
      if (/historique|superseded|remplac|corrig|~~|archive/i.test(line)) continue;
      for (const phrase of SINGLE_MASTER_PHRASES) {
        if (phrase.test(line) && STALE_MASTERS.some((m) => line.includes(m))) {
          errors.push(`${file}: re-asserts a pre-V2 master as the single source of truth: "${line.trim().slice(0, 110)}"`);
        }
      }
    }
  }

  // 3. The stale masters must be marked historical where they are described.
  const readmeMentionsHistorical = /historique/i.test(readme) && STALE_MASTERS.some((m) => readme.includes(m));
  if (!readmeMentionsHistorical) {
    errors.push('docs/README.md: the pre-V2 master is not marked historical — a reader cannot tell it is no longer normative');
  }

  return errors;
}

function selftest() {
  const readme = readFileSync('docs/README.md', 'utf8');
  const current = checkDocs();
  if (current.length) {
    console.error('SELFTEST FAIL: the current docs do not pass their own guard');
    for (const e of current) console.error(`  ${e}`);
    process.exit(1);
  }

  // Falsify: the OLD README text declared the master as the unique normative document.
  const old = readme.replace(
    /^# Documentation Omni/m,
    '# Documentation Omni\n\n[`OMNI_MASTER_PRODUCT_INTERFACE.md`](./OMNI_MASTER_PRODUCT_INTERFACE.md) est l\'unique document normatif d\'Omni.',
  );
  const oldErrors = checkDocs({
    read: (p) => (p === 'docs/README.md' ? old : readFileSync(p, 'utf8')),
    exists: existsSync,
  });
  if (!oldErrors.some((e) => /single source of truth|pre-V2 master/.test(e))) {
    console.error('SELFTEST FAIL: the guard did not catch the old README claiming a stale master');
    process.exit(1);
  }

  // Falsify: removing the chain reference must fail.
  const noChain = readme.replace(/omni-intent-brief-v2-2026-09-23\.md/g, 'SOMETHING_ELSE.md');
  const noChainErrors = checkDocs({
    read: (p) => (p === 'docs/README.md' ? noChain : readFileSync(p, 'utf8')),
    exists: existsSync,
  });
  if (!noChainErrors.some((e) => /V2 chain member/.test(e))) {
    console.error('SELFTEST FAIL: the guard did not catch a README missing the authority chain');
    process.exit(1);
  }

  console.log('DOCS SELFTEST OK: 2 falsifications caught, current docs pass');
}

if (process.argv.includes('--selftest')) selftest();
else {
  const errors = checkDocs();
  if (errors.length) {
    console.error(`DOCS: ${errors.length} authority defect(s)\n`);
    for (const e of errors) console.error(`  FAIL  ${e}`);
    console.error('\nThe V2 authority is a CHAIN, not one file. See docs/README.md.');
    process.exit(1);
  }
  console.log('DOCS OK: no stale master re-asserted; V2 authority chain declared');
}
