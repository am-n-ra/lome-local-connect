import { describe, expect, it } from 'vitest';
import { savedSearchConstraintSummary } from './ui-helpers';
import type { SavedSearch } from './types';

function search(constraints: Record<string, unknown>): SavedSearch {
  return { id: 's1', query: 'Chaise', constraints, active: true, createdAt: '2026-09-03T00:00:00Z' };
}

describe('savedSearchConstraintSummary (Gate 5, B19)', () => {
  it('falls back when no constraints', () => {
    expect(savedSearchConstraintSummary(search({}))).toBe('Toute disponibilité');
  });

  it('summarises radius, price and open-now', () => {
    expect(savedSearchConstraintSummary(search({ radiusKm: 10, maxPrice: 15000, openNow: true }))).toBe('≤ 10 km · ≤ 15 000 FCFA · Ouvert');
  });

  it('accepts alternate constraint keys', () => {
    expect(savedSearchConstraintSummary(search({ radius: 5, budgetMax: 2000 }))).toBe('≤ 5 km · ≤ 2 000 FCFA');
  });

  it('ignores non-numeric values', () => {
    expect(savedSearchConstraintSummary(search({ radiusKm: '10' }))).toBe('Toute disponibilité');
  });
});
