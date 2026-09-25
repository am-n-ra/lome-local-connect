/**
 * Coherence guard — the register of Seed<->code incoherences must not contradict
 * the migrations that are actually on disk.
 *
 * Why this exists (2026-09-25): the register claimed for two days that the root
 * incoherence C-1/C-2 was OPEN ("v2_products.facility_id not null contradicts S-25")
 * while migration 058 - titled "decision fondateur D-C1" - had already run
 * `alter table v2_products alter column facility_id drop not null`. The board even
 * carried both truths at once: its header said "le socle ne suit pas" and its body
 * documented R-1..R-4b EXECUTED. Every session restarted from a stale map, re-diagnosed,
 * re-measured a subset, shipped a slice - which is exactly what the founder experienced
 * as "turning in circles".
 *
 * A diagnostic document is not a proof: it goes stale the moment a commit lands. This
 * guard makes that staleness fail loudly instead of silently steering the next session.
 *
 * It checks two independent things:
 *   1. INTERNAL  - the register's own verdict must agree with its own row statuses.
 *   2. EXTERNAL  - a row that claims a closure via migrations must cite migrations that
 *                  exist AND that actually contain the claimed schema change.
 *
 * Optional (env COHERENCE_DATABASE_URL): verify the claim against the live schema.
 * The DB half is skipped, not failed, when no connection is configured.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// A row status is terminal when it declares the incoherence resolved.
const TERMINAL = ['CLOS', 'CORRIG', 'FERME', 'FERMEE'];
// A row status is open when it declares the incoherence still standing.
const OPEN = ['OUVERT', 'PARTIEL'];

const MIGRATION_RE = /db\/migrations\/(\d{3})_[a-z0-9_]+\.sql/g;

/** Parse the markdown table rows `| **C-1** | ... | <status> |`. */
export function parseRows(registerText) {
  const rows = [];
  for (const line of registerText.split('\n')) {
    const m = /^\|\s*\*\*(C-\d+)\*\*\s*\|/.exec(line);
    if (!m) continue;
    const cells = line.split('|').map((c) => c.trim());
    rows.push({ id: m[1], status: cells[cells.length - 2] || '', raw: line });
  }
  return rows;
}

export function classify(status) {
  const up = status.toUpperCase();
  if (TERMINAL.some((t) => up.includes(t))) return 'terminal';
  if (OPEN.some((t) => up.includes(t))) return 'open';
  return 'unknown';
}

/**
 * @param {{ registerText: string, migrationSql: Record<string,string> }} input
 * @returns {{ errors: string[], rows: object[] }}
 */
export function checkCoherence({ registerText, migrationSql }) {
  const errors = [];
  const rows = parseRows(registerText);

  if (rows.length === 0) {
    errors.push('register: no C-row found — the measured table disappeared');
    return { errors, rows };
  }

  for (const row of rows) {
    const kind = classify(row.status);
    if (kind === 'unknown') {
      errors.push(`${row.id}: status "${row.status.slice(0, 60)}" is neither terminal (${TERMINAL.join('/')}) nor open (${OPEN.join('/')}) — an unclassified row is how a closed defect keeps being reported as open`);
      continue;
    }
    if (kind !== 'terminal') continue;

    // A terminal row that cites migrations must cite real ones, and the cited set must
    // actually carry the schema change the row claims.
    const cited = [...row.raw.matchAll(MIGRATION_RE)].map((m) => m[1]);
    const byNumber = cited.length
      ? cited
      : [...row.raw.matchAll(/\b(058|059|060|061)\b/g)].map((m) => m[1]);
    if (byNumber.length === 0) continue;

    for (const n of new Set(byNumber)) {
      const sql = migrationSql[n];
      if (!sql) {
        errors.push(`${row.id}: cites migration ${n}, which does not exist in db/migrations — a closure resting on a missing migration is not a closure`);
      }
    }

    // The specific claim this guard was built for: a row that closes the "offer belongs
    // to the facility" root must be backed by `drop not null` on v2_products.facility_id.
    if (/facility_id/.test(row.raw) && /\b(058|059|060|061)\b/.test(row.raw)) {
      const dropsNotNull = Object.values(migrationSql).some((sql) =>
        /alter table v2_products[\s\S]{0,120}drop not null/i.test(sql));
      if (!dropsNotNull) {
        errors.push(`${row.id}: claims the offer no longer requires a facility, but no migration runs "alter table v2_products ... drop not null"`);
      }
    }

    // A row that closes the entity-ownership root must be backed by the table existing.
    if (/v2_entities/.test(row.raw)) {
      const createsEntities = Object.values(migrationSql).some((sql) =>
        /create table if not exists v2_entities/i.test(sql));
      if (!createsEntities) {
        errors.push(`${row.id}: cites v2_entities, but no migration creates that table`);
      }
    }
  }

  // INTERNAL: the verdict must not contradict the rows it summarises.
  const verdict = /\| Verdict \|([^\n]*)\|/.exec(registerText)?.[1] || '';
  const openCount = rows.filter((r) => classify(r.status) === 'open').length;
  const claimed = /(\d+)\s*incohérence/i.exec(verdict)?.[1];
  if (claimed !== undefined && Number(claimed) !== openCount) {
    errors.push(`verdict claims ${claimed} open incoherence(s) but the table marks ${openCount} row(s) open — the summary and the detail disagree, which is the defect this guard exists for`);
  }

  return { errors, rows };
}

/** Load every migration on disk, keyed by its 3-digit number. */
export function loadMigrations(dir = 'db/migrations') {
  const out = {};
  for (const name of readdirSync(resolve(dir))) {
    const m = /^(\d{3})_.*\.sql$/.exec(name);
    if (m) out[m[1]] = readFileSync(resolve(dir, name), 'utf8');
  }
  return out;
}

/** Optional live verification. Returns [] when no connection is configured. */
export async function checkAgainstDatabase(rows, { connectionString, query }) {
  if (!connectionString) return [];
  const errors = [];
  const q = query || (async (sql) => {
    const { Client } = await import('pg');
    const client = new Client({ connectionString });
    await client.connect();
    try { return (await client.query(sql)).rows; } finally { await client.end(); }
  });

  const schema = (await q(`
    select
      (select count(*) from information_schema.tables where table_name = 'v2_entities') as entities,
      (select is_nullable from information_schema.columns
        where table_name = 'v2_products' and column_name = 'facility_id') as facility_nullable,
      (select count(*) from information_schema.columns
        where table_name = 'v2_products' and column_name = 'entity_id') as entity_col
  `))[0];

  for (const row of rows) {
    if (classify(row.status) !== 'terminal') continue;
    if (/facility_id/.test(row.raw) && schema.facility_nullable !== 'YES') {
      errors.push(`${row.id}: row is closed but the live schema still has v2_products.facility_id NOT NULL`);
    }
    if (/v2_entities/.test(row.raw) && Number(schema.entities) === 0) {
      errors.push(`${row.id}: row is closed but v2_entities does not exist in the live schema`);
    }
    if (/entity_id/.test(row.raw) && Number(schema.entity_col) === 0) {
      errors.push(`${row.id}: row is closed but v2_products.entity_id does not exist in the live schema`);
    }
  }
  return errors;
}
