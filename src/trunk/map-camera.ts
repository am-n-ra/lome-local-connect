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

/**
 * Bottom camera padding from the active sheet height. The map must never be squeezed
 * below a usable band: a bottom padding larger than the viewport height makes MapLibre's
 * globe transform build a singular matrix, and the next _calcMatrices throws `null[0]`
 * on every frame. The previous inline formula reached `innerHeight - 110` (~87% of the
 * height) while a keyboard was opening, recomputed continuously — the exact churn that
 * crashed. Cap the padding so at least a real band (≥45% of the viewport, and never less
 * than 200px) stays visible.
 */
export function bottomPaddingFor(sheetHeight: number, viewportHeight: number): number {
  if (!(sheetHeight > 0) || !(viewportHeight > 0)) return 0;
  const maxBottom = Math.max(0, viewportHeight - Math.max(200, viewportHeight * 0.45));
  return Math.min(sheetHeight + 56, maxBottom);
}

/** True when the camera can be read back as finite numbers (a poisoned transform cannot). */
export function cameraIsReadable(center: unknown, zoom: unknown): boolean {
  return isFiniteCameraCenter(center) && isFiniteCameraZoom(zoom);
}
