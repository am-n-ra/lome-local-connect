export type MapProjection = 'globe' | 'mercator';

export const GLOBE_TO_MERCATOR_ZOOM = 2.4;

export function projectionForZoom(zoom: number): MapProjection {
  return Number.isFinite(zoom) && zoom < GLOBE_TO_MERCATOR_ZOOM ? 'globe' : 'mercator';
}

export function projectionChanged(previous: MapProjection, zoom: number): boolean {
  return previous !== projectionForZoom(zoom);
}

/** Country and water-body names are intentionally omitted from the fully
 * zoomed-out globe. They return with the mercator map at the existing
 * globe-to-local threshold; continent/ocean geometry remains provider-owned.
 */
export function globeContextLabelsVisibleForZoom(zoom: number): boolean {
  return projectionForZoom(zoom) === 'mercator';
}

// Camera-input guard. A single poisoned flyTo/easeTo (NaN center or zoom) kills the
// MapLibre transform, and every subsequent unproject/getBounds/resize throws — the prod
// NaN flood. Every computed camera command in TrunkMap goes through safeEaseTo/safeFlyTo:
// insane input is skipped (false), a sick engine is caught (false), never thrown.

export type CameraCenter = [number, number]; // [lng, lat]

export function isFiniteCameraCenter(center: unknown): center is CameraCenter {
  if (!Array.isArray(center) || center.length !== 2) return false;
  const [lng, lat] = center;
  return typeof lng === 'number' && typeof lat === 'number'
    && Number.isFinite(lng) && Number.isFinite(lat)
    && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

export function isFiniteCameraZoom(zoom: unknown): zoom is number {
  return typeof zoom === 'number' && Number.isFinite(zoom) && zoom >= 0 && zoom <= 22;
}

export interface CameraCommandOptions {
  center?: unknown;
  zoom: unknown;
  duration?: number;
  essential?: boolean;
  bearing?: number;
  pitch?: number;
  speed?: number;
  curve?: number;
}

// The engine stays `unknown` on purpose: Map and FallbackMapSurface disagree on option
// shapes (strict variance rejects a shared method interface), so the single contained cast
// below is the only friction point. What matters — validation before invocation — is pure
// and unit-tested; the cast cannot invent a call, only forward a validated one.
interface CameraCommandSink {
  easeTo(options: Record<string, unknown>): void;
  flyTo(options: Record<string, unknown>): void;
}

function saneCommand(options: CameraCommandOptions): boolean {
  if (options.center !== undefined && !isFiniteCameraCenter(options.center)) return false;
  return isFiniteCameraZoom(options.zoom);
}

export function safeEaseTo(map: unknown, options: CameraCommandOptions): boolean {
  if (!saneCommand(options)) return false;
  try {
    (map as CameraCommandSink).easeTo({ ...options });
    return true;
  } catch {
    return false;
  }
}

export function safeFlyTo(map: unknown, options: CameraCommandOptions): boolean {
  if (!saneCommand(options)) return false;
  try {
    (map as CameraCommandSink).flyTo({ ...options });
    return true;
  } catch {
    return false;
  }
}
