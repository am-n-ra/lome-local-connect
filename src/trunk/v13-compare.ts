import type { FacilityDetail, PublicFacility } from './types';

export type CompareSort = 'match' | 'distance' | 'price' | 'remise';

const TRUST_RANK: Record<PublicFacility['trust'], number> = {
  unclaimed: 0,
  unconfirmed: 1,
  confirmed: 2,
};

function minProductPrice(detail: FacilityDetail | null | undefined): number {
  if (!detail || !detail.products || detail.products.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  let min = Number.POSITIVE_INFINITY;
  for (const product of detail.products) {
    if (product.prixReduit < min) {
      min = product.prixReduit;
    }
  }
  return min;
}

function maxProductDiscount(detail: FacilityDetail | null | undefined): number {
  if (!detail || !detail.products || detail.products.length === 0) {
    return -1;
  }
  let max = -1;
  for (const product of detail.products) {
    if (product.pourcentageReduction > max) {
      max = product.pourcentageReduction;
    }
  }
  return max;
}

export function compareFacilities(
  a: PublicFacility,
  b: PublicFacility,
  sort: CompareSort,
  details: Record<string, FacilityDetail | null>,
): number {
  switch ( sort) {
    case 'distance':
      return Math.abs(a.latitude - b.latitude) + Math.abs(a.longitude - b.longitude);
    case 'price': {
      const pa = minProductPrice(details[a.id]);
      const pb = minProductPrice(details[b.id]);
      return pa - pb;
    }
    case 'remise': {
      const ra = maxProductDiscount(details[a.id]);
      const rb = maxProductDiscount(details[b.id]);
      return rb - ra;
    }
    case 'match':
    default: {
      const ta = TRUST_RANK[a.trust];
      const tb = TRUST_RANK[b.trust];
      return tb - ta;
    }
  }
}
