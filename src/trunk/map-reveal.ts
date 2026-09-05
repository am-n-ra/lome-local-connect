import type { PublicFacility } from './types';

export type RevealPoint = Pick<PublicFacility, 'latitude' | 'longitude'>;

export type SearchFlight = {
  targetCenter: [number, number];
  targetZoom: number;
  hasResults: boolean;
};

// V1.3 §1.2: le vol cinématique est UN appel flyTo (curve 1.7) plus un
// cadrage cameraForBounds en fin de vol — plus d'étapes manuelles fragiles.

// Paliers  de zoom → libellé contextuel (spec §1.2.2(, crossfade côté UI.



const WORLD_LABEL = 'Recherche dans le monde…';

export function labelForZoom(zoom: number): string | null {
  if (zoom < 4) return WORLD_LABEL;
  if (zoom < 6) return "Afrique de l'Ouest";
  if (zoom < 9) return 'Togo';
  if (zoom < 12) return 'Région Maritime';
  if (zoom < 14) return 'Lomé';
  return null; // niveau rue — masquer le label
}

function validPoint(point: RevealPoint) {
  return Number.isFinite(point.longitude) && Number.isFinite(point.latitude);
}

export function centerOfPoints(points: readonly RevealPoint[], fallback: [number, number] = [1.22, 6.13]): [number, number] {
  const valid = points.filter(validPoint);
  if (!valid.length) return fallback;
  return [
    valid.reduce((sum, point) => sum + point.longitude, 0) / valid.length,
    valid.reduce((sum, point) => sum + point.latitude, 0) / valid.length,
  ];
}

export function boundsOfPoints(points: readonly RevealPoint[]): [[number, number], [number, number]] | null {
  const valid = points.filter(validPoint);
  if (!valid.length) return null;
  return [[Math.min(...valid.map((point) => point.longitude)), Math.min(...valid.map((point) => point.latitude))], [Math.max(...valid.map((point) => point.longitude)), Math.max(...valid.map((point) => point.latitude))]];
}

// Cible du vol(spec §1.2.1(: le centre = utilisateur + résultats, et le
// zoom cible = niveau rue 14.2 avec résultats, sinon palier ville 12.5
//(spec §1.3: aucun résultat → la caméra s'arrête au palier ville, jamais rue(。
export function computeSearchFlight(
  facilities: readonly RevealPoint[],
  userPosition?: RevealPoint | null,
  fallback: [number, number] = [1.22, 6.13],
): SearchFlight {

  const validFacilities = facilities.filter(validPoint);
  const hasUser = Boolean(userPosition && validPoint(userPosition));
  const userPoint: [number, number] | null = hasUser && userPosition ? [userPosition.longitude, userPosition.latitude] : null;
  const contextCenter: [number, number] = userPoint
    ?? (validFacilities.length ? centerOfPoints(validFacilities) : fallback);

  const resultCenter: [number, number] = validFacilities.length
    ? centerOfPoints(userPoint ? [...validFacilities, { latitude: userPosition!.latitude, longitude: userPosition!.longitude }] : validFacilities)

    : (userPoint ?? contextCenter);

  return {
    targetCenter: resultCenter,
    targetZoom: validFacilities.length ? 14.2 : 12.5,
    hasResults: validFacilities.length > 0,
  };
}

export function pointsForResultFraming(
  facilities: readonly RevealPoint[],
  userPosition?: RevealPoint | null,
): RevealPoint[] {
  return userPosition ? [...facilities, userPosition] : [...facilities];
}
