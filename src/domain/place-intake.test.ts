// Unit proof for the POP-1a intake classifier (DEC-V2-10/11).
// The pilot predicate is injected: these tests pin the tier logic, never a bbox.
import { describe, expect, it, vi } from 'vitest';
import { admitIntakeBatch, classifyIntakePoint, parseIntakeScope } from './place-intake';

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

describe('parseIntakeScope (POP-1b)', () => {
  it('opens world only on the exact value, defaults to pilot otherwise', () => {
    expect(parseIntakeScope('world')).toBe('world');
    expect(parseIntakeScope(undefined)).toBe('pilot');
    expect(parseIntakeScope(null)).toBe('pilot');
    expect(parseIntakeScope('')).toBe('pilot');
    expect(parseIntakeScope('WORLD')).toBe('pilot');
    expect(parseIntakeScope('pilot')).toBe('pilot');
  });
});

describe('admitIntakeBatch (POP-1b scope-aware admission)', () => {
  const LOME = { sourceRef: 'node/1', name: 'Marché', category: 'Market', address: 'Lomé', latitude: 6.13, longitude: 1.22 };
  const GHANA = { sourceRef: 'node/2', name: 'Boutique', category: 'Shop', address: 'Accra', latitude: 5.6, longitude: -0.5 };
  const NULL_ISLAND = { sourceRef: 'node/3', name: 'X', category: null, address: null, latitude: 0, longitude: 0 };
  const LOME_ZONE = (p: { latitude: number; longitude: number }) => p.latitude === 6.13 && p.longitude === 1.22;

  it('pilot scope preserves the legacy gate: pilot admitted, rest refused and counted', () => {
    const out = admitIntakeBatch([LOME, GHANA, NULL_ISLAND], 'pilot', LOME_ZONE);
    expect(out.admitted).toEqual([{ ...LOME, intakeTier: 'pilot' }]);
    expect(out.skippedOutOfZone).toBe(1);
    expect(out.skippedQuarantine).toBe(1);
  });

  it('world scope admits pilot + world with tiers, refuses quarantine counted', () => {
    const out = admitIntakeBatch([LOME, GHANA, NULL_ISLAND], 'world', LOME_ZONE);
    expect(out.admitted).toEqual([
      { ...LOME, intakeTier: 'pilot' },
      { ...GHANA, intakeTier: 'world' },
    ]);
    expect(out.skippedOutOfZone).toBe(0);
    expect(out.skippedQuarantine).toBe(1);
  });

  it('carries caller fields through (sourceRef survives for dedupe)', () => {
    const out = admitIntakeBatch([LOME], 'pilot', PILOT_YES);
    expect(out.admitted[0].sourceRef).toBe('node/1');
  });
});
