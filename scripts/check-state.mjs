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
if (gate !== 'SPECIES_CLOSED_ROOT_OPEN') {
  console.error(`FAIL  ${SOR}: unexpected gate "${gate}"`);
  process.exit(1);
}

// The marker every operational artifact must carry now that the founder closed Species
// (2026-09-25) and Root is the current gate. The previous marker proved the REOPEN; this
// one proves the CLOSURE. A stale reopen marker after validation would re-assert an open
// gate — the exact drift this script exists to catch.
const MARKER = 'Species V2 CLOSE';

const mustAgree = [
  ['docs/founder-hq/founder-hq-board.md', MARKER],
  ['docs/founder-hq/founder-hq-master-plan.md', MARKER],
  ['AGENTS.md', MARKER],
];

const mustPointToV2 = [
  ['docs/founder-hq/founder-hq-board.md', 'omni-intent-brief-v2-2026-09-23.md'],
  ['docs/founder-hq/founder-hq-master-plan.md', 'omni-intent-brief-v2-2026-09-23.md'],
  ['AGENTS.md', 'omni-intent-brief-v2-2026-09-23.md'],
];

// The 2026-09-23 incident guard INVERTED on 2026-09-25: SP-VALIDATION was pending then,
// the founder has now validated SP-1..SP-10 explicitly, so a document still calling that
// validation PENDING is stale. What must survive is the *record* that validation was
// required and given — and the audit trail that made it defensible.
const incident = [
  ['docs/founder-hq/current-state.md', 'SP-1…SP-10', 'the validated scope must stay named'],
  ['docs/founder-hq/current-state.md', 'CLOSE `founder-confirmed` 2026-09-25', 'the founder closure must be recorded'],
  ['docs/founder-hq/founder-hq-board.md', 'T-12` **refait et clos**', 'the T-12 redo must stay recorded'],
  ['docs/founder-hq/founder-hq-board.md', 'DÉCISION BLOQUANTE — cohérence Seed ↔ socle', 'the Seed/socle coherence decision must stay visible'],
  ['docs/founder-hq/current-state.md', 'T-14', 'the coherence diagnostic must stay recorded'],
  ['docs/nature-way/omni-seed-vs-code-coherence-register-2026-09-23.md', 'v2_products.facility_id', 'the measured root cause must stay cited'],
  ['docs/nature-way/omni-species-v2-conformance-audit-T12-2026-09-23.md', '16/16 conforme', 'the rendered conformance audit must stay'],
  ['docs/nature-way/omni-root-gate-v2-assessment-2026-09-23.md', 'PRÉMATURÉ', 'the Root audit must stay parked'],
];

// INVERTED 2026-09-25: while the gate was open, claiming Species closed was the mistake.
// The founder has now validated, so claiming it closed is REQUIRED. What stays forbidden
// is the stale reopen marker and the stale "socle ne suit pas" verdict — a document that
// still asserts an open gate after validation.
const forbiddenClaims = [
  ['docs/founder-hq/current-state.md', '`SEED_CLOSED_SPECIES_REOPENED`', 'must not re-assert the closed reopen gate'],
  ['docs/founder-hq/founder-hq-board.md', 'le socle ne suit pas.', 'must not assert the stale "le socle ne suit pas" verdict as current'],
  ['docs/founder-hq/founder-hq-board.md', 'Species RÉOUVERTE — `SP-VALIDATION` toujours ouverte', 'must not still call SP-VALIDATION pending after the founder validated'],
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
