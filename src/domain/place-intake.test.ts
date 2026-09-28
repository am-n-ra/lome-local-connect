// Unit proof for the POP-1a intake classifier (DEC-V2-10/11).
// The pilot predicate is injected: these tests pin the tier logic, never a bbox.
import { describe, expect, it, vi } from 'vitest';
import { classifyIntakePoint } from './place-intake';

const PILOT_YES = () => true;
const PILOT_NO = () => false;

describe('classifyIntakePoint (POP-1a world population)', () => {
  it('admits a named pilot point as pilot with no reasons', () => {
    expect(classifyIntakePoint({ latitude: 6.13, longitude: 1.22, name: 'Marché', address: 'Lomé' }, PILOT_YES))
      .toEqual({ tier: 'pilot', reasons: [] });
  });

  it('admits the same point as world when outside the pilot zone', () => {
    expect(classifyIntakePoint({ latitude: 6.13, longitude: 1.22, name: 'Marché', address: 'Lomé' }, PILOT_NO))
      .toEqual({ tier: 'world', reasons: ['outside-pilot-zone'] });
  });

  it('does not refuse Ghana supply at classification (DEC-V2-11) — refusal lives at admission, later', () => {
    expect(classifyIntakePoint({ latitude: 5.6, longitude: -0.5, name: 'Boutique', address: 'Accra' }, PILOT_NO).tier).toBe('world');
  });

  it('quarantines Null Island even under a permissive predicate', () => {
    expect(classifyIntakePoint({ latitude: 0, longitude: 0, name: 'Marché', address: 'Lomé' }, PILOT_YES))
      .toEqual({ tier: 'quarantine', reasons: ['null-island'] });
  });

  it('quarantines non-finite and out-of-range coordinates', () => {
    expect(classifyIntakePoint({ latitude: Number.NaN, longitude: 1.2, name: 'X' }, PILOT_YES).tier).toBe('quarantine');
    expect(classifyIntakePoint({ latitude: 91, longitude: 1.2, name: 'X' }, PILOT_YES).reasons).toContain('insane-coordinates');
    expect(classifyIntakePoint({ latitude: 6.1, longitude: Number.POSITIVE_INFINITY, name: 'X' }, PILOT_YES).tier).toBe('quarantine');
  });

  it('quarantines a nameless point without address, admits it with address', () => {
    expect(classifyIntakePoint({ latitude: 6.13, longitude: 1.22, name: '  ', address: null }, PILOT_NO))
      .toEqual({ tier: 'quarantine', reasons: ['nameless'] });
    expect(classifyIntakePoint({ latitude: 6.13, longitude: 1.22, name: '', address: 'Rue 12' }, PILOT_NO).tier).toBe('world');
  });

  it('quarantines placeholder names without address (Ghana precedent)', () => {
    expect(classifyIntakePoint({ latitude: 5.6, longitude: -0.5, name: 'Unnamed public place', address: null }, PILOT_NO))
      .toEqual({ tier: 'quarantine', reasons: ['placeholder-no-address'] });
    expect(classifyIntakePoint({ latitude: 5.6, longitude: -0.5, name: 'Unnamed public place', address: 'Accra' }, PILOT_NO).tier).toBe('world');
  });

  it('passes the exact coordinates to the pilot predicate (wiring contract)', () => {
    const spy = vi.fn(() => false);
    classifyIntakePoint({ latitude: 6.131, longitude: 1.221, name: 'X' }, spy);
    expect(spy).toHaveBeenCalledWith({ latitude: 6.131, longitude: 1.221 });
  });
});
