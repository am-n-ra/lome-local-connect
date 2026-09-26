// Guards the bug class that reached production on 2026-09-26 (RB-PROD-3).
//
// `listPublicFacilities` selected `e.commercial_plan` while grouping by
// `f.id, e.trust_state`. Postgres rejects that outright — "column e.commercial_plan
// must appear in the GROUP BY clause or be used in an aggregate function" — so the
// buyer map answered HTTP 500 in production.
//
// The repository unit tests use a stubbed `sql`, so a statement Postgres cannot even
// compile passes every one of them. `scripts/prove-root-read-paths.mjs` is the real
// oracle (it needs a database); this check needs none, so it fails in CI.
//
// The rule, precisely:
//   In a query with a GROUP BY, every column reference in the SELECT list must be
//   covered by the GROUP BY. A column is covered when either
//     - its exact `alias.column` appears in the GROUP BY, or
//     - the GROUP BY contains that alias's PRIMARY KEY (`alias.id`), which makes every
//       other column of that relation functionally dependent and therefore legal.
//   Grouping by `e.trust_state` does NOT cover `e.commercial_plan` — that is the bug.
//   Column references inside an aggregate call, or inside a subquery, are exempt.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SOURCE = readFileSync(new URL('./trunk-repository.ts', import.meta.url), 'utf8');

// Aggregates whose arguments are exempt from the GROUP BY rule. Completeness matters:
// a missing aggregate turns a legitimate statement into a false violation.
const AGGREGATES = [
  'count', 'sum', 'avg', 'min', 'max',
  'array_agg', 'string_agg', 'json_agg', 'jsonb_agg', 'json_object_agg', 'jsonb_object_agg',
  'bool_and', 'bool_or', 'every', 'stddev', 'stddev_pop', 'stddev_samp',
  'variance', 'var_pop', 'var_samp', 'mode', 'corr',
];

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
      if (ch === '\\') {
        buffer += text[j + 1] ?? '';
        j += 2;
        continue;
      }
      if (ch === '`') {
        j += 1;
        break;
      }
      if (ch === '$' && text[j + 1] === '{') {
        let depth = 1;
        j += 2;
        while (j < text.length && depth > 0) {
          if (text[j] === '{') depth += 1;
          else if (text[j] === '}') depth -= 1;
          else if (text[j] === '`') {
            j += 1;
            while (j < text.length && text[j] !== '`') {
              if (text[j] === '\\') j += 1;
              j += 1;
            }
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

// Replace aggregate calls, subqueries and `filter (where ...)` modifiers with a token,
// so only references subject to the GROUP BY rule remain.
function stripExempt(sql: string): string {
  const aggRe = new RegExp(`\\b(${AGGREGATES.join('|')})$`, 'i');
  let out = '';
  let i = 0;
  while (i < sql.length) {
    if (sql[i] !== '(') {
      out += sql[i];
      i += 1;
      continue;
    }
    const before = out.trimEnd();
    const exempt =
      /\bfilter$/i.test(before) || aggRe.test(before) || /^select\b/i.test(sql.slice(i + 1).trimStart());
    if (!exempt) {
      out += sql[i];
      i += 1;
      continue;
    }
    let depth = 1;
    let j = i + 1;
    while (j < sql.length && depth > 0) {
      if (sql[j] === '(') depth += 1;
      else if (sql[j] === ')') depth -= 1;
      j += 1;
    }
    out += ' _X_ ';
    i = j;
  }
  return out;
}

function aliasesInFrom(sql: string): string[] {
  const aliases: string[] = [];
  const re = /\b(?:from|join)\s+[a-z_][a-z0-9_]*\s+(?:as\s+)?([a-z][a-z0-9_]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    if (!['on', 'where', 'group', 'order', 'left', 'inner', 'join', 'select'].includes(m[1].toLowerCase())) {
      aliases.push(m[1]);
    }
  }
  return aliases;
}

function covered(alias: string, column: string, groupBy: string): boolean {
  if (new RegExp(`\\b${alias}\\.${column}\\b`, 'i').test(groupBy)) return true;
  // Grouping by the relation's primary key covers all of its columns.
  return new RegExp(`\\b${alias}\\.id\\b`, 'i').test(groupBy);
}

describe('repository SQL: GROUP BY completeness', () => {
  const queries = extractQueries(SOURCE);

  it('finds the repository queries', () => {
    expect(queries.length).toBeGreaterThan(50);
  });

  it('every SELECT column is covered by the GROUP BY', () => {
    const violations: string[] = [];

    for (const query of queries) {
      const outer = stripExempt(query);
      const groupMatch = /group by([\s\S]*?)(?:order by|limit|$)/i.exec(outer);
      if (!groupMatch) continue;

      const groupBy = groupMatch[1];
      const body = outer.slice(0, groupMatch.index);
      const selectList = /select([\s\S]*?)\bfrom\b/i.exec(body)?.[1] ?? '';

      for (const alias of aliasesInFrom(outer)) {
        const re = new RegExp(`\\b${alias}\\.([a-z_][a-z0-9_]*)`, 'gi');
        const columns = new Set<string>();
        let m: RegExpExecArray | null;
        while ((m = re.exec(selectList)) !== null) columns.add(m[1].toLowerCase());

        const uncovered = [...columns].filter((column) => !covered(alias, column, groupBy));
        if (uncovered.length > 0) {
          violations.push(
            `"${alias}.${uncovered.join(`, ${alias}.`)}" is selected but not covered by GROUP BY (${groupBy.trim().replace(/\s+/g, ' ')})`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
