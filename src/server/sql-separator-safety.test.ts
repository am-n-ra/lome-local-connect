// Guards the SQL corruption class that reached production twice.
//
// A long `sql\`...\`` statement is authored/edited across several lines. A lost separator
// leaves a doubled comma — `select a.id,, 'x'` — which Postgres rejects outright:
//   "syntax error at or near \",\"" (42601)
// The whole statement fails, so the feature is dead in production while every stubbed unit
// test stays green (they never compile SQL).
//
// It reached prod as `setSellerFacilityOperationalState` (the seller Open/Closed toggle):
// `updated.seller_id,,` and `updated.id,,`. The same corruption class was fixed once before
// (`cf1d07d`, `s.transaction_idand m.role`). The real oracle is a database; this check needs
// none, so it fails fast.
//
// Scope, stated honestly: `,,` is never valid SQL, so this is a true positive everywhere it
// fires. It does not try to catch other separator corruption (e.g. a fused keyword), which
// only a real database can reveal.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SOURCE = readFileSync(new URL('./trunk-repository.ts', import.meta.url), 'utf8');

describe('SQL separator safety', () => {
  it('never leaves a doubled comma in a statement', () => {
    const offenders: string[] = [];
    SOURCE.split('\n').forEach((line, index) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      // `,` then only whitespace then `,` — never valid SQL.
      if (/,\s*,/.test(line)) offenders.push(`line ${index + 1}: ${line.trim()}`);
    });
    expect(offenders, `doubled comma in SQL:\n${offenders.join('\n')}`).toEqual([]);
  });
});
