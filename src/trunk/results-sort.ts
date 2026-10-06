import type { PublicFacility } from './types';

/**
 * SEARCH-01 — how the buyer's result list can be ordered. The maquette exposes
 * four chips (Meilleur match / Plus proche / Prix le plus bas / Remise Omni);
 * the app was missing them entirely.
 */
export type ResultsSortKey = 'best' | 'near' | 'price' | 'disc';

export const RESULTS_SORTS: readonly { key: ResultsSortKey; label: string }[] = [
  { key: 'best', label: 'Meilleur match' },
  { key: 'near', label: 'Plus proche' },
  { key: 'price', label: 'Prix le plus bas' },
  { key: 'disc', label: 'Remise Omni' },
];

export type GeoPoint = { latitude: number; longitude: number };

/** Haversine distance in metres — same basis as the routing distance label. */
export function metersBetween(a: GeoPoint, b: GeoPoint): number {
  const R = 6_371_000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Orders results for display.
 *
 * - `best` : the server's own order (viewport proximity + sponsored boost) — left untouched.
 * - `near` : nearest first. **Inert without a user position** — we never invent a distance.
 * - `price`: cheapest real entry price first. A place with no published price sinks to the
 *            bottom (never treated as 0, which would falsely rank it first).
 * - `disc` : best Omni discount first.
 *
 * Ties keep the server's relative order (a stable, index-based tie-break). Prices are only
 * compared when their currencies match — D-LOC-3 forbids silently comparing two currencies.
 */
export function sortResults(
  results: readonly PublicFacility[],
  key: ResultsSortKey,
  userPosition: GeoPoint | null,
): PublicFacility[] {
  if (key === 'best') return [...results];
  const indexed = results.map((facility, index) => ({ facility, index }));

  const tie = (a: { index: number }, b: { index: number }) => a.index - b.index;

  if (key === 'near') {
    if (!userPosition) return [...results];
    indexed.sort((a, b) =>
      metersBetween(userPosition, a.facility) - metersBetween(userPosition, b.facility) || tie(a, b));
  } else if (key === 'price') {
    indexed.sort((a, b) => {
      const pa = a.facility.minPriceMinor;
      const pb = b.facility.minPriceMinor;
      const hasA = typeof pa === 'number';
      const hasB = typeof pb === 'number';
      if (!hasA && !hasB) return tie(a, b);
      if (!hasA) return 1;
      if (!hasB) return -1;
      const ca = (a.facility.priceCurrency ?? 'XOF').toUpperCase();
      const cb = (b.facility.priceCurrency ?? 'XOF').toUpperCase();
      if (ca !== cb) return tie(a, b); // incomparable — keep the server order
      return pa - pb || tie(a, b);
    });
  } else {
    indexed.sort((a, b) =>
      (b.facility.maxDiscountPercent ?? 0) - (a.facility.maxDiscountPercent ?? 0) || tie(a, b));
  }

  return indexed.map((entry) => entry.facility);
}
