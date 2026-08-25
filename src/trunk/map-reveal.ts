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
  const validFacilities = facilities.filter(validPoint);
  if (!validFacilities.length) return [];
  const target = centerOfPoints(userPosition ? [...validFacilities, userPosition] : validFacilities);
  return [
    ...REVEAL_STAGES.map((stage) => ({ ...stage, center: target })),
    { kind: 'results', label: 'Facilités trouvées', center: target, zoom: 14.2, pause: 0 },
  ];
}

export function pointsForResultFraming(
  facilities: readonly RevealPoint[],
  userPosition?: RevealPoint | null,
): RevealPoint[] {
  return userPosition ? [...facilities, userPosition] : [...facilities];
}
