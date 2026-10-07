// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SellerFreshnessV13, badgeFor } from './SellerFreshnessV13';
import type { SellerCatalogueProduct } from './types';

const NOW = Date.parse('2026-10-06T12:00:00.000Z');

function product(over: Partial<SellerCatalogueProduct>): SellerCatalogueProduct {
  return {
    id: 'p1', entityId: 'e1', entityName: 'Entité', facilityId: 'f1', facilityName: 'Lieu',
    name: 'Riz 5 kg', description: null, unit: 'sac', currency: 'XOF',
    stockLoueOmni: 10, prixOriginal: 5000, prixReduit: 4500, pourcentageReduction: 10,
    publicationState: 'published', availabilityState: 'en_stock',
    availabilityExpiresAt: null, availabilityProEligible: true, autoAvailability: false,
    positionKind: null, uniquenessKind: null, handoverKind: null, priceKind: null, conditionKind: null,
    media: [],
    ...over,
  };
}

describe('SellerFreshnessV13 — badge dérivé de la fenêtre de fraîcheur (D-03)', () => {
  it('a live availability inside its window shows « En stock » (ok)', () => {
    const p = product({ availabilityState: 'en_stock', availabilityExpiresAt: new Date(NOW + 6 * 3600_000).toISOString() });
    expect(badgeFor(p, NOW)).toEqual({ label: 'En stock', tone: 'ok' });
  });

  it('an availability inside the last 4 h shows « À confirmer » (stale, warn)', () => {
    const p = product({ availabilityState: 'en_stock', availabilityExpiresAt: new Date(NOW + 2 * 3600_000).toISOString() });
    expect(badgeFor(p, NOW)).toEqual({ label: 'À confirmer', tone: 'warn' });
  });

  it('an availability past its deadline shows « Non confirmée » (expired, warn)', () => {
    const p = product({ availabilityState: 'en_stock', availabilityExpiresAt: new Date(NOW - 3600_000).toISOString() });
    expect(badgeFor(p, NOW)).toEqual({ label: 'Non confirmée', tone: 'warn' });
  });

  it('an offer never declared live (a_valider) is « Non confirmée », never a false « En stock »', () => {
    const p = product({ availabilityState: 'a_valider', availabilityExpiresAt: null });
    expect(badgeFor(p, NOW)).toEqual({ label: 'Non confirmée', tone: 'warn' });
  });

  it('an unpublished offer is « Hors ligne » regardless of a stale availability fact', () => {
    const p = product({ publicationState: 'draft', availabilityState: 'en_stock', availabilityExpiresAt: new Date(NOW + 6 * 3600_000).toISOString() });
    expect(badgeFor(p, NOW)).toEqual({ label: 'Hors ligne', tone: 'gray' });
  });
});

// The screen renders through its REAL code path; only the network boundary (no
// session → 401 on /token) is stubbed, so it must degrade to the honest empty
// state rather than crash. This is a smoke test of the mount, not a mock of logic.
describe('SellerFreshnessV13 — rendu sans session (état vide honnête)', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => { root.unmount(); });
    container.remove();
  });

  it('mounts, names the window threshold, and shows the empty state — never a false « En stock »', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('{}', { status: 401 })) as typeof fetch;
    try {
      await act(async () => {
        root.render(<SellerFreshnessV13 onClose={() => undefined} />);
      });
      const text = container.textContent ?? '';
      expect(text).toContain('4 h frais · 24 h expiré');
      expect(text).toContain('Aucune offre publiée');
      expect(text).not.toContain('En stock');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
