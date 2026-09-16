// COR-7c: panier de demande « avec ce vendeur », persistant pour la session.
// Un panier par facilité (vendeur) : la demande de disponibilité reste toujours
// addressée à un vendeur précis, jamais mélangée entre vendeurs.
//
// Store: Record<facilityId, productId[]> — sérialisé en sessionStorage pour
// survivre aux sheets, aux navigations et à un rechargement d'onglet, puis
// oublié à la fermeture de la session (pas de panier fantôme durable).

export type FacilityCarts = Record<string, string[]>;

export const FACILITY_CARTS_STORAGE_KEY = 'omni.v13.facilityCarts';

export function emptyCarts(): FacilityCarts {
  return {};
}

export function toggleCartProduct(carts: FacilityCarts, facilityId: string, productId: string): FacilityCarts {
  const current = carts[facilityId] ?? [];
  const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
  const copy = { ...carts };
  if (next.length === 0) delete copy[facilityId];
  else copy[facilityId] = next;
  return copy;
}

export function cartProductsFor(carts: FacilityCarts, facilityId: string): string[] {
  return carts[facilityId] ?? [];
}

export function cartProductCount(carts: FacilityCarts, facilityId: string): number {
  return (carts[facilityId] ?? []).length;
}

export function clearFacilityCart(carts: FacilityCarts, facilityId: string): FacilityCarts {
  if (!carts[facilityId]) return carts;
  const copy = { ...carts };
  delete copy[facilityId];
  return copy;
}

/** Keep only ids that still exist on the facility (products can be withdrawn). */
export function pruneCart(carts: FacilityCarts, facilityId: string, availableProductIds: readonly string[]): FacilityCarts {
  const current = carts[facilityId];
  if (!current) return carts;
  const allowed = new Set(availableProductIds);
  const next = current.filter((id) => allowed.has(id));
  return next.length === current.length ? carts : next.length === 0 ? clearFacilityCart(carts, facilityId) : { ...carts, [facilityId]: next };
}

export function parseCarts(raw: string | null): FacilityCarts {
  if (!raw) return emptyCarts();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyCarts();
    const carts: FacilityCarts = {};
    for (const [facilityId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(value)) continue;
      const ids = value.filter((item): item is string => typeof item === 'string');
      if (ids.length > 0) carts[facilityId] = Array.from(new Set(ids));
    }
    return carts;
  } catch {
    return emptyCarts();
  }
}

export function serializeCarts(carts: FacilityCarts): string {
  return JSON.stringify(carts);
}
