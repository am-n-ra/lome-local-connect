import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

// design.md §6: "Production markup must use classes exactly (no aliases, no
// inline colors)". Inline `var(--token)` references are the sanctioned escape
// hatch for one-off layout; a literal hex/rgb value inside style={{ }} is the
// violation. Self-falsified: a `#fff` in an inline style makes this fail.
function tsxFiles(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) tsxFiles(p, acc);
    else if (/\.tsx$/.test(e.name) && !e.name.includes('.test.')) acc.push(p);
  }
  return acc;
}

const root = resolve(__dirname, '..', '..');
const offenders: string[] = [];
for (const f of tsxFiles(resolve(root, 'src'))) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/style=\{\{([\s\S]*?)\}\}/g)) {
    if (/['"]#[0-9a-fA-F]{3,8}['"]/.test(m[1]) || /['"]rgba?\([^'"]*\)['"]/.test(m[1])) {
      offenders.push(`${f.replace(root + '/', '')}: ${m[1].replace(/\s+/g, ' ').trim().slice(0, 80)}`);
    }
  }
}

describe('design.md — no inline literal colors', () => {
  it('uses var(--token) tokens, never literal hex/rgb, inside style={{ }}', () => {
    expect(offenders).toEqual([]);
  });
});
