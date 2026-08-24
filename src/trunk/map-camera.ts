export type MapProjection = 'globe' | 'mercator';

export const GLOBE_TO_MERCATOR_ZOOM = 2.4;

export function projectionForZoom(zoom: number): MapProjection {
  return Number.isFinite(zoom) && zoom < GLOBE_TO_MERCATOR_ZOOM ? 'globe' : 'mercator';
}

export function projectionChanged(previous: MapProjection, zoom: number): boolean {
  return previous !== projectionForZoom(zoom);
}
