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
  | { kind: 'search'; returnTo: 'search' };

export function describePendingAction(action: PendingAction | null): string {
  switch (action?.kind) {
    case 'intent': return 'Secure checkout';
    case 'seller-entry': return 'Seller space';
    case 'search': return 'Search';
    default: return '';
  }
}

export type PendingResume =
  | { sheet: 'flow'; facilityId: string; facilityName: string; productId: string; productName: string }
  | { sheet: 'search' }
  | { sheet: 'seller' }
  | { sheet: 'none' };

export function pendingActionResume(action: PendingAction | null): PendingResume {

  if (action?.kind === 'intent') {
    return { sheet: 'flow', facilityId: action.facilityId, facilityName: action.facilityName, productId: action.productId, productName: action.productName };
  }
  if (action?.kind === 'search') return { sheet: 'search' };
  if (action?.kind === 'seller-entry') return { sheet: 'seller' };
 return { sheet: 'none' };
}

export function sortProductsStockFirst<T extends { stockLoueOmni: number }>(products: T[]): T[] {
  return [...products].sort((a2, b2) =>
    Number(b2.stockLoueOmni >  ​0) - Number(a2.stockLoueOmni >  ​0)
  );
}

// COR-7b: après une recherche, la fiche facilité doit mettre en avant le produit
// réellement recherché (badge + tri en tête). Matching simple et prévisible :
// le nom du produit contient un mot significatif de la requête (>= 3 lettres),
// sinon le nom complet contient la requête. Retourne l'id à surligner ou null.
const SEARCH_STOPWORDS = new Set(['pour', 'avec', 'dans', 'chez', 'les', 'des', 'une', 'mes', 'mon', 'sur', 'pas', 'que']);

export function highlightSearchedProduct<T extends { id: string; name: string }>(products: readonly T[], query: string): string | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return null;
  const tokens = normalizedQuery.split(/\s+/).filter((token) => token.length >= 3 && !SEARCH_STOPWORDS.has(token));
  let best: { id: string; score: number; length: number } | null = null;
  for (const product of products) {
    const name = product.name.toLowerCase();
    let score = name === normalizedQuery ? 1000 : name.includes(normalizedQuery) ? 100 : 0;
    for (const token of tokens) if (name.includes(token)) score += 10;
    if (score > 0 && (!best || score > best.score || (score === best.score && name.length < best.length))) {
      best = { id: product.id, score, length: name.length };
    }
  }
  return best?.id ?? null;
}

export interface WalletBucketTotals { creditMinor: number; spendMinor: number }
/**
 * S-01 — rend les caractéristiques d'une offre en paires libellé/valeur, dans l'ordre du Seed.
 * Une caractéristique non déclarée (`null`) est omise : on n'invente jamais une valeur.
 */
export function offerCharacteristics(product: {
  positionKind?: string | null;
  uniquenessKind?: string | null;
  handoverKind?: string | null;
  priceKind?: string | null;
  conditionKind?: string | null;
}): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  const push = (label: string, value: string | null | undefined) => { if (value) out.push({ label, value }); };
  push('Position', ({ fixe: 'Fixe · sur place', mobile: 'Mobile · se déplace', immaterielle: 'Immatérielle' } as Record<string, string>)[product.positionKind ?? '']);
  push('Unicité', ({ renouvelable: 'Offre renouvelable', piece_unique: 'Pièce unique — disparaît après vente' } as Record<string, string>)[product.uniquenessKind ?? '']);
  push('Retrait / livraison', ({ retrait: 'Retrait', livraison: 'Livraison', immateriel: 'Immatériel (en ligne)' } as Record<string, string>)[product.handoverKind ?? '']);
  push('État', ({ neuf: 'Neuf', occasion: 'Occasion' } as Record<string, string>)[product.conditionKind ?? '']);
  push('Prix', ({ fixe: 'Fixe', negociable: 'À négocier' } as Record<string, string>)[product.priceKind ?? '']);
  return out;
}

export function walletBucketTotals(entries: Array<{ kind: string; amountMinor: number }>): WalletBucketTotals {
  let creditMinor =  ​0;let spendMinor =  ​0;
  for (const e of entries) {
    if ((['recharge', 'bonus_grant', 'reversal', 'coupon_credit'] as string[]).includes(e.kind)) creditMinor += e.amountMinor; else spendMinor += e.amountMinor;

  }
  return { creditMinor, spendMinor };
}
export function trapDrawerFocus(event: { key: string; shiftKey: boolean; preventDefault(): void; currentTarget: { querySelectorAll(selectors: string): NodeListOf<Element> } }): void {
  const selectors = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  if (event.key !== 'Tab') return;
  const focusables = Array.from(event.currentTarget.querySelectorAll(selectors)).filter((el) => !el.hasAttribute('hidden'));
  if (focusables.length === 0) return;
  const first = focusables[0] as HTMLElement;
  const last = focusables[focusables.length - 1] as HTMLElement;

  if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
 event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (document.activeElement === last)) { event.preventDefault(); first.focus(); }
}
// S-32 — libellé d'intégrité/réputation de l'OFFRE, aligné sur la maquette.
// `null` de réputation => « muted » honnête, jamais « 0 ★ » (qui se lirait comme une mauvaise note).
const INTEGRITY_CHECK_LABELS: Record<string, string> = {
  visuel: 'visuel manquant',
  prix: 'prix à 0',
  description: 'description trop courte',
  doublon: 'doublon possible',
};

export function offerTrustLabel(input: {
  integrity?: { state: string; failed: readonly string[] } | undefined;
  reputation?: { count: number; score: number | null } | undefined;
}): { text: string; muted: boolean; ok: boolean; missing: string[] } {
  const rep = input.reputation;
  const repText = rep && rep.count > 0 && rep.score !== null ? `${rep.score.toFixed(1).replace('.', ',')} ★ · ${rep.count} avis` : '';
  const integrity = input.integrity;
  const integrityText =
    integrity === undefined
      ? ''
      : integrity.state === 'ok'
        ? 'intégrité ✓'
        : integrity.state === 'partielle'
          ? 'intégrité partielle'
          : 'intégrité insuffisante';
  const missing = (integrity?.failed ?? []).map((check) => INTEGRITY_CHECK_LABELS[check] ?? check);
  const text = [repText, integrityText].filter((part) => part !== '').join(' · ');
  return {
    text: text === '' ? 'pas encore d’avis' : text,
    muted: repText === '' && (integrity === undefined || integrity.state !== 'ok'),
    ok: integrity !== undefined && integrity.state === 'ok',
    missing,
  };
}

