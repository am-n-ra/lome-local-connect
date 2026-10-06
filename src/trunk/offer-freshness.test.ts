import { describe, expect, it } from 'vitest';
import { computeOfferFreshness, worstFreshness, freshnessLabel, FRESHNESS_STALE_WINDOW_MS } from './offer-freshness';

const H = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 6, 12, 0, 0);

describe('computeOfferFreshness (SEARCH-02 / D-03)', () => {
  it('is fresh when the window is more than 4 h out', () => {
    const r = computeOfferFreshness('en_stock', new Date(NOW + 5 * H).toISOString(), NOW);
    expect(r.level).toBe('fresh');
    expect(r.expiresAtMs).toBe(NOW + 5 * H);
  });

  it('is stale inside the 4 h window (still good, to re-confirm)', () => {
    expect(computeOfferFreshness('verifie', new Date(NOW + 2 * H).toISOString(), NOW).level).toBe('stale');
    expect(computeOfferFreshness('en_stock', new Date(NOW + FRESHNESS_STALE_WINDOW_MS - 1).toISOString(), NOW).level).toBe('stale');
  });

  it('is expired exactly at the deadline (never a live claim past it)', () => {
    expect(computeOfferFreshness('en_stock', new Date(NOW).toISOString(), NOW).level).toBe('expired');
    expect(computeOfferFreshness('en_stock', new Date(NOW - H).toISOString(), NOW).level).toBe('expired');
  });

  it('is expired when the state is not active, regardless of the window', () => {
    expect(computeOfferFreshness('a_valider', new Date(NOW + 5 * H).toISOString(), NOW).level).toBe('expired');
    expect(computeOfferFreshness('bientot', null, NOW).level).toBe('expired');
  });

  it('is fresh without an expiry (declared, no window) — never a false "expired"', () => {
    const r = computeOfferFreshness('en_stock', null, NOW);
    expect(r.level).toBe('fresh');
    expect(r.expiresAtMs).toBeNull();
    expect(r.state).toBe('en_stock');
  });

  it('is fresh (unknown) when there is no availability fact at all — no invented claim', () => {
    const r = computeOfferFreshness(undefined, undefined, NOW);
    expect(r.level).toBe('fresh');
    expect(r.expiresAtMs).toBeNull();
    expect(r.state).toBeNull();
  });
});

describe('worstFreshness (the surface shows the weak link, not the best case)', () => {
  it('returns expired if any offer is expired', () => {
    const r = worstFreshness(
      [
        { availabilityState: 'en_stock', availabilityExpiresAt: new Date(NOW + 5 * H).toISOString() },
        { availabilityState: 'a_valider', availabilityExpiresAt: null },
      ],
      NOW,
    );
    expect(r.level).toBe('expired');
  });

  it('returns stale if the worst is stale', () => {
    const r = worstFreshness(
      [
        { availabilityState: 'en_stock', availabilityExpiresAt: new Date(NOW + 9 * H).toISOString() },
        { availabilityState: 'en_stock', availabilityExpiresAt: new Date(NOW + 1 * H).toISOString() },
      ],
      NOW,
    );
    expect(r.level).toBe('stale');
  });

  it('prefers a real window over an unknown at the same level (never hides a window)', () => {
    const r = worstFreshness(
      [
        { availabilityState: 'en_stock', availabilityExpiresAt: null },
        { availabilityState: 'en_stock', availabilityExpiresAt: new Date(NOW + 2 * H).toISOString() },
      ],
      NOW,
    );
    expect(r.level).toBe('stale');
    expect(r.expiresAtMs).toBe(NOW + 2 * H);
  });

  it('is fresh/unknown for an empty list', () => {
    expect(worstFreshness([], NOW)).toEqual({ level: 'fresh', expiresAtMs: null, state: null });
  });
});

describe('freshnessLabel (says what is true, never a false "vérifiée")', () => {
  it('a never-declared availability reads "non confirmée", not a false "expirée"', () => {
    const label = freshnessLabel(computeOfferFreshness('a_valider', null, NOW), NOW);
    expect(label).toContain('non confirmée');
    expect(label).not.toContain('expirée');
  });
  it('an expired live availability names the re-confirmation', () => {
    const label = freshnessLabel(computeOfferFreshness('en_stock', new Date(NOW - 1000).toISOString(), NOW), NOW);
    expect(label).toContain('expirée');
  });
  it('stale says "encore bonne" with the remaining time', () => {
    const text = freshnessLabel(computeOfferFreshness('en_stock', new Date(NOW + 2 * H).toISOString(), NOW), NOW);
    expect(text).toContain('vieillissante');
    expect(text).toContain('2 h');
  });
  it('fresh without a window does not pretend a duration', () => {
    expect(freshnessLabel(computeOfferFreshness('en_stock', null, NOW), NOW)).toContain('sans fenêtre de fraîcheur');
  });
  it('fresh with a window names the remaining time', () => {
    expect(freshnessLabel(computeOfferFreshness('en_stock', new Date(NOW + 3 * H).toISOString(), NOW), NOW)).toContain('3 h');
  });
});
