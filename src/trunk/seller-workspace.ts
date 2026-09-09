// V-7a (T5): seller workspace, map-first — pure découpage logique,
// extrait du  découpage de la maquette V1.3 (#SELLER home sheet dense)→ annexe A+K OMNI_MASTER_PRODUCT_INTERFACE.
import type { PublicFacility, SellerCatalogueFacility, SellerCatalogueProduct } from './types';

export interface SellerWorkspaceInput {
  facilities: SellerCatalogueFacility[];
  products: SellerCatalogueProduct[];
  ownedIds: string[];
  publicFacilities: PublicFacility[];
  selFacilityId?: string | null;
}

export interface SellerWorkspaceState {
  ownedPublic: PublicFacility[];
  selFacilityId: string | null;
  selFacilityCatalogue: SellerCatalogueFacility | null;
  stockCount: number;
  pendingCount: number;
  stockTotal: number;
  activeRoutes: readonly string[];
  labels: Record<string, string>;
}

const ROUTE_ORDER = ['facility', 'requests', 'catalogue', 'scanner', 'wallet'] as const;
type RouteKind = (typeof ROUTE_ORDER)[number];

const ROUTE_LABELS: Record<RouteKind, string> = {
  facility: 'État de la facilité',
  requests: 'Demandes reçues',
  catalogue: 'Catalogue & coupon',
  scanner: 'Scanner QR',
  wallet: 'Solde / recharge',
};

/** V1 actions ordonnées (annexe A): état, demandes, catalogue/coupon, scanner, solde. */
  export function sellerRouteLabels(): Record<string, string> {
  return { ...ROUTE_LABELS };
}

/** Montage : les facilities du vendeur sont la scène; le public n'est pas un décor. */
  export function buildSellerWorkspace(input: SellerWorkspaceInput): SellerWorkspaceState {
  const ownedSet = new Set(input.ownedIds);
  const ownedPublic = input.publicFacilities.filter((facility) => ownedSet.has(facility.id));
  const wanted = input.selFacilityId ?? (input.facilities[0]?.id ?? null);
  const sel = input.facilities.find((facility) => facility.id === wanted);
  const selFacilityId = sel ? sel.id : (input.facilities[0]?.id ?? null);
  const selFacilityCatalogue = input.facilities.find((facility) => facility.id === selFacilityId) ?? null;
  const stockCount = input.products.filter((product) => product.publicationState === 'published' && (product.availabilityState === 'en_stock' || product.availabilityState === 'verifie')).length;
  const pendingCount = input.products.filter((product) => product.publicationState === 'draft' || product.publicationState === 'pending_validation').length;
  const stockTotal = input.products.reduce((sum, product) => sum + product.stockLoueOmni, 0);
  const activeRoutes: readonly string[] = ROUTE_ORDER.filter((route) => {
    if (route === 'requests') return true;
    return true;
  });
  const labels = sellerRouteLabels();
  return { ownedPublic, selFacilityId, selFacilityCatalogue, stockCount, pendingCount, stockTotal, activeRoutes, labels };
}

/** Sélection par pin/list/sélecteur — jamais un changement de route. */
  export function selectSellerFacility(input: SellerWorkspaceInput): string | null {
  return buildSellerWorkspace(input).selFacilityId;
}

/** Le canal centré du dock seller = l'espace de travail vendeur (map-first). */
  export function isSellerWorkspaceRoute(target: string): boolean {
  return target === 'seller';
}

/** Les entrées du menu seller ne sont que des routes fonctionnelles (annexe A. */
  export function sellerMenuHasFunctionalRoutes(facilities: unknown[]): boolean {
  return facilities.length >  0;
}