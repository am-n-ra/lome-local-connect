import { describe, expect, it } from 'vitest';
import { buildWordBoundaryPattern, foldAccents } from './trunk-repository';

// SEARCH-03 (2026-10-07). The literal `ilike '%q%'` matcher was accent-sensitive and not
// word-boundary, so `pain` surfaced `painter`/`paints`/`copain` and `marche` missed
// "Marché". These tests pin the matcher itself; the read-path proof pins it against real
// Postgres. Both must agree, so both are exercised.

/** Mimic the SQL haystack: `translate(lower(<name>), …)` then `~ pattern`. */
function matches(name: string, query: string): boolean {
  const pattern = buildWordBoundaryPattern(query);
  if (pattern === null) return false;
  return new RegExp(pattern).test(foldAccents(name.toLowerCase()));
}

describe('search matcher (SEARCH-03)', () => {
  it('foldAccents strips the accents the SQL translate side strips', () => {
    expect(foldAccents('Marché')).toBe('marche');
    expect(foldAccents('Épicerie Chez Afi')).toBe('epicerie chez afi');
    expect(foldAccents('Boulangerie "Au bon pain"')).toBe('boulangerie "au bon pain"');
  });

  it('returns null when the query has no searchable token', () => {
    expect(buildWordBoundaryPattern('')).toBeNull();
    expect(buildWordBoundaryPattern('   ')).toBeNull();
    expect(buildWordBoundaryPattern('!!! …')).toBeNull();
  });

  it('matches a whole word, not a substring (the "pain" defect)', () => {
    // Real Togo/OpenStreetMap names. `pain` must reach the bakery, never the copy shop
    // whose name merely contains the letters (Photocopie pain de vie is a real match).
    expect(matches("Pain d'or", 'pain')).toBe(true);
    expect(matches('Ets 5 pains et 2 poissons', 'pain')).toBe(true);
    expect(matches('Boulangerie "Au bon pain" LA NOBLESSE', 'pain')).toBe(true);
    expect(matches('Copain coiffure', 'pain')).toBe(false);
    expect(matches('HOTEL LES COPAINS', 'pain')).toBe(false);
    expect(matches('American Paints', 'pain')).toBe(false);
    expect(matches('Savana Peinture', 'pain')).toBe(false);
  });

  it('is accent-insensitive on the haystack', () => {
    expect(matches("Boulangerie du Marché d'Adawlato", 'marche')).toBe(true);
    expect(matches('Épicerie Chez Afi', 'epicerie')).toBe(true);
    expect(matches('Épicerie Chez Afi', 'épicerie')).toBe(true);
  });

  it('ANDs multiple tokens in order (a real multi-word search)', () => {
    expect(matches('Boulangerie "Au bon pain" LA NOBLESSE', 'au bon pain')).toBe(true);
    expect(matches('Boulangerie "Au bon pain" LA NOBLESSE', 'au pain')).toBe(true);
    expect(matches("Pain d'or", 'au bon pain')).toBe(false);
  });

  it('tolerates a plural s/x on the HAYSTACK word', () => {
    // A buyer types the singular; the name carries the plural ("5 pains et 2 poissons").
    expect(matches('Ets 5 pains et 2 poissons', 'pain')).toBe(true);
    expect(matches('HOTEL LES COPAINS', 'copain')).toBe(true);
  });

  it('cannot inject regular-expression syntax (tokens are [a-z0-9] only)', () => {
    // `.*` would match anything if it reached the pattern. It must not survive the split.
    expect(buildWordBoundaryPattern('.*')).toBeNull();
    expect(matches('Any name at all', '.*')).toBe(false);
    // A metacharacter-laden query degrades to its alphanumeric tokens.
    expect(buildWordBoundaryPattern('pain|.*')).toBe('(?<![a-z0-9])pain[sx]?(?![a-z0-9])');
  });
});
