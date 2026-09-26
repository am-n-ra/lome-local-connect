import { describe, expect, it } from 'vitest';
import {
  computeExistenceLevel,
  computeIntegrity,
  computeReputation,
  existenceFor,
  facilityExistenceLevel,
  normalizeProductMedia,
  type ExistenceInput,
} from './offer-existence';

const base: ExistenceInput = {
  publicationState: 'published',
  hasEntity: true,
  availabilityState: 'en_stock',
  availabilityExpiresAt: null,
  quantityAllocated: 10,
  quantityReserved: 0,
};

describe('S-06 existence scale 0→4', () => {
  it('level 0 — on the map, no entity behind the place', () => {
    expect(computeExistenceLevel({ ...base, hasEntity: false, publicationState: 'draft' })).toBe(0);
  });

  it('level 1 — an entity owns the place, offer not published', () => {
    expect(computeExistenceLevel({ ...base, publicationState: 'draft' })).toBe(1);
    expect(computeExistenceLevel({ ...base, publicationState: 'pending_validation' })).toBe(1);
  });

  it('level 2 — published, stock declared but availability not live', () => {
    expect(computeExistenceLevel({ ...base, availabilityState: 'a_valider' })).toBe(2);
  });

  it('level 3 — live availability but nothing left to reserve', () => {
    // The exact lie to prevent: published + live availability, but zero reservable stock.
    expect(computeExistenceLevel({ ...base, quantityAllocated: 3, quantityReserved: 3 })).toBe(3);
    expect(computeExistenceLevel({ ...base, quantityAllocated: 0, quantityReserved: 0 })).toBe(3);
  });

  it('level 4 — live availability AND reservable stock > 0', () => {
    expect(computeExistenceLevel(base)).toBe(4);
    expect(computeExistenceLevel({ ...base, quantityAllocated: 5, quantityReserved: 2 })).toBe(4);
  });

  it('an expired availability falls back to level 2 (D-03 freshness)', () => {
    const past = new Date(Date.now() - 60_000);
    expect(computeExistenceLevel({ ...base, availabilityExpiresAt: past })).toBe(2);
    const future = new Date(Date.now() + 60_000);
    expect(computeExistenceLevel({ ...base, availabilityExpiresAt: future })).toBe(4);
  });

  it('an unpublished offer can never exceed level 1 (invariant I-7)', () => {
    for (const state of ['draft', 'pending_validation', 'sold_out', 'archived']) {
      const level = computeExistenceLevel({ ...base, publicationState: state });
      expect(level).toBeLessThanOrEqual(1);
    }
  });

  it('reservations are never negative (never claims stock that does not exist)', () => {
    expect(computeExistenceLevel({ ...base, quantityAllocated: 1, quantityReserved: 5 })).toBe(3);
  });

  it('labels and hints match the maquette wording', () => {
    expect(existenceFor(base)).toEqual({ level: 4, label: 'Transactable', hint: 'transaction Omni possible maintenant' });
    expect(existenceFor({ ...base, hasEntity: false, publicationState: 'draft' }).label).toBe('Présente');
  });

  it('the place shows the max level of its offers', () => {
    expect(facilityExistenceLevel([2, 4, 3], true)).toBe(4);
    expect(facilityExistenceLevel([], true)).toBe(1);
    expect(facilityExistenceLevel([], false)).toBe(0);
  });
});

describe('S-32 offer integrity', () => {
  const complete = { media: [{ url: 'a.jpg' }], priceMinor: 850, description: 'Une description assez longue.', duplicate: false };

  it('ok only when all four checks pass', () => {
    expect(computeIntegrity(complete)).toEqual({ state: 'ok', passed: 4, total: 4, failed: [] });
  });

  it('names every failed check — a ✗ without a reason is unusable', () => {
    const result = computeIntegrity({ ...complete, media: [], priceMinor: 0 });
    expect(result.failed).toEqual(['visuel', 'prix']);
    expect(result.passed).toBe(2);
    expect(result.state).toBe('partielle');
  });

  it('insufficient when 0–1 checks pass', () => {
    const result = computeIntegrity({ media: null, priceMinor: 0, description: '', duplicate: true });
    expect(result.passed).toBe(0);
    expect(result.state).toBe('insuffisante');
    expect(result.failed).toHaveLength(4);
  });

  it('empty-ish media values all count as missing', () => {
    for (const media of [[], null, undefined, '', '[]', 'null']) {
      expect(computeIntegrity({ ...complete, media }).failed).toContain('visuel');
    }
  });

  it('ok is impossible without a visual (the measured 0/16 reality)', () => {
    expect(computeIntegrity({ ...complete, media: [] }).state).not.toBe('ok');
  });

  it('a short description fails; ten characters passes', () => {
    expect(computeIntegrity({ ...complete, description: 'court' }).failed).toContain('description');
    expect(computeIntegrity({ ...complete, description: '0123456789' }).failed).not.toContain('description');
  });
});

describe('S-20 / E-03 offer media normalisation', () => {
  it('keeps valid https image references', () => {
    expect(normalizeProductMedia([{ url: 'https://blob.omni.test/a.jpg', kind: 'image' }]))
      .toEqual([{ url: 'https://blob.omni.test/a.jpg', kind: 'image' }]);
  });

  it('accepts a JSON string (jsonb round-trip) and an already-parsed array', () => {
    expect(normalizeProductMedia('[{"url":"https://x.test/a.png"}]')).toHaveLength(1);
    expect(normalizeProductMedia([{ url: 'https://x.test/a.png' }])).toHaveLength(1);
  });

  it('rejects non-https, empty and over-long urls — a client cannot record junk', () => {
    expect(normalizeProductMedia([{ url: 'http://x.test/a.png' }])).toEqual([]);
    expect(normalizeProductMedia([{ url: '' }])).toEqual([]);
    expect(normalizeProductMedia([{ url: `https://x.test/${'a'.repeat(600)}` }])).toEqual([]);
  });

  it('legacy empty shapes read as no visual (never throws)', () => {
    for (const raw of [[], null, undefined, '', '[]', 'null', 'not json', 42, {}]) {
      expect(normalizeProductMedia(raw)).toEqual([]);
    }
  });

  it('caps at four visuals', () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ url: `https://x.test/${i}.jpg` }));
    expect(normalizeProductMedia(five)).toHaveLength(4);
  });

  it('a normalised visual makes the S-32 integrity visuel check pass', () => {
    const media = normalizeProductMedia([{ url: 'https://x.test/a.jpg' }]);
    expect(computeIntegrity({ media, priceMinor: 850, description: 'Une description assez longue.', duplicate: false }).failed).not.toContain('visuel');
  });
});

describe('S-32 offer reputation', () => {
  it('score is null exactly when there is no rating (muted, never 0 ★)', () => {
    expect(computeReputation(0, null)).toEqual({ count: 0, score: null });
    expect(computeReputation(0, 0)).toEqual({ count: 0, score: null });
  });

  it('averages and rounds to one decimal', () => {
    expect(computeReputation(3, 14)).toEqual({ count: 3, score: 4.7 });
    expect(computeReputation(2, 9)).toEqual({ count: 2, score: 4.5 });
  });

  it('invariant I-5 — score is null iff count is 0', () => {
    const withRatings = computeReputation(1, 5);
    expect(withRatings.count > 0).toBe(withRatings.score !== null);
    const without = computeReputation(0, null);
    expect(without.count > 0).toBe(without.score !== null);
  });
});
