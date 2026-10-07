// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CompanyV13 } from './CompanyV13';
import type { SellerCatalogueProduct, SellerCatalogueResult } from './types';

/**
 * Heartwood S1b (S-21) — le vendeur AFFICHE le QR public de son entité (à coller en boutique).
 * Le QR encode l'entité ; un produit sans entité ne produit pas de faux QR.
 */

let container: HTMLDivElement;
let root: Root;

const product = (entityId: string | null): SellerCatalogueProduct => ({
  id: 'p1', entityId, entityName: 'Boutique Kodjo', facilityId: 'f1', facilityName: 'Boutique Kodjo',
  name: 'Spaghetti 500 g', description: null, unit: 'paquet', currency: 'XOF', stockLoueOmni: 3,
  prixOriginal: 1000, prixReduit: 850, pourcentageReduction: 15, publicationState: 'published',
  availabilityState: 'en_stock', availabilityExpiresAt: null, availabilityProEligible: true,
  autoAvailability: false, kind: 'renouvelable', positionKind: 'fixe', uniquenessKind: 'renouvelable',
  handoverKind: 'retrait', priceKind: 'fixe', conditionKind: 'neuf', media: [],
} as unknown as SellerCatalogueProduct);

const catalogue = (p: SellerCatalogueProduct): SellerCatalogueResult => ({
  authorized: true, facilities: [], products: [p], catalogReady: true,
} as unknown as SellerCatalogueResult);

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('Heartwood S1b — QR public dans l’espace vendeur', () => {
  it('rend un <svg> de QR quand l’entité est connue', () => {
    const entity = 'c5975d63-9c7c-4974-ba50-beb92e6b4924';
    act(() => root.render(<CompanyV13 onClose={() => {}} onProducts={() => {}} onOffers={() => {}} catalogue={catalogue(product(entity))} />));
    // Scoper au QR (le composant porte aussi des icônes lucide en <svg>).
    expect(container.querySelector('.omni-qr svg')).toBeTruthy();
    expect(container.textContent).toContain('QR public');
    expect(container.textContent).toContain('remise Omni');
  });

  it('n’invente pas de QR quand l’entité est absente (uuid inconnu)', () => {
    act(() => root.render(<CompanyV13 onClose={() => {}} onProducts={() => {}} onOffers={() => {}} catalogue={catalogue(product(null))} />));
    // Le regroupement retombe sur la clé 'sans-lieu' → pas d'uuid → pas de QR.
    expect(container.querySelector('.omni-qr')).toBeNull();
  });
});
