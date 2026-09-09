// Helpers purs extraits de la legacy TrunkApp (decommission V-5( pour préserver la
// logique des tests unitaires existants — aucune dépendance React, pur et testable.
import type { SavedSearch } from './types';

/** Panels historiques de l'UI legacy — utilisé par resolveEscape (tests existants(. */
export type LegacyPanel =
  | 'none' | 'account' | 'auth' | 'facility' | 'claim' | 'availability' | 'buyer-requests'
  | 'seller-entry' | 'field-pilot' | 'inbox' | 'reviewer' | 'admin-roles' | 'admin-console'
  | 'admin-audit' | 'qr-scan' | 'buyer-pro-plans' | 'onboarding' | 'wallet' | 'company-onboarding'
  | 'seller-scanner' | 'instore-scan' | 'search' | 'saved-searches';

export type EscapeTarget = 'facility' | 'seller-queue' | 'nearby-results' | 'close' | 'none';

export function resolveEscape(panel: LegacyPanel, hasSellerRequest: boolean, nearbyOpen = false): EscapeTarget {
  if (panel === 'availability') return 'facility';
  if (panel === 'seller-entry' && hasSellerRequest) return 'seller-queue';
  if (panel === 'field-pilot' || panel === 'claim' || panel === 'inbox' || panel === 'reviewer') return 'close';
  if (panel !== 'none') return 'close';
  if (nearbyOpen) return 'nearby-results';
  return 'none';
}

export type SellerEntryIntent =
  | { kind: 'open-seller-boundary' }
  | { kind: 'authenticate'; returnTo: 'seller-entry' };

export function resolveSellerEntry(sessionUserId: string | null): SellerEntryIntent {
  return sessionUserId ? { kind: 'open-seller-boundary' } : { kind: 'authenticate', returnTo: 'seller-entry' };
}

/** Parse l'identifiant facilité d'un payload QR (URL, query string ou ID brut( — G-5(T-10d. */
export function parseFacilityIdFromQr(payload: string): string | null {
  const trimmed = payload.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const fac = url.searchParams.get('facility');
      if (fac) return fac;
    }
  } catch {
    // Ignores les échecs de parsing URL
  }

  const match = trimmed.match(/(?:^|[?&])facility=([^&#\s]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  if (/^[A-Za-z0-9_-]{1,120}$/.test(trimmed) && !trimmed.includes(' ')) {
    return trimmed;

  }
  return null;
}

/** Résumé des contraintes d'une recherche enregistrée (B19, alertes(. */
export function savedSearchConstraintSummary(search: SavedSearch): string {
  const parts: string[] = [];
  const c = search.constraints ?? {};
  const radius = c.radiusKm ?? c.radius ?? c.distanceKm;
  if (typeof radius === 'number') parts.push(`≤ ${radius} km`);
  const maxPrice = c.maxPrice ?? c.budgetMax ?? c.priceMax;
  if (typeof maxPrice === 'number') parts.push(`≤ ${maxPrice.toLocaleString('fr-FR')} FCFA`);
  const open = c.openNow ?? c.open;
  if (open === true) parts.push('Ouvert');
  if (parts.length === 0) return 'Toute disponibilité';
  return parts.join(' · ');
}

/** Protected action captured before the access portal: automatic resume after auth+onboarding. */
export type PendingAction =
  | { kind: 'intent'; returnTo: 'flow'; facilityId: string; facilityName: string; productId: string; productName: string; quantity: number }
  | { kind: 'seller-entry'; returnTo: 'seller-entry' }
  | { kind: 'claim'; returnTo: 'facility'; facilityId: string }
  | { kind: 'search'; returnTo: 'search' };

export function describePendingAction(action: PendingAction | null): string {
  switch (action?.kind) {
    case 'intent': return 'Secure checkout';
    case 'seller-entry': return 'Seller space';
    case 'claim': return 'Facility claim';
    case 'search': return 'Search';
    default: return '';
  }
}

export type PendingResume =
  | { sheet: 'flow'; facilityId: string; facilityName: string; productId: string; productName: string }
  | { sheet: 'search' }
  | { sheet: 'seller' }
  | { sheet: 'facility'; facilityId: string }
  | { sheet: 'none' };

export function pendingActionResume(action: PendingAction | null): PendingResume {

  if (action?.kind === 'intent') {
    return { sheet: 'flow', facilityId: action.facilityId, facilityName: action.facilityName, productId: action.productId, productName: action.productName };
  }
  if (action?.kind === 'search') return { sheet: 'search' };
  if (action?.kind === 'seller-entry') return { sheet: 'seller' };
  if (action?.kind === 'claim') return { sheet: 'facility', facilityId: action.facilityId };
  return { sheet: 'none' };
}