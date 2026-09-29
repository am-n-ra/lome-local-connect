// Guards the bug class that reached production on 2026-09-29 (R-I handover).
//
// `transitionSellerProduct` added a `publication_block` branch reading
// `(select position_kind from owned)` but never added `p.position_kind` to the `owned`
// CTE select list. Postgres rejects the ENTIRE statement at parse time — `column
// "position_kind" does not exist` — so EVERY `transitionSellerProduct` call failed:
// no seller could publish or archive an offer. Found by `scripts/prove-root-read-paths.mjs`
// against real SQL; invisible to the stubbed suite (no SQL is ever compiled).
//
// The rule, precisely:
//   For every `with <name> as (select ... )` CTE and every scalar-subquery reference
//   `(select <col> from <name>)`, `<col>` must be an output column of that CTE.
//   Output columns are the top-level select-list items: `p.col` contributes `col`,
//   `... as alias` contributes `alias`, a bare `col` contributes `col`.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SOURCE = readFileSync(new URL('./trunk-repository.ts', import.meta.url), 'utf8');

// Extract sql`...` bodies. `${ ... }` interpolations are skipped as opaque regions,
// because they contain nested sql`` templates that would otherwise truncate the scan.
function extractQueries(text: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('sql`', i);
    if (open === -1) break;
    let j = open + 4;
    let buffer = '';
    while (j < text.length) {
      const ch = text[j];
      if (ch === '\\') { buffer += text[j + 1] ?? ''; j += 2; continue; }
      if (ch === '`') { j += 1; break; }
      if (ch === '$' && text[j + 1] === '{') {
        let depth = 1;
        j += 2;
        while (j < text.length && depth > 0) {
          if (text[j] === '{') depth += 1;
          else if (text[j] === '}') depth -= 1;
          else if (text[j] === '`') {
            j += 1;
            while (j < text.length && text[j] !== '`') { if (text[j] === '\\') j += 1; j += 1; }
          }
          j += 1;
        }
        buffer += ' _V_ ';
        continue;
      }
      buffer += ch;
      j += 1;
    }
    out.push(buffer);
    i = j;
  }
  return out;
}

// The balanced parenthesised body that starts at `open` (which points at the `(`).
function balancedBody(sql: string, open: number): string {
  let depth = 0;
  let j = open;
  while (j < sql.length) {
    if (sql[j] === '(') depth += 1;
    else if (sql[j] === ')') { depth -= 1; if (depth === 0) return sql.slice(open + 1, j); }
    j += 1;
  }
  return sql.slice(open + 1);
}

// Output column names of a CTE select list (the text between `select` and the top-level `from`).
function outputColumns(body: string): Set<string> {
  const columns = new Set<string>();
  const trimmed = body.trimStart();
  const selectMatch = /^select\b/i.exec(trimmed);
  if (!selectMatch) return columns;
  let depth = 0;
  let end = trimmed.length;
  for (let i = selectMatch[0].length; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (depth === 0 && /\bfrom\b/i.test(trimmed.slice(i, i + 4)) && !/[\w]/.test(trimmed[i - 1] ?? '')) { end = i; break; }
  }
  const list = trimmed.slice(selectMatch[0].length, end);
  // Split the top-level comma list.
  const items: string[] = [];
  depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i += 1) {
    const ch = list[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ',' && depth === 0) { items.push(list.slice(start, i)); start = i + 1; }
  }
  items.push(list.slice(start));
  for (const raw of items) {
    const item = raw.trim();
    if (!item) continue;
    const alias = /\bas\s+([a-z_][a-z0-9_]*)\s*$/i.exec(item);
    if (alias) { columns.add(alias[1].toLowerCase()); continue; }
    const qualified = /\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\s*$/i.exec(item);
    if (qualified) { columns.add(qualified[2].toLowerCase()); continue; }
    const bare = /^([a-z_][a-z0-9_]*)$/i.exec(item);
    if (bare) columns.add(bare[1].toLowerCase());
  }
  return columns;
}

describe('repository SQL: CTE column completeness', () => {
  const queries = extractQueries(SOURCE);

  it('finds CTE definitions and references', () => {
    let ctes = 0;
    let refs = 0;
    for (const q of queries) {
      for (const m of q.matchAll(/\b([a-z_][a-z0-9_]*)\s+as\s*\(/gi)) {
        const body = balancedBody(q, m.index + m[0].length - 1).trimStart();
        if (/^select\b/i.test(body) || /^with\b/i.test(body)) ctes += 1;
      }
      refs += [...q.matchAll(/\(\s*select\s+[a-z_][a-z0-9_]*\s+from\s+[a-z_][a-z0-9_]*\s*\)/gi)].length;
    }
    expect(ctes).toBeGreaterThan(5);
    expect(refs).toBeGreaterThan(5);
  });

  it('every (select col from cte) references a column the CTE outputs', () => {
    const violations: string[] = [];

    for (const query of queries) {
      const cteColumns = new Map<string, Set<string>>();
      for (const m of query.matchAll(/\b([a-z_][a-z0-9_]*)\s+as\s*\(/gi)) {
        const open = m.index + m[0].length - 1;
        const body = balancedBody(query, open).trimStart();
        if (!/^select\b/i.test(body) && !/^with\b/i.test(body)) continue;
        cteColumns.set(m[1].toLowerCase(), outputColumns(body));
      }
      if (cteColumns.size === 0) continue;

      for (const m of query.matchAll(/\(\s*select\s+([a-z_][a-z0-9_]*)\s+from\s+([a-z_][a-z0-9_]*)\s*\)/gi)) {
        const column = m[1].toLowerCase();
        const cte = m[2].toLowerCase();
        const columns = cteColumns.get(cte);
        if (!columns) continue; // not a CTE (a real table or an outer alias)
        if (!columns.has(column)) {
          violations.push(`"(select ${column} from ${cte})" reads a column the "${cte}" CTE does not output`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
