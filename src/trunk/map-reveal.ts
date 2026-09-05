import type { PublicFacility } from './types';

export type RevealPoint = Pick<PublicFacility, 'latitude' | 'longitude'>;
export type RevealStepKind = 'world' | 'continent' | 'country' | 'region' | 'city' | 'results';

export type SearchRevealStep = {
  kind: RevealStepKind;
  label: string;
  center: [number, number];
  zoom: number;
  pause: number;
};

const REVEAL_STAGES: ReadonlyArray<Pick<SearchRevealStep, 'kind' | 'label' | 'zoom' | 'pause'>> = [
  { kind: 'world', label: 'Le monde', zoom: 1.05, pause: 320 },
  { kind: 'continent', label: 'Le continent', zoom: 2.15, pause: 560 },
  { kind: 'country', label: 'Le pays', zoom: 5.35, pause: 620 },
  { kind: 'region', label: 'La région', zoom: 8.25, pause: 680 },
  { kind: 'city', label: 'La ville / zone', zoom: 11.25, pause: 720 },
];

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
  return [
    [Math.min(...valid.map((point) => point.longitude)), Math.min(...valid.map((point) => point.latitude))],
    [Math.max(...valid.map((point) => point.longitude)), Math.max(...valid.map((point) => point.latitude))],
  ];
}

export function buildSearchRevealSteps(
  facilities: readonly RevealPoint[],
  userPosition?: RevealPoint | null,
): SearchRevealStep[] {
  // La séquence se déclenche TOUJOURS, même sans résultat : sur une recherche vide
  // on vole vers la position utilisateur (ou le centre par défaut) et la grille vide
  // apparaît à la fin. C'est le comportement demandé (spec V1.3 : jamais de saut
  // direct à la grille, toujours le vol contextuel).
  const validFacilities = facilities.filter(validPoint);
  const hasUser = Boolean(userPosition && validPoint(userPosition));
  const userPoint = hasUser && userPosition ? [userPosition.longitude, userPosition.latitude] as [number, number] : null;
  // Centre de contexte (chaque étape du vol) : la position utilisateur si fournie,
  // sinon le centre des facilities, sinon Lomé par défaut.
  const contextCenter: [number, number] = userPoint
    ?? (validFacilities.length ? centerOfPoints(validFacilities) : [1.22, 6.13]);
  // Centre final de cadrage : facilities + utilisateur quand il y a des résultats,
  // sinon la position utilisateur, sinon le contexte.
  const resultCenter: [number, number] = validFacilities.length
    ? centerOfPoints(userPoint ? [...validFacilities, { latitude: userPosition!.latitude, longitude: userPosition!.longitude }] : validFacilities)
    : (userPoint ?? contextCenter);
  return [
    ...REVEAL_STAGES.map((stage) => ({ ...stage, center: contextCenter })),
    { kind: 'results', label: validFacilities.length ? 'Facilités trouvées' : 'Aucun résultat', center: resultCenter, zoom: 14.2, pause: 0 },
  ];
}

export function pointsForResultFraming(
  facilities: readonly RevealPoint[],
  userPosition?: RevealPoint | null,
): RevealPoint[] {
  return userPosition ? [...facilities, userPosition] : [...facilities];
}
