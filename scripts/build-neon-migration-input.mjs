import { readFileSync, writeFileSync } from 'node:fs';

const sql = readFileSync(new URL('../db/migrations/001_v2_roots.sql', import.meta.url), 'utf8');
const statements = sql
  .split(/;\s*(?:\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean)
  .map((statement) => `${statement};`);

writeFileSync('/tmp/omni-v2-roots-migration.json', JSON.stringify({
  projectId: 'wild-moon-30984513',
  branchId: 'br-dawn-hill-am5amy22',
  databaseName: 'neondb',
  sqlStatements: statements,
}, null, 2));
