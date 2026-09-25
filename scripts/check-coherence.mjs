#!/usr/bin/env node
/**
 * check:coherence — the Seed<->code register must not contradict the migrations on disk.
 *
 * Built 2026-09-25 after the register claimed a root incoherence was open while
 * migration 058 had already closed it. The founder's "we keep turning in circles"
 * was, literally, sessions restarting from a stale map.
 *
 * Exit 0 = the register and the migrations agree (or nothing contradicts).
 * Exit 1 = they disagree; the message names the row and the contradiction.
 *
 * `--selftest` falsifies the guard: it must FAIL on the stale register and PASS on
 * the corrected one. A guard that cannot fail proves nothing.
 */
import { readFileSync } from 'node:fs';
import {
  checkCoherence, checkAgainstDatabase, loadMigrations, parseRows,
} from './lib/coherence-check.mjs';

const REGISTER = 'docs/nature-way/omni-seed-vs-code-coherence-register-2026-09-23.md';

async function run() {
  const registerText = readFileSync(REGISTER, 'utf8');
  const migrationSql = loadMigrations();
  const { errors, rows } = checkCoherence({ registerText, migrationSql });

  const dbErrors = await checkAgainstDatabase(rows, {
    connectionString: process.env.COHERENCE_DATABASE_URL,
  });

  const all = [...errors, ...dbErrors];
  const dbChecked = process.env.COHERENCE_DATABASE_URL ? 'live schema' : 'skipped (no COHERENCE_DATABASE_URL)';

  if (all.length) {
    console.error(`COHERENCE: ${all.length} contradiction(s) between the register and the code\n`);
    for (const e of all) console.error(`  FAIL  ${e}`);
    console.error(`\nA diagnostic document is not a proof — it goes stale the moment a commit lands.`);
    process.exit(1);
  }

  const open = rows.filter((r) => r.status.toUpperCase().includes('OUVERT')).length;
  console.log(`COHERENCE OK: ${rows.length} rows, ${open} open, 0 contradiction with db/migrations (live schema: ${dbChecked})`);
}

function selftest() {
  const migrationSql = loadMigrations();
  const current = readFileSync(REGISTER, 'utf8');

  // 1. The stale register must FAIL: it claimed the root open after 058 closed it.
  const stale = current.replace(
    /^\|\s*\*\*(C-1)\*\*.*$/m,
    '| **C-1** | **Modèle universel (S-01/S-02)** | tout est offre | `v2_products` **exige** `facility_id` | `001_v2_roots.sql:71` | **Racine** | **OUVERT** (vérifié `HEAD`) |',
  );
  const staleErrors = checkCoherence({ registerText: stale, migrationSql }).errors;
  if (!staleErrors.length) {
    console.error('SELFTEST FAIL: the guard did not catch a register claiming the root open after 058 closed it');
    process.exit(1);
  }

  // 2. A terminal row citing a migration that does not exist must FAIL.
  const missing = current.replace(
    /^\|\s*\*\*(C-2)\*\*.*$/m,
    '| **C-2** | Propriété | l\'offre appartient à l\'ENTITÉ | `entity_id` | `db/migrations/999_v2_nope.sql` · `v2_entities` | Racine | ✅ **CLOS** |',
  );
  const missingErrors = checkCoherence({ registerText: missing, migrationSql }).errors;
  if (!missingErrors.some((e) => /999/.test(e))) {
    console.error('SELFTEST FAIL: the guard did not catch a closure citing a non-existent migration');
    process.exit(1);
  }

  // 3. A terminal row whose claimed schema change is absent must FAIL. Here we
  //    remove the migration that performs the drop and keep the row closed.
  const withoutDrop = { ...migrationSql };
  withoutDrop['058'] = '-- migration stripped for the selftest\n';
  const noDropErrors = checkCoherence({ registerText: current, migrationSql: withoutDrop }).errors;
  if (!noDropErrors.some((e) => /drop not null/.test(e))) {
    console.error('SELFTEST FAIL: the guard did not catch a closed row with no migration performing the drop');
    process.exit(1);
  }

  // 4. The verdict must not contradict the rows.
  const lyingVerdict = current.replace(/\| Verdict \|[^\n]*\|/, '| Verdict | **7 incohérences mesurées** |');
  const verdictErrors = checkCoherence({ registerText: lyingVerdict, migrationSql }).errors;
  if (!verdictErrors.some((e) => /verdict claims/.test(e))) {
    console.error('SELFTEST FAIL: the guard did not catch a verdict contradicting its own table');
    process.exit(1);
  }

  // 5. The current register must PASS.
  const currentErrors = checkCoherence({ registerText: current, migrationSql }).errors;
  if (currentErrors.length) {
    console.error('SELFTEST FAIL: the current register does not pass its own guard');
    for (const e of currentErrors) console.error(`  ${e}`);
    process.exit(1);
  }

  console.log('COHERENCE SELFTEST OK: 4 falsifications caught, current register passes');
}

if (process.argv.includes('--selftest')) selftest();
else await run();
