export type MapProjection = 'globe' | 'mercator';

export const GLOBE_TO_MERCATOR_ZOOM = 2.4;

export function projectionForZoom(zoom: number): MapProjection {
  return Number.isFinite(zoom) && zoom < GLOBE_TO_MERCATOR_ZOOM ? 'globe' : 'mercator';
}

export function projectionChanged(previous: MapProjection, zoom: number): boolean {
  return previous !== projectionForZoom(zoom);
}

/** Country names are intentionally omitted from the fully zoomed-out globe.
 * Local/country context labels return with the mercator map at the existing
 * globe-to-local threshold; continent/ocean labels remain owned by Positron.
 */
export function countryLabelsVisibleForZoom(zoom: number): boolean {
  return projectionForZoom(zoom) === 'mercator';
}
