/**
 * Server-side routing adapter.
 *
 * The browser must never call a routing provider directly: a client-side call
 * leaks the provider endpoint (and any key) into the bundle, cannot be cached,
 * and cannot be rate-limited. This module is the single place where Omni talks
 * to a routing engine, and it is only reachable through the authenticated-free
 * `GET /api/v2/public/routing` proxy route.
 *
 * The provider is chosen by `OSRM_BASE_URL` so the same code runs against a
 * self-hosted OSRM for Togo or any OSRM-compatible host, without a code change.
 * When it is unset we do NOT fall back to the public demo server: its usage
 * policy restricts it to reasonable, non-commercial use and <= 1 request per
 * second, which a commercial app cannot rely on. The caller then degrades to an
 * explicitly labelled straight line.
 */

/** Pilot zone. Every Omni facility today sits inside this box (see
 * `omni-route-supply-data-evidence-2026-09-17.md`), minus 17 imported points
 * that fall in Ghana and are refused rather than routed to. */
export const PILOT_ZONE_BOUNDS = { west: 1.0, south: 5.85, east: 2.45, north: 6.5 } as const;

export type RoutePoint = { latitude: number; longitude: number };

export interface RoutingStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RoutingResult {
  provider: 'osrm';
  profile: 'driving' | 'foot';
  distanceMeters: number;
  durationSeconds: number;
  /** GeoJSON [lng, lat] pairs, ready for the map source. */
  coordinates: [number, number][];
  steps: RoutingStep[];
}

export class RoutingOutOfZoneError extends Error {
  constructor() {
    super('This facility is outside the Omni pilot zone, so a road itinerary is not offered.');
    this.name = 'RoutingOutOfZoneError';
  }
}

export class RoutingConfigurationError extends Error {
  constructor() {
    super('Routing provider is not configured.');
    this.name = 'RoutingConfigurationError';
  }
}

export class RoutingProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoutingProviderError';
  }
}

export function isInsidePilotZone(point: RoutePoint): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.longitude >= PILOT_ZONE_BOUNDS.west &&
    point.longitude <= PILOT_ZONE_BOUNDS.east &&
    point.latitude >= PILOT_ZONE_BOUNDS.south &&
    point.latitude <= PILOT_ZONE_BOUNDS.north
  );
}

export function routingProviderConfigured(): boolean {
  return Boolean(process.env.OSRM_BASE_URL?.trim());
}

/** Bounded in-process cache keyed by the rounded endpoint pair. Two reasons:
 * never pay twice for the same itinerary, and keep repeated UI opens from
 * becoming repeated upstream calls. */
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const cache = new Map<string, { at: number; value: RoutingResult }>();

function cacheKey(from: RoutePoint, to: RoutePoint, profile: string): string {
  const r = (n: number) => n.toFixed(5);
  return `${profile}:${r(from.latitude)},${r(from.longitude)}>${r(to.latitude)},${r(to.longitude)}`;
}

export function clearRoutingCache(): void {
  cache.clear();
}

const REQUEST_TIMEOUT_MS = 6000;

/**
 * Fetch a road itinerary. Throws a typed error rather than returning a silent
 * straight line, so the HTTP layer can report the true reason and the client
 * can label its fallback honestly.
 */
export async function fetchRoadRoute(input: {
  from: RoutePoint;
  to: RoutePoint;
  profile?: 'driving' | 'foot';
}): Promise<RoutingResult> {
  const profile = input.profile ?? 'driving';
  if (!isInsidePilotZone(input.from) || !isInsidePilotZone(input.to)) {
    throw new RoutingOutOfZoneError();
  }
  const baseUrl = process.env.OSRM_BASE_URL?.trim();
  if (!baseUrl) throw new RoutingConfigurationError();

  const key = cacheKey(input.from, input.to, profile);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const coords = `${input.from.longitude},${input.from.latitude};${input.to.longitude},${input.to.latitude}`;
  const url = `${baseUrl.replace(/\/+$/, '')}/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=true`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    throw new RoutingProviderError(
      error instanceof Error && error.name === 'AbortError'
        ? 'The routing provider did not respond in time.'
        : 'The routing provider could not be reached.',
    );
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new RoutingProviderError(`The routing provider returned ${response.status}.`);

  const payload = (await response.json()) as {
    routes?: { distance?: number; duration?: number; geometry?: { coordinates?: [number, number][] }; legs?: { steps?: { name?: string; distance?: number; duration?: number; maneuver?: { type?: string; modifier?: string } }[] }[] }[];
  };
  const route = payload.routes?.[0];
  const coordinates = route?.geometry?.coordinates ?? [];
  if (!route || coordinates.length < 2 || typeof route.distance !== 'number' || typeof route.duration !== 'number') {
    throw new RoutingProviderError('The routing provider returned no usable itinerary.');
  }

  const value: RoutingResult = {
    provider: 'osrm',
    profile,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    coordinates,
    steps: (route.legs?.[0]?.steps ?? []).map((step) => ({
      instruction: formatStepInstruction(step),
      distanceMeters: step.distance ?? 0,
      durationSeconds: step.duration ?? 0,
    })),
  };
  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** Turn an OSRM step into a short French instruction. OSRM's own `osrm-text-
 * instructions` package exists, but it is not a project dependency and this
 * covers the manoeuvre vocabulary the Lomé network actually produces. */
export function formatStepInstruction(step: { name?: string; maneuver?: { type?: string; modifier?: string } }): string {
  const modifier = step.maneuver?.modifier;
  const name = step.name?.trim();
  const on = name ? ` sur ${name}` : '';
  switch (step.maneuver?.type) {
    case 'depart': return name ? `Partez${on}` : 'Partez';
    case 'arrive': return 'Vous êtes arrivé';
    case 'roundabout': return name ? `Au rond-point, continuez${on}` : 'Au rond-point, continuez';
    case 'merge': return `Insérez-vous${on}`;
    case 'fork': return `À la bifurcation, gardez${modifier === 'left' ? ' la gauche' : ' la droite'}`;
    case 'end of road': return `Au bout de la route, tournez${modifier === 'left' ? ' à gauche' : ' à droite'}${on}`;
    case 'turn': {
      const dir = modifier === 'left' || modifier === 'sharp left' || modifier === 'slight left'
        ? ' à gauche'
        : modifier === 'right' || modifier === 'sharp right' || modifier === 'slight right'
          ? ' à droite'
          : '';
      return `Tournez${dir}${on}`;
    }
    case 'new name':
    case 'continue':
    default: return name ? `Continuez${on}` : 'Continuez tout droit';
  }
}

export function formatDistanceLabel(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function formatDurationLabel(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}