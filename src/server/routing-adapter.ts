/**
 * Server-side routing adapter.
 *
 * The browser must never call a routing provider directly: a client-side call
 * leaks the provider endpoint (and any key) into the bundle, cannot be cached,
 * and cannot be rate-limited. This module is the single place where Omni talks
 * to a routing engine, and it is only reachable through the authenticated-free
 * `GET /api/v2/public/routing` proxy route.
 *
 * The provider is chosen from the environment:
 *   - `MAPBOX_ACCESS_TOKEN` selects Mapbox Directions, the founder's choice for
 *     RT-D1 (2026-09-17). The token is secret and stays server-side; only this
 *     module ever reads it. `MAPBOX_DRIVING_PROFILE=driving-traffic` opts into
 *     traffic-aware ETAs (a higher-priced Mapbox tier), never enabled silently.
 *   - `OSRM_BASE_URL` selects OSRM, so the same code runs against a self-hosted
 *     engine for Togo or any OSRM-compatible host, without a code change.
 * Mapbox wins when both are configured, because it is the provider the founder
 * chose; OSRM stays supported because self-hosting remains a valid fallback.
 * When neither is set we do NOT fall back to the public demo server: its usage
 * policy restricts it to reasonable, non-commercial use and <= 1 request per
 * second, which a commercial app cannot rely on. The caller then degrades to an
 * explicitly labelled straight line.
 */

/** Pilot zone. Every Omni facility today sits inside this box (see
 * `omni-route-supply-data-evidence-2026-09-17.md`), minus 17 imported points
 * that fall in Ghana and are refused rather than routed to. */
export const PILOT_ZONE_BOUNDS = { west: 1.0, south: 5.85, east: 2.45, north: 6.5 } as const;

export type RoutePoint = { latitude: number; longitude: number };

export type RouteProfile = 'driving' | 'foot';

export interface RoutingStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export type RoutingProvider = 'mapbox' | 'osrm';

export interface RoutingResult {
  provider: RoutingProvider;
  profile: RouteProfile;
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
  /** Why the provider failed, kept so the caller can tell an operator problem
   * (bad token) from a transient one (outage) instead of flattening both into
   * one message the buyer cannot act on. */
  readonly causeKind: 'auth' | 'rate_limit' | 'unreachable' | 'timeout' | 'malformed' | 'no_route' | 'server';
  readonly providerStatus: number | null;

  constructor(message: string, causeKind: RoutingProviderError['causeKind'] = 'server', providerStatus: number | null = null) {
    super(message);
    this.name = 'RoutingProviderError';
    this.causeKind = causeKind;
    this.providerStatus = providerStatus;
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

/** Which engine will answer, or `null` when none is configured. Exported so the
 * HTTP layer and tests can reason about the choice instead of duplicating it. */
export function activeRoutingProvider(): RoutingProvider | null {
  // Mapbox first: it is the provider the founder chose for RT-D1.
  if (process.env.MAPBOX_ACCESS_TOKEN?.trim()) return 'mapbox';
  if (process.env.OSRM_BASE_URL?.trim()) return 'osrm';
  return null;
}

export function routingProviderConfigured(): boolean {
  return activeRoutingProvider() !== null;
}

/** Map an HTTP failure from a routing provider to a kind an operator can act on.
 * Exported because the classification is the part worth pinning in a test: the
 * response the buyer receives is deliberately generic either way. */
export function classifyProviderStatus(status: number): 'auth' | 'rate_limit' | 'server' {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate_limit';
  return 'server';
}

/** Bounded in-process cache keyed by provider, profile and the rounded endpoint
 * pair. Two reasons: never pay twice for the same itinerary, and keep repeated
 * UI opens from becoming repeated billed upstream calls. */
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const cache = new Map<string, { at: number; value: RoutingResult }>();

function cacheKey(provider: RoutingProvider, from: RoutePoint, to: RoutePoint, profile: string): string {
  const r = (n: number) => n.toFixed(5);
  return `${provider}:${profile}:${r(from.latitude)},${r(from.longitude)}>${r(to.latitude)},${r(to.longitude)}`;
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
  profile?: RouteProfile;
}): Promise<RoutingResult> {
  const profile = input.profile ?? 'driving';
  if (!isInsidePilotZone(input.from) || !isInsidePilotZone(input.to)) {
    throw new RoutingOutOfZoneError();
  }
  const provider = activeRoutingProvider();
  if (!provider) throw new RoutingConfigurationError();

  const key = cacheKey(provider, input.from, input.to, profile);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const value = provider === 'mapbox'
    ? await fetchFromMapbox(input.from, input.to, profile)
    : await fetchFromOsrm(input.from, input.to, profile);

  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), value });
  return value;
}

type RouteStepShape = {
  name?: string;
  distance?: number;
  duration?: number;
  maneuver?: { type?: string; modifier?: string; instruction?: string };
};
type RouteShape = {
  distance?: number;
  duration?: number;
  geometry?: { coordinates?: [number, number][] };
  legs?: { steps?: RouteStepShape[] }[];
};

/** Shared fetch with a hard timeout, mapping transport failures to a typed error
 * so the caller never mistakes "unreachable" for "no route". */
async function fetchJson(url: string, providerLabel: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    throw new RoutingProviderError(
      timedOut
        ? `The ${providerLabel} routing provider did not respond in time.`
        : `The ${providerLabel} routing provider could not be reached.`,
      timedOut ? 'timeout' : 'unreachable',
    );
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    // 401/403 almost always means the server-side token, not the buyer's request:
    // a URL-restricted token is the documented trap, since these calls carry no
    // browser Referer. Classifying it separately is what makes that findable.
    const kind = classifyProviderStatus(response.status);
    // Naming the likely cause in the message itself matters: this string is what
    // reaches the server log, and an operator reading "401" needs to know that a
    // URL restriction on the token is the usual reason.
    const hint = kind === 'auth'
      ? ' (check MAPBOX_ACCESS_TOKEN: it must have no URL restriction, since these calls send no browser Referer)'
      : '';
    throw new RoutingProviderError(`The ${providerLabel} routing provider returned ${response.status}.${hint}`, kind, response.status);
  }
  try {
    return await response.json();
  } catch {
    throw new RoutingProviderError(`The ${providerLabel} routing provider returned a malformed response.`, 'malformed');
  }
}

/** Mapbox Directions. `language=fr` makes Mapbox return its own localised,
 * human-readable `maneuver.instruction`, which reads better than anything this
 * module could compose from the raw manoeuvre vocabulary. */
async function fetchFromMapbox(from: RoutePoint, to: RoutePoint, profile: RouteProfile): Promise<RoutingResult> {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) throw new RoutingConfigurationError();

  // Traffic-aware ETAs need an opt-in: they bill at a higher Mapbox tier, so they
  // must never be switched on by a default.
  const wantTraffic = profile === 'driving' && process.env.MAPBOX_DRIVING_PROFILE?.trim() === 'driving-traffic';
  const mapboxProfile = profile === 'foot'
    ? 'mapbox/walking'
    : wantTraffic ? 'mapbox/driving-traffic' : 'mapbox/driving';

  const params = new URLSearchParams({
    geometries: 'geojson',
    overview: 'full',
    steps: 'true',
    language: 'fr',
    access_token: token,
  });
  const url = `https://api.mapbox.com/directions/v5/${mapboxProfile}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?${params.toString()}`;
  const payload = (await fetchJson(url, 'Mapbox')) as {
    code?: string;
    message?: string;
    routes?: RouteShape[];
  };

  // Mapbox reports "no route" in the body with HTTP 200, so a missing route is
  // not an HTTP failure and must be told apart from one.
  if (payload.code && payload.code !== 'Ok') {
    throw new RoutingProviderError(
      payload.code === 'NoRoute' || payload.code === 'NoSegment'
        ? 'No road itinerary could be found between these two points.'
        : payload.message?.trim() || `Mapbox refused the request (${payload.code}).`,
      payload.code === 'NoRoute' || payload.code === 'NoSegment' ? 'no_route' : 'server',
    );
  }

  const route = payload.routes?.[0];
  const coordinates = route?.geometry?.coordinates ?? [];
  if (!route || coordinates.length < 2 || typeof route.distance !== 'number' || typeof route.duration !== 'number') {
    throw new RoutingProviderError('The Mapbox routing provider returned no usable itinerary.', 'no_route');
  }

  return {
    provider: 'mapbox',
    profile,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    coordinates,
    steps: (route.legs?.[0]?.steps ?? []).map((step) => ({
      instruction: step.maneuver?.instruction?.trim() || formatStepInstruction(step),
      distanceMeters: step.distance ?? 0,
      durationSeconds: step.duration ?? 0,
    })),
  };
}

/** OSRM. Kept because self-hosting for Togo remains a valid option and costs
 * nothing to support. OSRM returns no text instructions, so the local formatter
 * composes them. */
async function fetchFromOsrm(from: RoutePoint, to: RoutePoint, profile: RouteProfile): Promise<RoutingResult> {
  const baseUrl = process.env.OSRM_BASE_URL?.trim();
  if (!baseUrl) throw new RoutingConfigurationError();

  const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const url = `${baseUrl.replace(/\/+$/, '')}/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=true`;
  const payload = (await fetchJson(url, 'OSRM')) as { routes?: RouteShape[] };

  const route = payload.routes?.[0];
  const coordinates = route?.geometry?.coordinates ?? [];
  if (!route || coordinates.length < 2 || typeof route.distance !== 'number' || typeof route.duration !== 'number') {
    throw new RoutingProviderError('The OSRM routing provider returned no usable itinerary.', 'no_route');
  }

  return {
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
}

/** Compose a short French instruction from an OSRM manoeuvre. Used for OSRM, and
 * as the fallback when Mapbox omits its own `instruction` string. */
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