// Guards the bug class that reached production on 2026-10-07 (Branches, founder 500).
//
// `createBulkAvailabilityRequest` wrote the credit ledger with
//   select a.id, 'bulk_debit', - ${creditCost}, ...
// where `creditCost` is a bound value. Postgres cannot infer the type of the bare
// parameter behind the unary minus, so it answers
//   "operator is not unique: - unknown" (42725)
// and the whole statement fails — the buyer sees HTTP 500 on POST /api/v2/bulk-availability.
//
// This is the same shape AGENTS.md already recorded twice: a bare parameter inside a
// CTE needs an explicit cast (`LEAST types text and integer` — R-D). The fix is
// `- (${creditCost}::int)`.
//
// Why the existing tests missed it: the repository unit tests use a stubbed `sql`, so a
// statement Postgres cannot even resolve passes every one of them. The real oracle is a
// database (`scripts/prove-*`); this check needs none, so it fails fast in CI.
//
// Scope, stated honestly: this guard catches a unary minus applied directly to an
// interpolation, the demonstrated failure. It is NOT a general type-safety proof — a
// binary operator with an integer left operand (`5 - ${x}`) resolves fine and is left
// alone on purpose, so the check does not produce false positives.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SOURCE = readFileSync(new URL('./trunk-repository.ts', import.meta.url), 'utf8');

// Unary minus applied to a bound interpolation, in the positions where a value (not a
// left operand) can start: after a comma, an open paren, or the SELECT keyword.
// `select a.id, 'bulk_debit', - ${creditCost}` matches; `balance_minor) - ${x}` does not.
const UNARY_MINUS_ON_PARAM = /(,[ \t]*|\([ \t]*|\bselect[ \t]+)-[ \t]*\$\{/gi;

describe('SQL parameter typing', () => {
  it('never applies a unary minus directly to an uncast bound parameter', () => {
    const offenders: string[] = [];
    let match: RegExpExecArray | null;
    UNARY_MINUS_ON_PARAM.lastIndex = 0;
    while ((match = UNARY_MINUS_ON_PARAM.exec(SOURCE)) !== null) {
      const start = Math.max(0, match.index - 40);
      const snippet = SOURCE.slice(start, match.index + match[0].length + 60).replace(/\s+/g, ' ');
      // A cast anywhere in the operand makes the unary minus well-typed.
      if (!/::\s*(int|integer|bigint|numeric)/.test(match[0])) offenders.push(`…${snippet}…`);
    }
    expect(offenders, `uncast unary minus on a bound parameter:\n${offenders.join('\n')}`).toEqual([]);
  });
});
