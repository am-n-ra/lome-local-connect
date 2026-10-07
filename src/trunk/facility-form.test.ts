import { describe, expect, it } from 'vitest';
import { facilityFormLabel } from './facility-form';

/**
 * S4 (Heartwood) — la fiche doit dire la FORME d'un lieu (fixe / mobile / immatérielle),
 * avec le vocabulaire de la maquette acceptée. Une forme non déclarée se TAIT (S-05).
 */
describe('S4 — facility form label', () => {
  it('names the three forms with the maquette vocabulary', () => {
    expect(facilityFormLabel({ facilityType: 'fixe' })).toBe('Fixe · sur place');
    expect(facilityFormLabel({ facilityType: 'mobile' })).toBe('Mobile · se déplace');
    expect(facilityFormLabel({ facilityType: 'digital' })).toBe('Immatérielle · origine');
  });

  it('appends the rayon only when it exists (never invents it)', () => {
    expect(facilityFormLabel({ facilityType: 'mobile', rayonKm: 25 })).toBe('Mobile · se déplace · rayon 25 km');
    expect(facilityFormLabel({ facilityType: 'mobile', rayonKm: 0 })).toBe('Mobile · se déplace');
    expect(facilityFormLabel({ facilityType: 'mobile', rayonKm: null })).toBe('Mobile · se déplace');
  });

  it('says nothing when the form is undeclared (map-floor place, S-05)', () => {
    expect(facilityFormLabel({ facilityType: null })).toBe('');
    expect(facilityFormLabel({})).toBe('');
  });

  it('does not leak a rayon onto a fixe/digital place', () => {
    expect(facilityFormLabel({ facilityType: 'fixe', rayonKm: 10 })).toBe('Fixe · sur place');
    expect(facilityFormLabel({ facilityType: 'digital', rayonKm: 10 })).toBe('Immatérielle · origine');
  });
});
