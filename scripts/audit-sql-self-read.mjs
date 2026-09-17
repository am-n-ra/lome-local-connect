// Heuristic audit: flag SQL statements that INSERT into a table and also READ
// it (from/join) elsewhere in the same statement. In a data-modifying CTE the
// inserted rows are not visible to a re-scan in the same statement (Postgres
// snapshot semantics), so such a read is a latent bug unless it is guarded by
// an ON CONFLICT DO NOTHING/DEDUP or the read is only for a static lookup.
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/server/trunk-repository.ts', import.meta.url), 'utf8');
const stmts = [...src.matchAll(/sql`([\s\S]*?)`\)/g)].map((m) => m[1]);

let flagged = 0;
stmts.forEach((s, i) => {
  const inserted = new Set([...s.matchAll(/insert\s+into\s+([a-z0-9_]+)/gi)].map((m) => m[1].toLowerCase()));
  if (!inserted.size) return;
  for (const t of inserted) {
    const reads = [...s.matchAll(new RegExp(`(from|join)\\s+${t}\\b`, 'gi'))].length;
    if (reads > 0) {
      const at = src.indexOf(s);
      const line = src.slice(0, at).split('\n').length;
      console.log(`FLAG stmt#${i} (~line ${line}): insert into ${t} AND read ${t} ${reads}x`);
      flagged += 1;
    }
  }
});
console.log(`scanned ${stmts.length} statements, ${flagged} flagged`);
