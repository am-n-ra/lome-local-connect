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

console.log(`\nstate of record gate = ${gate}\n`);
for (const [f, n] of mustAgree) check(f, n, 'reopen marker');
for (const [f, n] of mustPointToV2) check(f, n, 'points to Intent Brief V2');
for (const [f, n, l] of forbidden) check(f, n, l);

if (failed > 0) {
  console.error(`\nSTATE DIVERGENCE: ${failed} problem(s). Reconcile before claiming a gate.\n`);
  process.exit(1);
}
console.log('\nSTATE CONSISTENT: all operational artifacts agree with the state of record.\n');
