import { describe, expect, it } from 'vitest';
import { chipHintFor, chipOptionsFor, chipStatusFor, chipsToSearchOptions, emptyConstraints, activeConstraintCount, isRayonScope, rayonScopeOptionsFor, rayonScopeStatusFor, summarizeActiveChips, CONSTRAINT_GROUPS } from './search-constraints';

describe('search constraint helpers (NW-12.1, D-CON-1…5)', () => {
  it('wires switches to real server options', () => {
    expect(chipOptionsFor('Ouvert')).toEqual({ operationalState: 'ouvert' });
  });

  it('keeps budget and quantity OUT of the chip list — they are thresholds, not switches', () => {
    // D-CON-1/D-CON-2: a frozen threshold looked like a filter. It is now an input.
    expect(chipOptionsFor('Quantité 10')).toBeUndefined();
    expect(chipOptionsFor('≤ 15 000 FCFA')).toBeUndefined();
    expect(chipOptionsFor('≤ 10 km')).toBeUndefined();
  });

  it('declares exactly three families, and drops the non-filters', () => {
    expect(CONSTRAINT_GROUPS.map((g) => g.id)).toEqual(['disponibilite', 'besoin', 'attributs']);
    const labels = CONSTRAINT_GROUPS.flatMap((g) => g.chips.map((c) => c.label));
    // Livraison is a request mode (043); Transactable is a trust tier. Neither is a catalogue filter.
    expect(labels).not.toContain('Livraison');
    expect(labels).not.toContain('Transactable');
  });

  it('marks non-wired chips as soon, never decorative', () => {
    for (const label of ['État / condition', 'Créneau', 'Ma compagnie', 'Claims', 'Tournée du jour']) {
      expect(chipStatusFor(label)).toBe('soon');
      expect(chipOptionsFor(label)).toBeUndefined();
    }
  });

  it('assembles SearchOptions from switches + thresholds, carrying the currency', () => {
    const options = chipsToSearchOptions(new Set(['Ouvert']), {
      budgetMaxMinor: 2500,
      quantiteMin: 2,
      budgetCurrency: 'XOF',
      budgetRatePerUsdMinor: 500,
    });
    expect(options).toEqual({
      category: '',
      operationalState: 'ouvert',
      budgetMaxMinor: 2500,
      quantiteMin: 2,
      budgetCurrency: 'XOF',
      budgetRatePerUsdMinor: 500,
    });
  });

  it('never sends a soon chip to the server', () => {
    const options = chipsToSearchOptions(new Set(['État / condition', 'Créneau']));
    expect(options).toEqual({ category: '' });
  });

  it('counts switches and set thresholds honestly', () => {
    const none = emptyConstraints();
    expect(activeConstraintCount(none)).toBe(0);
    expect(activeConstraintCount({ switches: new Set(['Ouvert']), budgetMaxMinor: 2500, quantiteMin: 1 })).toBe(3);
  });

  it('summarizes only applied intentions, formatting the budget in the user currency', () => {
    const parts = summarizeActiveChips(
      { switches: new Set(['Ouvert']), budgetMaxMinor: 2500, quantiteMin: 2 },
      (minor) => `${minor} F`,
    );
    expect(parts).toContain('Ouvert');
    expect(parts).toContain('≥ 2');
    expect(parts).toContain('≤ 2500 F');
  });

  it('exposes honest soon hints', () => {
    expect(chipHintFor('État / condition')).toContain('Bientôt');
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
