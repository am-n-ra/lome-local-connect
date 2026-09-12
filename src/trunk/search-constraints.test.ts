import { describe, expect, it } from 'vitest';
import { chipHintFor, chipOptionsFor, chipStatusFor, chipsToSearchOptions, isRayonScope, rayonScopeOptionsFor, rayonScopeStatusFor, summarizeActiveChips } from './search-constraints';

describe('search constraint helpers (NW-12.1', () => {
  it('wires buyer chips to real server options', () => {
    expect(chipOptionsFor('Quantité 10')).toEqual({ quantiteMin: 10 });
    expect(chipOptionsFor('≤ 15 000 FCFA')).toEqual({ budgetMaxMinor: 1_500_000 });
    expect(chipOptionsFor('≤ 10 km')).toEqual({ rayonKm: 10 });
    expect(chipOptionsFor('Ouvert')).toEqual({ operationalState: 'ouvert' });
  });

  it('marks non-wired chips as soon, never decorative', () => {
    for (const label of ['Livraison', 'Transactable', 'Ma compagnie', 'Claims', 'Tournée du jour']) {
      expect(chipStatusFor(label)).toBe('soon');
      expect(chipOptionsFor(label)).toBeUndefined();
    }
  });

  it('assembles SearchOptions from active wired chips only', () => {
    const options = chipsToSearchOptions(new Set(['Quantité 10', '≤ 10 km', 'Ouvert', 'Livraison']));
    expect(options).toEqual({ category: '', quantiteMin: 10, rayonKm: 10, operationalState: 'ouvert' });
  });

  it('summarizes only applied intentions for the search field', () => {
    expect(summarizeActiveChips(new Set(['Quantité 10', '≤ 15 000 FCFA', 'Livraison']))).toEqual(['Quantité 10', '15 000 FCFA']);
  });

  it('exposes honest soon hints', () => {
    expect(chipHintFor('Livraison')).toContain('Bientôt');
    expect(chipHintFor('Ouvert')).toBe('Exclut les facilités fermées');
  });
});

describe('rayon scope chips (P0-C', () => {
  it('exposes wired scope presets wired to the rayon_km filter', () => {
    expect(rayonScopeStatusFor('1 km')).toBe('wired');
    expect(rayonScopeStatusFor('25 km')).toBe('wired');
    expect(rayonScopeStatusFor('Monde')).toBe('wired');
    expect(rayonScopeOptionsFor('5 km')).toEqual({ rayonKm: 5 });
    expect(rayonScopeOptionsFor('Monde')).toBeUndefined();
    expect(isRayonScope('25 km')).toBe(true);
    expect(isRayonScope('≤ 10 km')).toBe(false);
  });

  it('assembles SearchOptions from scope presets', () => {
    const options = chipsToSearchOptions(new Set(['25 km', 'Ouvert']));
    expect(options.rayonKm).toBe(25);
    expect(options.operationalState).toBe('ouvert');
  });

  it('treats scope labels as non-soon chips', () => {
    expect(chipStatusFor('10 km')).toBe('wired');
    expect(chipStatusFor('100 km')).toBe('wired');
  });
});
