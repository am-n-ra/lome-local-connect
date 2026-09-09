import { describe, expect, it } from 'vitest';
import type { PublicFacility, SellerCatalogueFacility, SellerCatalogueProduct } from './types';
import { buildSellerWorkspace, sellerRouteLabels, selectSellerFacility, isSellerWorkspaceRoute, sellerMenuHasFunctionalRoutes } from './seller-workspace';

const catalogFacilities: SellerCatalogueFacility[] = [
  { id: 'facility-1', name: 'Boutique A', category: 'Marché', address: null, currency: 'XOF', slotState: 'active', operationalState: 'ouvert', productCount: 2 },
  { id: 'facility-2', name: 'Boutique B', category: 'Épicerie', address: 'Lomé', currency: 'XOF', slotState: 'active', operationalState: 'ouvert', productCount: 1 },
];

const publicFacilities: PublicFacility[] = [
  { id: 'facility-1', name: 'Boutique A', category: 'Marché', address: null, latitude: 6.1319, longitude: 1.2223, trust: 'confirmed', plan: 'pro_active', productCount: 2 },
  { id: 'facility-2', name: 'Boutique B', category: 'Épicerie', address: 'Lomé', latitude: 6.1305, longitude: 1.2221, trust: 'confirmed', plan: 'free', productCount:  1 },
];

const products: SellerCatalogueProduct[] = [
  { id: 'product-1', facilityId: 'facility-1', facilityName: 'Boutique A', name: 'Riz 5kg', description: null, unit: 'sac', currency: 'XOF', stockLoueOmni: 3, prixOriginal: 5000, prixReduit: 4500, pourcentageReduction: 10, publicationState: 'published', availabilityState: 'en_stock', availabilityExpiresAt: null, availabilityProEligible: true },
];

describe('seller workspace map-first (V-7a', () => {
  it('derives seller-owned public pins from owned ids — the background map stays the scene', () => {
    const state = buildSellerWorkspace({ facilities: catalogFacilities, products, ownedIds: ['facility-1'], publicFacilities, selFacilityId: null });
    expect(state.ownedPublic.map((facility) => facility.id)).toEqual(['facility-1']);
    expect(state.ownedPublic[0].latitude).toBe(6.1319);
    expect(state.selFacilityId).toBe('facility-1');
  });

  it('keeps facility ops floating above the map — selection by pin/list/selector, never a route change', () => {
    const state = buildSellerWorkspace({ facilities: catalogFacilities, products, ownedIds: ['facility-2'], publicFacilities, selFacilityId: 'facility-2' });
    expect(state.selFacilityCatalogue?.name).toBe('Boutique B')
    expect(isSellerWorkspaceRoute('seller')).toBe(true);
    expect(isSellerWorkspaceRoute('facility')).toBe(false);
  });

  it('exposes the V1 ordered action labels (annexe A: état, demandes, catalogue, scanner, solde', () => {
    const labels = sellerRouteLabels();
    expect(Object.keys(labels)).toEqual(['facility', 'requests', 'catalogue', 'scanner', 'wallet']);
    expect(labels.facility).toContain('État');
    expect(labels.scanner).toContain('Scanner');
    expect(labels.wallet).toContain('Solde');
  });

  it('aggregates stock and pending signals for the workspace strip', () => {
    const state = buildSellerWorkspace({ facilities: catalogFacilities, products, ownedIds: ['facility-1'], publicFacilities, selFacilityId: null });
    expect(state.stockCount).toBe(1);
    expect(state.stockTotal).toBe(3);
    expect(state.pendingCount).toBe(0);
  });

  it('fallbacks the active facility to the first catalogue facility when none selected', () => {
    const state = buildSellerWorkspace({ facilities: catalogFacilities, products, ownedIds: ['facility-1'], publicFacilities, selFacilityId: null });
    expect(selectSellerFacility({ facilities: catalogFacilities, products, ownedIds: ['facility-1'], publicFacilities, selFacilityId: null })).toBe('facility-1');
  });

  it('menu exposes only functional seller routes', () => {
    expect(sellerMenuHasFunctionalRoutes(catalogFacilities)).toBe(true);
    expect(sellerMenuHasFunctionalRoutes([])).toBe(false);
  });
});
