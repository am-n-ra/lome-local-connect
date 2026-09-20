import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PILOT_ZONE_BOUNDS,
  RoutingConfigurationError,
  RoutingOutOfZoneError,
  RoutingProviderError,
  clearRoutingCache,
  fetchRoadRoute,
  formatDistanceLabel,
  formatDurationLabel,
  formatStepInstruction,
  isInsidePilotZone,
  routingProviderConfigured,
  activeRoutingProvider,
} from './routing-adapter';

const OSRM_OK = {
  routes: [{
    distance: 5390.2,
    duration: 342,
    geometry: { coordinates: [[1.2138, 6.1315], [1.218, 6.15], [1.2226, 6.1655]] },
    legs: [{
      steps: [
        { name: 'Rue de L\'Avenir', distance: 820, duration: 60, maneuver: { type: 'depart' } },
        { name: 'Boulevard du 13 Janvier', distance: 4570, duration: 282, maneuver: { type: 'turn', modifier: 'left' } },
      ],
    }],
  }],
};

const ADAWLATO = { latitude: 6.1315, longitude: 1.2138 };
const TOKOIN = { latitude: 6.1655, longitude: 1.2226 };

/** Real coordinates taken from the 17 out-of-zone facilities verified in the
 * canonical branch (see omni-route-supply-data-evidence-2026-09-17.md). */
const GHANA_POINTS = [
  { latitude: 6.3418223, longitude: -1.0013403, name: 'Total' },
  { latitude: 6.0923585, longitude: -0.8399508, name: 'Goil' },
  { latitude: 6.1165795, longitude: -0.0041448, name: 'Galaxy Oil' },
];

describe('routing pilot-zone guard', () => {
  it('accepts the coordinates of the Lomé pilot zone', () => {
    expect(isInsidePilotZone(ADAWLATO)).toBe(true);
    expect(isInsidePilotZone(TOKOIN)).toBe(true);
    expect(isInsidePilotZone({ latitude: PILOT_ZONE_BOUNDS.south, longitude: PILOT_ZONE_BOUNDS.west })).toBe(true);
    expect(isInsidePilotZone({ latitude: PILOT_ZONE_BOUNDS.north, longitude: PILOT_ZONE_BOUNDS.east })).toBe(true);
  });

  it('refuses every real out-of-zone facility the database actually holds', () => {
    for (const point of GHANA_POINTS) {
      expect(isInsidePilotZone(point), `${point.name} must be outside the pilot zone`).toBe(false);
    }
  });

  it('refuses non-finite coordinates rather than treating them as origin', () => {
    expect(isInsidePilotZone({ latitude: Number.NaN, longitude: 1.2 })).toBe(false);
    expect(isInsidePilotZone({ latitude: 6.1, longitude: Number.POSITIVE_INFINITY })).toBe(false);
  });
});

describe('routing adapter configuration', () => {
  const original = process.env.OSRM_BASE_URL;
  const originalToken = process.env.MAPBOX_ACCESS_TOKEN;
  afterEach(() => {
    if (original === undefined) delete process.env.OSRM_BASE_URL;
    else process.env.OSRM_BASE_URL = original;
    if (originalToken === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
    else process.env.MAPBOX_ACCESS_TOKEN = originalToken;
    clearRoutingCache();
  });

  it('reports the provider as unconfigured when no base URL is set', () => {
    delete process.env.OSRM_BASE_URL;
    delete process.env.MAPBOX_ACCESS_TOKEN;
    expect(routingProviderConfigured()).toBe(false);
  });

  it('refuses to fall back to a public demo server when unconfigured', async () => {
    delete process.env.OSRM_BASE_URL;
    delete process.env.MAPBOX_ACCESS_TOKEN;
    await expect(fetchRoadRoute({ from: ADAWLATO, to: TOKOIN })).rejects.toBeInstanceOf(RoutingConfigurationError);
  });

  it('rejects an out-of-zone destination before any provider call', async () => {
    process.env.OSRM_BASE_URL = 'https://routing.example.test';
    const spy = vi.spyOn(globalThis, 'fetch');
    await expect(fetchRoadRoute({ from: ADAWLATO, to: GHANA_POINTS[0] })).rejects.toBeInstanceOf(RoutingOutOfZoneError);
    await expect(fetchRoadRoute({ from: GHANA_POINTS[1], to: TOKOIN })).rejects.toBeInstanceOf(RoutingOutOfZoneError);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('routing provider selection', () => {
  const originalToken = process.env.MAPBOX_ACCESS_TOKEN;
  const originalOsrm = process.env.OSRM_BASE_URL;
  afterEach(() => {
    if (originalToken === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
    else process.env.MAPBOX_ACCESS_TOKEN = originalToken;
    if (originalOsrm === undefined) delete process.env.OSRM_BASE_URL;
    else process.env.OSRM_BASE_URL = originalOsrm;
    delete process.env.MAPBOX_DRIVING_PROFILE;
    vi.restoreAllMocks();
    clearRoutingCache();
  });

  it('selects Mapbox when the access token is set', () => {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test-token';
    delete process.env.OSRM_BASE_URL;
    expect(activeRoutingProvider()).toBe('mapbox');
  });

  it('selects OSRM when only the base URL is set', () => {
    delete process.env.MAPBOX_ACCESS_TOKEN;
    process.env.OSRM_BASE_URL = 'https://routing.example.test';
    expect(activeRoutingProvider()).toBe('osrm');
  });

  it('prefers Mapbox when both are configured, matching the founder decision', () => {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test-token';
    process.env.OSRM_BASE_URL = 'https://routing.example.test';
    expect(activeRoutingProvider()).toBe('mapbox');
  });

  it('treats a blank token as unconfigured instead of attempting a doomed call', () => {
    process.env.MAPBOX_ACCESS_TOKEN = '   ';
    delete process.env.OSRM_BASE_URL;
    expect(activeRoutingProvider()).toBeNull();
  });
});

describe('routing adapter Mapbox provider', () => {
  const MAPBOX_OK = {
    code: 'Ok',
    routes: [{
      distance: 5390.2,
      duration: 342,
      geometry: { coordinates: [[1.2138, 6.1315], [1.218, 6.15], [1.2226, 6.1655]] },
      legs: [{
        steps: [
          { name: 'Boulevard du 13 Janvier', distance: 1084, duration: 90, maneuver: { type: 'turn', modifier: 'right', instruction: 'Tournez à droite sur Boulevard du 13 Janvier' } },
          { name: 'Avenue Maman N\'Danida', distance: 1480, duration: 120, maneuver: { type: 'turn', modifier: 'left', instruction: 'Tournez à gauche sur Avenue Maman N\'Danida' } },
        ],
      }],
    }],
  };

  const originalToken = process.env.MAPBOX_ACCESS_TOKEN;
  beforeEach(() => {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test-token';
    delete process.env.OSRM_BASE_URL;
    clearRoutingCache();
  });
  afterEach(() => {
    if (originalToken === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
    else process.env.MAPBOX_ACCESS_TOKEN = originalToken;
    delete process.env.MAPBOX_DRIVING_PROFILE;
    vi.restoreAllMocks();
    clearRoutingCache();
  });

  it('calls api.mapbox.com with a full-geometry, French, stepped request', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(MAPBOX_OK), { status: 200 }));
    const route = await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });

    const requested = String(spy.mock.calls[0]?.[0]);
    expect(requested).toContain('api.mapbox.com/directions/v5/mapbox/driving/');
    expect(requested).toContain('geometries=geojson');
    expect(requested).toContain('overview=full');
    expect(requested).toContain('steps=true');
    // French keeps the turn-by-turn consistent with the rest of the product.
    expect(requested).toContain('language=fr');
    expect(route.provider).toBe('mapbox');
    expect(route.distanceMeters).toBe(5390.2);
    expect(route.coordinates).toHaveLength(3);
  });

  it('uses the walking profile for a foot itinerary instead of driving', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(MAPBOX_OK), { status: 200 }));
    await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN, profile: 'foot' });
    expect(String(spy.mock.calls[0]?.[0])).toContain('mapbox/walking');
  });

  it('stays on mapbox/driving by default and only opts into traffic explicitly', async () => {
    // A fresh Response per call: a single mocked Response body can only be read once.
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(JSON.stringify(MAPBOX_OK), { status: 200 }),
    );
    await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });
    expect(String(spy.mock.calls[0]?.[0])).toContain('mapbox/driving/');
    expect(String(spy.mock.calls[0]?.[0])).not.toContain('driving-traffic');

    clearRoutingCache();
    process.env.MAPBOX_DRIVING_PROFILE = 'driving-traffic';
    await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });
    expect(String(spy.mock.calls[1]?.[0])).toContain('mapbox/driving-traffic');
  });

  it('uses Mapbox own French instructions rather than composing its own', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(MAPBOX_OK), { status: 200 }));
    const route = await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });
    expect(route.steps[0]?.instruction).toBe('Tournez à droite sur Boulevard du 13 Janvier');
    expect(route.steps[1]?.instruction).toBe('Tournez à gauche sur Avenue Maman N\'Danida');
  });

  it('falls back to the local formatter when Mapbox omits an instruction', async () => {
    const payload = {
      code: 'Ok',
      routes: [{
        distance: 1000,
        duration: 60,
        geometry: { coordinates: [[1.2138, 6.1315], [1.2226, 6.1655]] },
        legs: [{ steps: [{ name: 'Rue Khra', distance: 1000, duration: 60, maneuver: { type: 'turn', modifier: 'left' } }] }],
      }],
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));
    const route = await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });
    expect(route.steps[0]?.instruction).toBe('Tournez à gauche sur Rue Khra');
  });

  it('never leaks the token into the client-visible result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(MAPBOX_OK), { status: 200 }));
    const route = await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });
    expect(JSON.stringify(route)).not.toContain('pk.test-token');
  });

  it('distinguishes a 200 NoRoute body from an HTTP failure', async () => {
    // Mapbox reports "no route" with HTTP 200, so status alone would look fine.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 'NoRoute', message: 'No route found' }), { status: 200 }));
    await expect(fetchRoadRoute({ from: ADAWLATO, to: TOKOIN })).rejects.toThrow(/No road itinerary/);
  });

  it('surfaces an expired token as a provider error, not a silent straight line', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 'TokenExpired', message: 'Token expired' }), { status: 200 }));
    await expect(fetchRoadRoute({ from: ADAWLATO, to: TOKOIN })).rejects.toBeInstanceOf(RoutingProviderError);
  });

  it('surfaces a 401 from Mapbox as a provider error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 401 }));
    await expect(fetchRoadRoute({ from: ADAWLATO, to: TOKOIN })).rejects.toThrow(/returned 401/);
  });

  it('caches a Mapbox itinerary so a UI reopen is not billed twice', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(MAPBOX_OK), { status: 200 }));
    await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });
    await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('routing adapter provider calls', () => {
  beforeEach(() => {
    process.env.OSRM_BASE_URL = 'https://routing.example.test';
    // A leaked Mapbox token would silently switch the provider under test.
    delete process.env.MAPBOX_ACCESS_TOKEN;
    clearRoutingCache();
  });
  afterEach(() => {
    delete process.env.OSRM_BASE_URL;
    vi.restoreAllMocks();
    clearRoutingCache();
  });

  it('requests a full-geometry itinerary with steps and returns the road route', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(OSRM_OK), { status: 200 }));
    const route = await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });

    const requested = String(spy.mock.calls[0]?.[0]);
    expect(requested).toContain('https://routing.example.test/route/v1/driving/');
    expect(requested).toContain('overview=full');
    expect(requested).toContain('geometries=geojson');
    expect(requested).toContain('steps=true');

    expect(route.provider).toBe('osrm');
    expect(route.distanceMeters).toBe(5390.2);
    expect(route.durationSeconds).toBe(342);
    expect(route.coordinates).toHaveLength(3);
    expect(route.steps).toHaveLength(2);
  });

  it('caches an identical itinerary instead of paying for it twice', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(OSRM_OK), { status: 200 }));
    await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });
    await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('surfaces a provider HTTP failure instead of inventing a route', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 503 }));
    await expect(fetchRoadRoute({ from: ADAWLATO, to: TOKOIN })).rejects.toBeInstanceOf(RoutingProviderError);
  });

  it('surfaces an unreachable provider instead of silently degrading', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('connect ECONNREFUSED'));
    await expect(fetchRoadRoute({ from: ADAWLATO, to: TOKOIN })).rejects.toBeInstanceOf(RoutingProviderError);
  });

  it('rejects a payload with no usable geometry', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ routes: [{ distance: 10, duration: 1, geometry: { coordinates: [] } }] }), { status: 200 }));
    await expect(fetchRoadRoute({ from: ADAWLATO, to: TOKOIN })).rejects.toBeInstanceOf(RoutingProviderError);
  });

  it('does not cache a failure, so a later retry can succeed', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    spy.mockResolvedValueOnce(new Response('nope', { status: 500 }));
    await expect(fetchRoadRoute({ from: ADAWLATO, to: TOKOIN })).rejects.toBeInstanceOf(RoutingProviderError);
    spy.mockResolvedValueOnce(new Response(JSON.stringify(OSRM_OK), { status: 200 }));
    const route = await fetchRoadRoute({ from: ADAWLATO, to: TOKOIN });
    expect(route.distanceMeters).toBe(5390.2);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe('routing instruction and label formatting', () => {
  it('names the street in French instructions', () => {
    expect(formatStepInstruction({ name: 'Rue Khra', maneuver: { type: 'depart' } })).toBe('Partez sur Rue Khra');
    expect(formatStepInstruction({ name: 'Boulevard de la Paix', maneuver: { type: 'turn', modifier: 'left' } })).toBe('Tournez à gauche sur Boulevard de la Paix');
    expect(formatStepInstruction({ name: 'Rue Kamé', maneuver: { type: 'turn', modifier: 'right' } })).toBe('Tournez à droite sur Rue Kamé');
    expect(formatStepInstruction({ maneuver: { type: 'arrive' } })).toBe('Vous êtes arrivé');
    expect(formatStepInstruction({ maneuver: { type: 'roundabout' } })).toBe('Au rond-point, continuez');
  });

  it('formats distances and durations the way the rest of the UI does', () => {
    expect(formatDistanceLabel(420)).toBe('420 m');
    expect(formatDistanceLabel(5390.2)).toBe('5,4 km');
    expect(formatDurationLabel(342)).toBe('6 min');
    expect(formatDurationLabel(30)).toBe('1 min');
    expect(formatDurationLabel(3900)).toBe('1 h 05');
  });
});