#!/usr/bin/env node
/**
 * Anti-divergence guard — verifies every operational artifact agrees with the
 * single source of truth: docs/founder-hq/current-state.md.
 *
 * Why this exists: on 2026-09-23 the gate was asserted from memory twice and was
 * wrong twice (assistant said "Seed/Species closed", then "we are at Root").
 * The board and AGENTS.md had drifted to the 2026-09-17 V1 state. This script
 * fails loudly on that kind of divergence.
 *
 * Usage: node scripts/check-state.mjs
 */
import { readFileSync } from 'node:fs';

const SOR = 'docs/founder-hq/current-state.md';
const sor = readFileSync(SOR, 'utf8');

const gate = /^\| \*\*Gate\*\* \| `([A-Z_]+)`/m.exec(sor)?.[1];
if (!gate) {
  console.error(`FAIL  ${SOR}: could not read the Gate value`);
  process.exit(1);
}
if (gate !== 'SEED_CLOSED_SPECIES_REOPENED') {
  console.error(`FAIL  ${SOR}: unexpected gate "${gate}"`);
  process.exit(1);
}

// The marker every operational artifact must carry while this gate is open.
const MARKER = 'RÉOUVERTE 2026-09-23';

const mustAgree = [
  ['docs/founder-hq/founder-hq-board.md', MARKER],
  ['docs/founder-hq/founder-hq-master-plan.md', MARKER],
  ['AGENTS.md', MARKER],
  ['docs/nature-way/intra-skill-plan-NW-PROD-OMNI-SEED2-01.md', 'Correction d\'état 2026-09-23'],
];

const mustPointToV2 = [
  ['docs/founder-hq/founder-hq-board.md', 'omni-intent-brief-v2-2026-09-23.md'],
  ['docs/founder-hq/founder-hq-master-plan.md', 'omni-intent-brief-v2-2026-09-23.md'],
  ['AGENTS.md', 'omni-intent-brief-v2-2026-09-23.md'],
];

// 2026-09-23 incident: Species was declared closed right after SP-1..SP-6 shipped, and a
// downstream Root gate was opened "to prepare", while the plan said deliverables are
// BLOCKED ON FOUNDER VALIDATION and the board said one gate at a time. Shipping is not
// acceptance. These guards make both mistakes fail loudly.
const incident = [
  ['docs/founder-hq/current-state.md', 'SP-VALIDATION', 'SP validation defect must stay open'],
  ['docs/founder-hq/founder-hq-board.md', 'SP-VALIDATION', 'board must point at the pending validation'],
  ['docs/founder-hq/founder-hq-board.md', 'T-12` **refait et clos**', 'the T-12 redo must stay recorded'],
  ['docs/founder-hq/founder-hq-board.md', 'DÉCISION BLOQUANTE — cohérence Seed ↔ socle', 'the Seed/socle coherence decision must stay visible'],
  ['docs/founder-hq/current-state.md', 'T-14', 'the coherence diagnostic must stay recorded'],
  ['docs/nature-way/omni-seed-vs-code-coherence-register-2026-09-23.md', 'v2_products.facility_id', 'the measured root cause must stay cited'],
  ['docs/nature-way/omni-species-v2-conformance-audit-T12-2026-09-23.md', '16/16 conforme', 'the rendered conformance audit must stay'],
  ['docs/nature-way/omni-root-gate-v2-assessment-2026-09-23.md', 'PRÉMATURÉ', 'the Root audit must stay parked'],
];

// A deliverable that is merely shipped is never a closed gate.
const forbiddenClaims = [
  ['AGENTS.md', 'Species V2 close', 'must not claim Species is closed'],
  ['docs/founder-hq/founder-hq-board.md', 'Species V2 — close', 'must not claim Species is closed'],
];

const forbidden = [
  // The stale claim that must never reappear as a CURRENT state.
  ['docs/founder-hq/founder-hq-board.md', 'Gates 1-6 `closed`', 'must be marked SUPERSEDED, not asserted'],
];

let failed = 0;
const check = (file, needle, label) => {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    console.error(`FAIL  ${file}: missing`);
    failed++;
    return;
  }
  if (!text.includes(needle)) {
    console.error(`FAIL  ${file}: missing ${label} ("${needle}")`);
    failed++;
  } else {
    console.log(`ok    ${file}: ${label}`);
  }
};

const forbid = (file, needle, label) => {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    console.error(`FAIL  ${file}: missing`);
    failed++;
    return;
  }
  if (text.includes(needle)) {
    console.error(`FAIL  ${file}: ${label} ("${needle}")`);
    failed++;
  } else {
    console.log(`ok    ${file}: ${label}`);
  }
};

console.log(`\nstate of record gate = ${gate}\n`);
for (const [f, n] of mustAgree) check(f, n, 'reopen marker');
for (const [f, n] of mustPointToV2) check(f, n, 'points to Intent Brief V2');
for (const [f, n, l] of forbidden) check(f, n, l);
for (const [f, n, l] of incident) check(f, n, l);
for (const [f, n, l] of forbiddenClaims) forbid(f, n, l);

if (failed > 0) {
  console.error(`\nSTATE DIVERGENCE: ${failed} problem(s). Reconcile before claiming a gate.\n`);
  process.exit(1);
}
console.log('\nSTATE CONSISTENT: all operational artifacts agree with the state of record.\n');
