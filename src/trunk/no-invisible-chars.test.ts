import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * UI-4 — aucun caractère invisible (zero-width space U+200B, joiners, BOM)
 * dans le source. Ces caractères sont invisibles à l'œil ET à `tsc` ; ils
 * cassent les recherches exactes et trahissent une génération. Ils se glissent
 * typiquement entre une espace et un nombre (`minHeight: ␣28`).
 */
const SRC = resolve(process.cwd(), 'src');
const INVISIBLE = /[\u200b\u200c\u200d\u200e\u200f\ufeff]/;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(ts|tsx|css)$/.test(e.name) ? [p] : [];
  });
}

describe('UI-4 — pas de caractère invisible dans le source', () => {
  it('aucun fichier de src/ ne contient U+200B..U+200F / U+FEFF', () => {
    const offenders = walk(SRC).filter((f) => INVISIBLE.test(readFileSync(f, 'utf8')));
    expect(offenders.map((f) => f.replace(SRC + '/', ''))).toEqual([]);
  });

  it('le garde sait échouer (auto-falsification)', () => {
    expect(INVISIBLE.test('minHeight: \u200b28')).toBe(true);
    expect(INVISIBLE.test('minHeight: 28')).toBe(false);
  });
});
