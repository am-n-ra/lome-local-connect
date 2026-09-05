import { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair, Minus, Plus, X } from 'lucide-react';
import { Map, setWorkerUrl, type GeoJSONSource, type MapGeoJSONFeature, type MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Bundle the MapLibre web worker from the SAME installed maplibre-gl package as the
// main thread. Pointing setWorkerUrl at the package worker (instead of a pinned,
// separately-committed static file) guarantees the worker and main thread share the
// exact same build, so map tile/feature data deserializes correctly in production
// (previously: blank map, "can't deserialize StructArrayLayout ..." in the console).
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { PublicFacility, RouteTarget } from './types';
import { globeContextLabelsVisibleForZoom, GLOBE_TO_MERCATOR_ZOOM, projectionForZoom } from './map-camera';
import { boundsOfPoints, buildSearchRevealSteps, pointsForResultFraming, type RevealPoint } from './map-reveal';
import { pinFeatureCollection, pinRadiusPx, pinRingWidthPx, PIN_CORE_COLOR, PIN_RING_OWNED_COLOR, PIN_RING_THIRD_PARTY_COLOR } from './map-pins';
import { bearingForGlobeAxisDrag, centerForGlobeAxisDrag } from './globe-axis';

type LocationState = 'idle' | 'requesting' | 'exact' | 'approximate' | 'denied' | 'unavailable' | 'timeout' | 'cancelled';

type CameraMode = 'resting_globe' | 'manual_navigation' | 'search_reveal' | 'result_framing' | 'selected_facility';

type Props = {
  facilities: PublicFacility[];
  selectedId: string | null;
  onSelect: (facility: PublicFacility) => void;
  onBoundsChange?: (bounds: [number, number, number, number]) => void;
  onRevealStateChange?: (active: boolean) => void;
  revealKey?: string | null;
  contextSurfaceOpen?: boolean;
  routeTarget?: RouteTarget | null;
  onRouteClose?: () => void;
  // R-03 map-contextual focus: an external surface (admin review, audit hop)
  // asks the map to pan/zoom onto arbitrary coordinates without a pin click.
  focusTarget?: { latitude: number; longitude: number; key: string } | null;
  // Facilities owned by the signed-in account (rule 7 Evergreen pin ring).
  ownedFacilityIds?: string[] | null;
};

// Primary vector basemap: CARTO Positron GL. It is a muted-gray/mono style that
// matches the v3 "style de carte gris muté" rule, serves real street-level data
// at every zoom, supports the globe projection, needs no API token, and answers
// with `access-control-allow-origin: *` (CORS-friendly) — unlike the previous
// OpenFreeMap/OSM providers, which were fragile in the deployed/review
// environment (CORS/403/TLS) and caused the owner's blank "carte ne s'affiche
// pas" report.
const REMOTE_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
// Self-hosted, network-independent vector style (muted mono globe). Guaranteed to
// render even with zero external network/tile access — the "the map must always
// display" safety net.
const LOCAL_STYLE = '/omni-local-style.json';
const FALLBACK_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm-raster', type: 'raster' as const, source: 'osm', paint: { 'raster-opacity': 1 } }],
};
const RESULT_LOCAL_ZOOM = 12.8;
const RESULT_MAX_ZOOM = 14.5;
const SOURCE = 'omni-v2-facilities';
// Evergreen route trace (écran 10 — itinéraire in-app, décision propriétaire #2).
// Straight two-point polyline from the user position to the facility: no external
// routing API, no network call. Trace styling follows the v3 aesthetic: Evergreen
// #234D40, dashed, rendered UNDER the pin layers so facilities stay tappable.
const ROUTE_SOURCE = 'omni-v2-route';
const ROUTE_COLOR = '#234D40';
const EMPTY_ROUTE = { type: 'FeatureCollection' as const, features: [] };
// Rule 7 (v3 spec): a soft shadow under the selected pin (ombre 12 %).
// MapLibre circles have no box-shadow, so this is a blurred black circle
// layer revealed only through the `selected` feature-state.
const PIN_SHADOW_COLOR = '#1A1A1A';
const PIN_SHADOW_OPACITY = 0.12;
const SELECTED_STATE: ['boolean', unknown, ...unknown[]] = ['boolean', ['feature-state', 'selected'], false];
const MAPLIBRE_WORKER_URL = maplibreWorkerUrl;
const GLOBE_SUPPRESSED_LABEL_LAYERS = [
  'label_country_1',
  'label_country_2',
  'label_country_3',
  'water_name_point_label',
  'water_name_line_label',
] as const;

if (typeof window !== 'undefined') setWorkerUrl(MAPLIBRE_WORKER_URL);

// Rule 7 selected-pin emphasis: mirror `selectedId` into the pin source's
// feature-state so the data-driven paint (scale 1.3 + soft shadow) updates in
// place — no layer re-creation, no map remount. Returns the id whose state is
// now set, so callers can track it across style reloads.
function applyPinEmphasis(map: Map, selectedId: string | null, previousId: string | null): string | null {
  if (!map.getSource(SOURCE)) return previousId;
  try {
    if (previousId && previousId !== selectedId) map.setFeatureState({ source: SOURCE, id: previousId }, { selected: false });
    if (selectedId) map.setFeatureState({ source: SOURCE, id: selectedId }, { selected: true });
  } catch {
    return previousId;
  }
  return selectedId;
}

function routeFeatureCollection(target: RouteTarget, origin: RevealPoint) {
  return {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: [[origin.longitude, origin.latitude], [target.longitude, target.latitude]] },
      properties: { name: target.name },
    }],
  };
}

// Great-circle distance (haversine) formatted for the route status chip.
function routeDistanceLabel(origin: RevealPoint, target: RouteTarget) {
  const earthRadiusKm = 6371;
  const startLat = (origin.latitude * Math.PI) / 180;
  const endLat = (target.latitude * Math.PI) / 180;
  const deltaLat = ((target.latitude - origin.latitude) * Math.PI) / 180;
  const deltaLng = ((target.longitude - origin.longitude) * Math.PI) / 180;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;
  const kilometers = 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(a)));
  return kilometers < 1 ? `${Math.round(kilometers * 1000)} m` : `${kilometers.toFixed(1).replace('.', ',')} km`;
}

function applyCanopyPalette(map: Map) {
  // Positron is already vector-native: preserve its neutral land treatment and
  // explicitly tune only the geographic primitives needed by the Omni reference.
  const paints: Array<[string, string, unknown]> = [
    ['background', 'background-color', '#ffffff'],
    ['background', 'background-opacity', 0],
    ['water', 'fill-color', '#2d3335'],
    ['park', 'fill-color', '#fafafa'],
    ['park_outline', 'line-color', '#d2d2d2'],
    ['landuse_residential', 'fill-color', '#ffffff'],
    ['landcover_grass', 'fill-color', '#ffffff'],
    ['landcover_wood', 'fill-color', '#f5f5f5'],
    ['landcover_ice', 'fill-color', '#ffffff'],
    ['landcover_wetland', 'fill-color', '#f7f7f7'],
    ['landcover_sand', 'fill-color', '#fafafa'],
    ['boundary_2', 'line-color', '#2b2b2b'],
    ['boundary_3', 'line-color', '#6d6d6d'],
    ['boundary_disputed', 'line-color', '#6d6d6d'],
    ['road_minor', 'line-color', '#d4d4d4'],
    ['road_secondary_tertiary', 'line-color', '#b5b5b5'],
    ['road_trunk_primary', 'line-color', '#8d8d8d'],
    ['road_motorway', 'line-color', '#5f5f5f'],
  ];
  for (const [layerId, property, value] of paints) {
    try {
      if (map.getLayer(layerId)) map.setPaintProperty(layerId, property as never, value as never);
    } catch {
      // A fallback or partially loaded style may not contain every vector layer.
    }
  }
}

function setGlobeContextLabelVisibility(map: Map, visible: boolean) {
  for (const layerId of GLOBE_SUPPRESSED_LABEL_LAYERS) {
    try {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    } catch {
      // Positron revisions may omit a rank layer; keep the other layers usable.
    }
  }
}

function rewriteGlyphUrl(url: string) {
  // CARTO's font host (tiles.basemaps.cartocdn.com/fonts) does NOT send CORS
  // headers in the deployed environment, so every label glyph request is blocked
  // ("Access ... had been blocked by CORS policy") and MapLibre falls back to
  // rendering each codepoint locally as a raw digit
  // ("Unable to load glyph range ... Rendering codepoint U+0030 locally instead").
  // Route glyph requests to the CORS-enabled openmaptiles font CDN
  // (annotated with access-control-allow-origin: *), which serves the same
  // Open Sans / Noto Sans / Montserrat families the CARTO style and the Omni
  // cluster layers declare. Font names are preserved, so no style edits needed.
  return url.replace(/^https:\/\/[^/]+\/fonts\//, 'https://fonts.openmaptiles.org/');
}

function waitForMapMove(map: Map, timeout = 1500) {
  return new Promise<void>((resolve) => {
    let timer: number | null = null;
    const done = () => {
      if (timer !== null) window.clearTimeout(timer);
      map.off('moveend', done);
      resolve();
    };
    map.once('moveend', done);
    timer = window.setTimeout(done, timeout);
  });
}

export function TrunkMap({ facilities, selectedId, onSelect, onBoundsChange, onRevealStateChange, revealKey = null, routeTarget = null, onRouteClose, focusTarget = null, ownedFacilityIds = null }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  // Hold the latest callback identities in refs so the map-creation effect below
  // does NOT re-run when the parent re-renders. (TrunkApp passes handleMapPinSelect
  // and onRevealStateChange as fresh closures each render.) If the effect depended
  // on those, every parent re-render — e.g. the `setBounds` update that follows
  // any map pan/zoom via onBoundsChange — would tear down and recreate the whole
  // MapLibre map at the initial zoom (1.35), which is exactly the reported
  // "zoom does not explore / it snaps back to the world view" regression.
  const onSelectRef = useRef(onSelect);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onRevealStateChangeRef = useRef(onRevealStateChange);
  onSelectRef.current = onSelect;
  onBoundsChangeRef.current = onBoundsChange;
  onRevealStateChangeRef.current = onRevealStateChange;
  const facilitiesRef = useRef(facilities);
  const rotating = useRef(true);
  const cameraMode = useRef<CameraMode>('manual_navigation');
  const rotationFrame = useRef<number | null>(null);
  const rotationResumeTimer = useRef<number | null>(null);
  const revealToken = useRef(0);
  const revealRunningRef = useRef(false);
  const lastRevealKey = useRef<string | null>(null);
  const pointerInside = useRef(false);
  const initialStyleReady = useRef(false);
  const lastBoundsKey = useRef<string | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [basemap, setBasemap] = useState<'vector' | 'local' | 'raster'>('vector');
  const [mapRetryKey, setMapRetryKey] = useState(0);
  const [rotationState, setRotationState] = useState<'idle' | 'rotating' | 'paused' | 'reduced'>('idle');
  const [cameraModeState, setCameraModeState] = useState<CameraMode>('manual_navigation');
  const [revealRunning, setRevealRunning] = useState(false);
  const [revealLabel, setRevealLabel] = useState<string | null>(null);
  const [zoom, setZoom] = useState(11.5);
  const [projection, setProjection] = useState<'globe' | 'mercator'>('mercator');
  const [bearing, setBearing] = useState(0);
  const [centerLongitude, setCenterLongitude] = useState(1.22);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [userPosition, setUserPosition] = useState<RevealPoint | null>(null);
  const userPositionRef = useRef<RevealPoint | null>(null);
  const [screenUserPosition, setScreenUserPosition] = useState<{ left: number; top: number } | null>(null);
  const userPositionFrame = useRef<number | null>(null);
  const locationRequest = useRef<number | null>(null);
  facilitiesRef.current = facilities;
  userPositionRef.current = userPosition;
  // Rule 7 (owned-pin Evergreen ring): mirror the owned ids and the selected
  // id into refs so addLayers/configureStyle can restore the correct ring and
  // emphasis after a style fallback without a remount.
  const ownedFacilityIdsRef = useRef(ownedFacilityIds);
  ownedFacilityIdsRef.current = ownedFacilityIds;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const lastEmphasizedIdRef = useRef<string | null>(null);
  // Route trace (itinéraire in-app): mirror the route target into a ref so
  // addLayers can restore the trace after a style fallback without a remount,
  // and keep one-shot geolocation + camera framing keyed per drawn route.
  const routeTargetRef = useRef<RouteTarget | null>(routeTarget);
  routeTargetRef.current = routeTarget;
  const routeOriginRequestKey = useRef<string | null>(null);
  const lastRouteDrawKey = useRef<string | null>(null);
  const [routeStatus, setRouteStatus] = useState<string | null>(null);

  const updateScreenUserPosition = useCallback(() => {
    const map = mapRef.current;
    const currentUser = userPositionRef.current;
    if (!map || !currentUser || !Number.isFinite(currentUser.longitude) || !Number.isFinite(currentUser.latitude)) {
      setScreenUserPosition(null);
      return;
    }
    const { width, height } = map.getContainer().getBoundingClientRect();
    const userPoint = map.project([currentUser.longitude, currentUser.latitude]);
    setScreenUserPosition(Number.isFinite(userPoint.x) && Number.isFinite(userPoint.y) && userPoint.x >= -40 && userPoint.x <= width + 40 && userPoint.y >= -40 && userPoint.y <= height + 40
      ? { left: userPoint.x, top: userPoint.y }
      : null);
  }, []);

  const scheduleUserPosition = useCallback(() => {
    if (userPositionFrame.current !== null) window.cancelAnimationFrame(userPositionFrame.current);
    userPositionFrame.current = window.requestAnimationFrame(() => {
      userPositionFrame.current = null;
      updateScreenUserPosition();
    });
  }, [updateScreenUserPosition]);

  useEffect(() => {
    scheduleUserPosition();
  }, [userPosition, scheduleUserPosition]);

  const cancelActiveReveal = () => {
    if (!revealRunningRef.current) return;
    revealToken.current += 1;
    revealRunningRef.current = false;
    setRevealRunning(false);
    setRevealLabel(null);
    cameraMode.current = 'manual_navigation';
    setCameraModeState('manual_navigation');
  };

  const pauseMotion = (reason: 'interaction' | 'surface' = 'interaction', stopMap = reason === 'surface') => {
    if (reason === 'interaction') cancelActiveReveal();
    rotating.current = false;
    if (rotationFrame.current !== null) {
      window.cancelAnimationFrame(rotationFrame.current);
      rotationFrame.current = null;
    }
    if (rotationResumeTimer.current !== null) {
      window.clearTimeout(rotationResumeTimer.current);
      rotationResumeTimer.current = null;
    }
    const map = mapRef.current;
    // Do not stop MapLibre during a native drag/rotate/wheel gesture. Stopping the
    // map on mousedown/dragstart makes the globe feel locked and can discard the
    // first part of the user's gesture. We only stop an active reveal or a
    // direct map-owned control action.
    if (map && (stopMap || revealRunningRef.current) && map.isMoving()) map.stop();
    if (reason === 'interaction' && cameraMode.current !== 'search_reveal') {
      cameraMode.current = 'manual_navigation';
      setCameraModeState('manual_navigation');
    }
    setRotationState(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'paused');
  };

  const cancelLocation = () => {
    if (locationRequest.current !== null) window.clearTimeout(locationRequest.current);
    locationRequest.current = null;
    rotating.current = false;
    cameraMode.current = 'manual_navigation';
    setCameraModeState('manual_navigation');
    setLocationState('cancelled');
  };

  const requestLocation = (recenter = true) => {
    if (locationState === 'requesting') {
      cancelLocation();
      return;
    }
    if (recenter) pauseMotion();
    if (!navigator.geolocation) {
      setLocationState('unavailable');
      return;
    }
    setLocationState('requesting');
    locationRequest.current = window.setTimeout(() => {
      locationRequest.current = null;
      setLocationState('timeout');
    }, 10_000);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (locationRequest.current !== null) window.clearTimeout(locationRequest.current);
        locationRequest.current = null;
        const approximate = position.coords.accuracy > 500;
        const nextPosition = { longitude: position.coords.longitude, latitude: position.coords.latitude };
        setUserPosition(nextPosition);
        setLocationState(approximate ? 'approximate' : 'exact');
        if (recenter) {
          mapRef.current?.stop();
          rotating.current = false;
          cameraMode.current = 'manual_navigation';
          setCameraModeState('manual_navigation');
          mapRef.current?.easeTo({ center: [position.coords.longitude, position.coords.latitude], zoom: approximate ? 5 : 7, duration: 900, essential: true });
        }
      },
      (error) => {
        if (locationRequest.current !== null) window.clearTimeout(locationRequest.current);
        locationRequest.current = null;
        setLocationState(error.code === error.PERMISSION_DENIED ? 'denied' : error.code === error.TIMEOUT ? 'timeout' : 'unavailable');
      },
      { enableHighAccuracy: recenter, maximumAge: recenter ? 60_000 : 300_000, timeout: recenter ? 8_000 : 10_000 },
    );
  };

  const zoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    pauseMotion();
    map.easeTo({ zoom: map.getZoom() + 1, duration: 0, essential: true });
  };

  const zoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    pauseMotion();
    map.easeTo({ zoom: Math.max(0, map.getZoom() - 1), duration: 0, essential: true });
  };

  useEffect(() => {
    let active = true;
    const arrivalAttemptKey = 'omni.canopy.v4.1.location-attempted';
    const attemptArrivalLocation = async () => {
      if (!navigator.geolocation) {
        setLocationState('unavailable');
        return;
      }
      let permissionState: PermissionState | undefined;
      try {
        if (navigator.permissions) permissionState = (await navigator.permissions.query({ name: 'geolocation' })).state;
      } catch {
        permissionState = undefined;
      }
      if (!active) return;
      if (permissionState === 'denied') {
        setLocationState('denied');
        return;
      }
      let alreadyAttempted = false;
      try {
        alreadyAttempted = window.sessionStorage.getItem(arrivalAttemptKey) === '1';
        if (permissionState !== 'granted') window.sessionStorage.setItem(arrivalAttemptKey, '1');
      } catch {
        // A restricted storage context must not prevent the browser permission flow.
      }
      if (permissionState !== 'granted' && alreadyAttempted) return;
      requestLocation(false);
    };
    void attemptArrivalLocation();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    initialStyleReady.current = false;
    setMapStatus('loading');
    setBasemap('vector');
    let readinessTimer: number | null = null;
    let fallbackTimer: number | null = null;
    let fallbackApplied = false;
    let localFallbackApplied = false;
    let localReadinessTimer: number | null = null;
    let basemapKind: 'vector' | 'local' | 'raster' = 'vector';
    let map: Map;
    try {
      map = new Map({
      container: container.current,
      style: REMOTE_STYLE,
      transformRequest: (url, resourceType) => ({
        url: resourceType === 'Glyphs' ? rewriteGlyphUrl(url) : url,
      }),
      center: [1.22, 6.13],
      zoom: 11.5,
      minZoom: 1,
      maxZoom: 18,
      attributionControl: false,
      cooperativeGestures: false,
      dragPan: true,
      dragRotate: true,
      touchZoomRotate: true,
    });
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setMapStatus('error');
      return;
    }
    mapRef.current = map;
    const syncCameraPadding = () => {
      const sheet = document.querySelector<HTMLElement>('.nearby-sheet');
      const sheetHeight = sheet ? Math.max(0, window.innerHeight - sheet.getBoundingClientRect().top) : 0;
      const bottomPadding = sheetHeight > 0 ? Math.min(sheetHeight + 56, Math.max(180, window.innerHeight - 110)) : 0;
      map.setPadding({ top: 0, right: 0, bottom: bottomPadding, left: 0 });
    };
    syncCameraPadding();

    const stopRotation = () => {
      if (rotationFrame.current !== null) {
        window.cancelAnimationFrame(rotationFrame.current);
        rotationFrame.current = null;
      }
    };
    const scheduleRotation = (delay = 260) => {
      stopRotation();
      if (rotationResumeTimer.current !== null) window.clearTimeout(rotationResumeTimer.current);
      if (fallbackApplied || window.matchMedia('(prefers-reduced-motion: reduce)').matches || cameraMode.current !== 'resting_globe' || map.getZoom() >= GLOBE_TO_MERCATOR_ZOOM) return;
      rotationResumeTimer.current = window.setTimeout(() => {
        rotationResumeTimer.current = null;
        if (fallbackApplied || window.matchMedia('(prefers-reduced-motion: reduce)').matches || cameraMode.current !== 'resting_globe' || map.getZoom() >= GLOBE_TO_MERCATOR_ZOOM) return;
        setRotationState('rotating');
        let previousTime = performance.now();
        const frame = (time: number) => {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !rotating.current || cameraMode.current !== 'resting_globe' || map.isMoving() || map.getZoom() >= GLOBE_TO_MERCATOR_ZOOM) {
            stopRotation();
            return;
          }
          const elapsedSeconds = Math.min(0.1, Math.max(0, time - previousTime) / 1000);
          previousTime = time;
          const center = map.getCenter();
          map.jumpTo({ center: [center.lng + (2.8 * elapsedSeconds), center.lat], bearing: 0, pitch: 0 });
          rotationFrame.current = window.requestAnimationFrame(frame);
        };
        rotationFrame.current = window.requestAnimationFrame(frame);
      }, delay);
    };
    const resume = () => {
      if (cameraMode.current !== 'resting_globe') {
        rotating.current = false;
        stopRotation();
        setRotationState('paused');
        return;
      }
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        rotating.current = false;
        stopRotation();
        setRotationState('reduced');
        return;
      }
      if (map.getZoom() < GLOBE_TO_MERCATOR_ZOOM && !map.isMoving()) {
        rotating.current = true;
        setCameraModeState('resting_globe');
        setRotationState('idle');
        scheduleRotation();
      } else {
        rotating.current = false;
        stopRotation();
        setRotationState('paused');
      }
    };
    const scheduleSettledResume = () => {
      if (rotationResumeTimer.current !== null) window.clearTimeout(rotationResumeTimer.current);
      rotationResumeTimer.current = window.setTimeout(() => {
        rotationResumeTimer.current = null;
        if (map.isMoving() || map.getZoom() >= GLOBE_TO_MERCATOR_ZOOM) return;
        if (cameraMode.current === 'manual_navigation') {
          cameraMode.current = 'resting_globe';
          setCameraModeState('resting_globe');
        }
        resume();
      }, 900);
    };
    const configureStyle = () => {
      if (!map.isStyleLoaded()) return;
      initialStyleReady.current = true;
      if (readinessTimer !== null) window.clearTimeout(readinessTimer);
      setMapStatus('ready');
      const initialGlobe = basemapKind !== 'raster' && projectionForZoom(map.getZoom()) === 'globe';
      globeProjection = initialGlobe;
      map.setProjection({ type: initialGlobe ? 'globe' : 'mercator' });
      setGlobeContextLabelVisibility(map, globeContextLabelsVisibleForZoom(map.getZoom()));
      setProjection(initialGlobe ? 'globe' : 'mercator');
      map.resize();
      applyCanopyPalette(map);
      map.triggerRepaint();
      syncCameraPadding();
      addLayers(map);
      const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
      source?.setData(pinFeatureCollection(facilitiesRef.current, ownedFacilityIdsRef.current));
      // A re-added source loses per-feature state: restore the selected-pin
      // emphasis so a style fallback never drops the rule 7 highlight.
      lastEmphasizedIdRef.current = applyPinEmphasis(map, selectedIdRef.current, lastEmphasizedIdRef.current);
      setZoom(map.getZoom());
      setBearing(map.getBearing());
      scheduleUserPosition();
      emitBounds();
    };
    map.on('style.load', configureStyle);
    const emitBounds = () => {
      const bounds = map.getBounds();
      const next: [number, number, number, number] = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
      const key = next.map((value) => value.toFixed(4)).join(',');
      if (key === lastBoundsKey.current) return;
      lastBoundsKey.current = key;
      onBoundsChangeRef.current?.(next);
    };

    const canvasContainer = map.getCanvasContainer();
    const handleCanvasEnter = () => {
      pointerInside.current = true;
    };
    const handleCanvasLeave = () => {
      pointerInside.current = false;
      if (cameraMode.current === 'resting_globe' || cameraMode.current === 'manual_navigation') scheduleSettledResume();
    };
    canvasContainer.addEventListener('mouseenter', handleCanvasEnter);
    canvasContainer.addEventListener('mouseleave', handleCanvasLeave);
    const handleWindowMove = (event: Event) => {
      const pointer = event as MouseEvent;
      const bounds = canvasContainer.getBoundingClientRect();
      const eventTarget = event.target instanceof Node ? event.target : null;
      const isOnCanvas = eventTarget
        ? canvasContainer.contains(eventTarget)
        : Number.isFinite(pointer.clientX) && Number.isFinite(pointer.clientY)
          ? pointer.clientX >= bounds.left && pointer.clientX <= bounds.right && pointer.clientY >= bounds.top && pointer.clientY <= bounds.bottom
          : false;
      if (isOnCanvas) {
        if (!pointerInside.current) handleCanvasEnter();
        return;
      }
      if (pointerInside.current) handleCanvasLeave();
    };
    window.addEventListener('pointermove', handleWindowMove, true);
    window.addEventListener('mousemove', handleWindowMove, true);

    type GlobeGesture = { x: number; y: number; center: [number, number]; bearing: number; touchId?: number };
    let globeGesture: GlobeGesture | null = null;
    const beginGlobeGesture = (x: number, y: number, touchId?: number) => {
      if (projectionForZoom(map.getZoom()) !== 'globe') return false;
      const center = map.getCenter();
      globeGesture = { x, y, center: [center.lng, center.lat], bearing: map.getBearing(), touchId };
      map.dragPan.disable();
      pauseMotion('interaction', false);
      return true;
    };
    const updateGlobeGesture = (x: number, y: number) => {
      if (!globeGesture) return;
      const deltaX = x - globeGesture.x;
      const deltaY = y - globeGesture.y;
      const [longitude, latitude] = centerForGlobeAxisDrag({ longitude: globeGesture.center[0], latitude: globeGesture.center[1], bearing: globeGesture.bearing }, { x: deltaX, y: deltaY });
      map.jumpTo({
        center: [longitude, latitude],
        bearing: bearingForGlobeAxisDrag({ longitude: globeGesture.center[0], latitude: globeGesture.center[1], bearing: globeGesture.bearing }),
        pitch: 0,
      });
    };
    const endGlobeGesture = () => {
      if (!globeGesture) return;
      globeGesture = null;
      map.dragPan.enable();
      rotating.current = false;
      cameraMode.current = 'manual_navigation';
      setCameraModeState('manual_navigation');
      emitBounds();
      scheduleUserPosition();
    };
    const handleGlobeMouseDown = (event: MouseEvent) => {
      if (event.button !== 0 || !beginGlobeGesture(event.clientX, event.clientY)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const handleGlobeMouseMove = (event: MouseEvent) => {
      if (!globeGesture || globeGesture.touchId !== undefined) return;
      event.preventDefault();
      event.stopPropagation();
      updateGlobeGesture(event.clientX, event.clientY);
    };
    const handleGlobeMouseUp = () => endGlobeGesture();
    const handleGlobeTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch || !beginGlobeGesture(touch.clientX, touch.clientY, touch.identifier)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const handleGlobeTouchMove = (event: TouchEvent) => {
      if (!globeGesture || globeGesture.touchId === undefined) return;
      if (event.touches.length > 1) {
        endGlobeGesture();
        return;
      }
      const touch = [...event.touches].find((item) => item.identifier === globeGesture?.touchId);
      if (!touch) return;
      event.preventDefault();
      event.stopPropagation();
      updateGlobeGesture(touch.clientX, touch.clientY);
    };
    const handleGlobeTouchEnd = (event: TouchEvent) => {
      if (globeGesture?.touchId === undefined) return;
      if (![...event.touches].some((touch) => touch.identifier === globeGesture?.touchId)) endGlobeGesture();
    };
    canvasContainer.addEventListener('mousedown', handleGlobeMouseDown, true);
    canvasContainer.addEventListener('touchstart', handleGlobeTouchStart, { capture: true, passive: false });
    window.addEventListener('mousemove', handleGlobeMouseMove, true);
    window.addEventListener('mouseup', handleGlobeMouseUp, true);
    window.addEventListener('touchmove', handleGlobeTouchMove, { capture: true, passive: false });
    window.addEventListener('touchend', handleGlobeTouchEnd, true);
    window.addEventListener('touchcancel', handleGlobeTouchEnd, true);

    // Pause Omni's idle choreography, but let MapLibre keep ownership of the
    // actual local-map gesture. At globe scale the small adapter above makes
    // the primary left-drag gesture behave like a free globe manipulation.
    map.on('mousedown', () => pauseMotion('interaction', false));
    map.on('touchstart', () => pauseMotion('interaction', false));
    map.on('wheel', () => pauseMotion('interaction', false));
    map.on('dragstart', () => pauseMotion('interaction', false));
    map.on('rotatestart', () => pauseMotion('interaction', false));
    map.on('zoomstart', () => { if (cameraMode.current !== 'search_reveal' && cameraMode.current !== 'result_framing') pauseMotion('interaction', false); });
    map.on('move', () => { setBearing(map.getBearing()); scheduleUserPosition(); });
    map.on('moveend', () => {
      setCenterLongitude(map.getCenter().lng);
      if (!rotating.current) emitBounds();
      scheduleUserPosition();
      if (cameraMode.current === 'resting_globe') scheduleSettledResume();
    });
    map.on('dragend', () => {
      rotating.current = false;
      if (cameraMode.current !== 'search_reveal' && cameraMode.current !== 'result_framing') {
        cameraMode.current = 'manual_navigation';
        setCameraModeState('manual_navigation');
      }
      emitBounds();
      scheduleUserPosition();
      if (map.getZoom() < GLOBE_TO_MERCATOR_ZOOM) scheduleSettledResume();
    });
    map.on('zoomend', () => {
      rotating.current = false;
      if (cameraMode.current !== 'search_reveal' && cameraMode.current !== 'result_framing') {
        cameraMode.current = 'manual_navigation';
        setCameraModeState('manual_navigation');
      }
      setZoom(map.getZoom());
      emitBounds();
      scheduleUserPosition();
      if (map.getZoom() < GLOBE_TO_MERCATOR_ZOOM) scheduleSettledResume();
    });
    // Prefer the reliable CARTO vector basemap, but recover automatically to the
    // self-hosted, network-independent monochrome globe style when the provider or
    // its worker cannot render the first map. This keeps a visible world globe
    // (never a blank canvas) on cold/mobile networks or when an external tile host
    // is blocked / CORS-fails in a deployed environment.
    const switchToLocalGlobe = () => {
      if (mapRef.current !== map || localFallbackApplied) return;
      localFallbackApplied = true;
      fallbackApplied = true;
      basemapKind = 'local';
      setBasemap('local');
      setMapStatus('loading');
      map.stop();
      rotating.current = false;
      cameraMode.current = 'manual_navigation';
      setCameraModeState('manual_navigation');
      map.once('style.load', () => {
        map.setProjection({ type: 'globe' });
        map.resize();
        map.triggerRepaint();
      });
      map.setStyle(LOCAL_STYLE);
      map.jumpTo({ center: [1.22, 6.13], zoom: 1.35, bearing: 0, pitch: 0 });
      map.resize();
      // Last resort: if even the local style fails to become ready, fall back to
      // the declarative OSM raster style + <img> underlay, then surface an error.
      localReadinessTimer = window.setTimeout(() => {
        if (mapRef.current !== map || initialStyleReady.current) return;
        basemapKind = 'raster';
        setBasemap('raster');
        setMapStatus('loading');
        map.once('style.load', () => {
          if (!map.getSource('osm')) map.addSource('osm', { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' });
          if (!map.getLayer('osm-raster')) map.addLayer({ id: 'osm-raster', type: 'raster', source: 'osm', paint: { 'raster-opacity': 1 } });
          map.setProjection({ type: 'mercator' });
          map.resize();
          map.triggerRepaint();
        });
        map.setStyle(FALLBACK_STYLE);
        map.jumpTo({ center: [1.22, 6.13], zoom: 2, bearing: 0, pitch: 0 });
        map.setProjection({ type: 'mercator' });
        map.resize();
      }, 6_500);
    };
    fallbackTimer = window.setTimeout(() => {
      if (!initialStyleReady.current && mapRef.current === map && !fallbackApplied) switchToLocalGlobe();
    }, 6_500);
    readinessTimer = window.setTimeout(() => {
      if (!initialStyleReady.current && mapRef.current === map) setMapStatus('error');
    }, 18_000);
    // Escalate immediately on a fatal (non-tile) style error, e.g. the provider is
    // down or blocked by TLS/CORS, so users never sit on a blank map waiting for
    // the readiness timer.
    map.on('error', (event) => {
      const err = event as { error?: unknown; sourceId?: unknown; tile?: unknown };
      if (!fallbackApplied && mapRef.current === map && !err?.sourceId && !err?.tile) switchToLocalGlobe();
    });
    let globeProjection = true;
    const syncProjection = () => {
      const wantsGlobe = basemapKind !== 'raster' && projectionForZoom(map.getZoom()) === 'globe';
      if (wantsGlobe !== globeProjection) {
        globeProjection = wantsGlobe;
        map.setProjection({ type: wantsGlobe ? 'globe' : 'mercator' });
        setGlobeContextLabelVisibility(map, globeContextLabelsVisibleForZoom(map.getZoom()));
        setProjection(wantsGlobe ? 'globe' : 'mercator');
        map.resize();
        map.triggerRepaint();
      }
    };
    map.on('zoom', syncProjection);
    map.on('moveend', syncProjection);
    map.on('styledata', configureStyle);
    map.on('load', () => {
      if (readinessTimer !== null) window.clearTimeout(readinessTimer);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      setMapStatus('ready');
      configureStyle();
      globeProjection = basemapKind !== 'raster' && map.getZoom() < GLOBE_TO_MERCATOR_ZOOM;
      resume();
    });

    const observer = new ResizeObserver(() => { map.resize(); syncCameraPadding(); });
    observer.observe(container.current);
    const surfaceObserver = new MutationObserver(() => { syncCameraPadding(); scheduleUserPosition(); });
    surfaceObserver.observe(document.body, { childList: true, subtree: true });
    const handleWindowResize = () => { map.resize(); syncCameraPadding(); scheduleUserPosition(); };
    window.addEventListener('resize', handleWindowResize);
    return () => {
      if (readinessTimer !== null) window.clearTimeout(readinessTimer);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      if (localReadinessTimer !== null) window.clearTimeout(localReadinessTimer);
      if (rotationFrame.current !== null) window.cancelAnimationFrame(rotationFrame.current);
      if (rotationResumeTimer.current !== null) window.clearTimeout(rotationResumeTimer.current);
      if (userPositionFrame.current !== null) window.cancelAnimationFrame(userPositionFrame.current);
      observer.disconnect();
      surfaceObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      canvasContainer.removeEventListener('mouseenter', handleCanvasEnter);
      canvasContainer.removeEventListener('mouseleave', handleCanvasLeave);
      window.removeEventListener('pointermove', handleWindowMove, true);
      window.removeEventListener('mousemove', handleWindowMove, true);
      canvasContainer.removeEventListener('mousedown', handleGlobeMouseDown, true);
      canvasContainer.removeEventListener('touchstart', handleGlobeTouchStart, true);
      window.removeEventListener('mousemove', handleGlobeMouseMove, true);
      window.removeEventListener('mouseup', handleGlobeMouseUp, true);
      window.removeEventListener('touchmove', handleGlobeTouchMove, true);
      window.removeEventListener('touchend', handleGlobeTouchEnd, true);
      window.removeEventListener('touchcancel', handleGlobeTouchEnd, true);
      if (globeGesture) map.dragPan.enable();
      globeGesture = null;
      if (locationRequest.current !== null) window.clearTimeout(locationRequest.current);
      locationRequest.current = null;
      try { map.remove(); } catch (e) { console.error("Error removing map:", e); }
      mapRef.current = null;
    };

    function addLayers(target: Map) {
      if (target.getSource(SOURCE)) return;
      // promoteId lets feature-state target pins by facility id (rule 7
      // selected-pin emphasis) without numeric feature ids.
      target.addSource(SOURCE, { type: 'geojson', data: pinFeatureCollection(facilitiesRef.current, ownedFacilityIdsRef.current), cluster: true, clusterMaxZoom: 8, clusterRadius: 48, promoteId: 'id' });
      // Facilities and clusters are visible MapLibre features, so the basemap and public presence
      // reproject in the same render cycle during drag, rotate and zoom. The accessible HTML list
      // below is only the keyboard fallback; it is not a second visual marker renderer.
      target.addLayer({ id: 'omni-cluster-rings', type: 'circle', source: SOURCE, filter: ['has', 'point_count'], paint: { 'circle-color': '#d8d8d8', 'circle-radius': ['step', ['get', 'point_count'], 28, 10, 36, 30, 46], 'circle-stroke-color': '#777777', 'circle-stroke-width': 1.5, 'circle-stroke-opacity': 0.55, 'circle-opacity': 0.2 } });
      target.addLayer({ id: 'omni-clusters', type: 'circle', source: SOURCE, filter: ['has', 'point_count'], paint: { 'circle-color': '#222222', 'circle-radius': ['step', ['get', 'point_count'], 15, 10, 19, 30, 23], 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2, 'circle-opacity': 0.96 } });
      target.addLayer({ id: 'omni-cluster-count', type: 'symbol', source: SOURCE, filter: ['has', 'point_count'], layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 11, 'text-font': ['Noto Sans Bold'] }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#222222', 'text-halo-width': 0.8 } });
      // Rule 7 (v3 spec): owned pins wear the full Evergreen outer ring,
      // third-party pins the Cream ring, orange core in both cases. The
      // selected pin is emphasised in place (scale 1.3 + soft 12% shadow)
      // through the `selected` feature-state — never a layer re-creation.
      target.addLayer({ id: 'omni-pin-shadow', type: 'circle', source: SOURCE, filter: ['!', ['has', 'point_count']], paint: { 'circle-color': PIN_SHADOW_COLOR, 'circle-radius': ['case', SELECTED_STATE, pinRadiusPx(true), pinRadiusPx(false)], 'circle-blur': 0.8, 'circle-translate': [0, 2], 'circle-opacity': ['case', SELECTED_STATE, PIN_SHADOW_OPACITY, 0] } });
      target.addLayer({ id: 'omni-pins', type: 'circle', source: SOURCE, filter: ['!', ['has', 'point_count']], paint: { 'circle-color': PIN_CORE_COLOR, 'circle-radius': ['case', SELECTED_STATE, pinRadiusPx(true), pinRadiusPx(false)], 'circle-stroke-color': ['case', ['boolean', ['get', 'owned'], false], PIN_RING_OWNED_COLOR, PIN_RING_THIRD_PARTY_COLOR], 'circle-stroke-width': ['case', SELECTED_STATE, pinRingWidthPx(true), pinRingWidthPx(false)], 'circle-opacity': 1 } });
      target.on('click', 'omni-clusters', (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
        const clusterId = feature?.properties?.cluster_id;
        if (!feature || clusterId === undefined) return;
        const source = target.getSource(SOURCE) as GeoJSONSource;
        source.getClusterExpansionZoom(Number(clusterId)).then((nextZoom) => target.easeTo({ center: (feature.geometry as { type: 'Point'; coordinates: number[] }).coordinates as [number, number], zoom: nextZoom })).catch(() => undefined);
      });
      target.on('click', 'omni-pins', (event: MapLayerMouseEvent) => {
        const id = String(event.features?.[0]?.properties?.id ?? '');
        const facility = facilitiesRef.current.find((item) => item.id === id);
        if (facility) {
          pauseMotion('interaction', false);
          onSelectRef.current(facility);
          target.easeTo({ center: [facility.longitude, facility.latitude], zoom: Math.max(target.getZoom(), 5.2), duration: 700 });
        }
      });
      for (const layer of ['omni-clusters', 'omni-pins']) {
        target.on('mouseenter', layer, () => { target.getCanvas().style.cursor = 'pointer'; });
        target.on('mouseleave', layer, () => { target.getCanvas().style.cursor = ''; });
      }
      // Evergreen route trace source + dashed line layers (itinéraire in-app).
      // Added through the same guarded pattern as the facility source: once per
      // style load, before the pin layers, never a remount.
      if (!target.getSource(ROUTE_SOURCE)) {
        const currentRoute = routeTargetRef.current;
        const currentOrigin = userPositionRef.current;
        target.addSource(ROUTE_SOURCE, {
          type: 'geojson',
          data: currentRoute && currentOrigin ? routeFeatureCollection(currentRoute, currentOrigin) : EMPTY_ROUTE,
        });
        target.addLayer({ id: 'omni-route-casing', type: 'line', source: ROUTE_SOURCE, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ROUTE_COLOR, 'line-width': 6, 'line-opacity': 0.16 } }, 'omni-cluster-rings');
        target.addLayer({ id: 'omni-route-line', type: 'line', source: ROUTE_SOURCE, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ROUTE_COLOR, 'line-width': 3.5, 'line-dasharray': [1.4, 1], 'line-opacity': 0.92 } }, 'omni-cluster-rings');
      }
    }
    // Recreate ONLY on the explicit retry signal. Parent re-renders (bounds updates,
    // facility load, etc.) must never tear the map down — callbacks are read from refs.
  }, [mapRetryKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !revealKey || revealKey === lastRevealKey.current) return;
    // La carte MapLibre peut ne pas encore avoir fini de charger (mapStatus !== 'ready')
    // alors que les facilities sont déjà là. Dans ce cas on ne marque PAS le reveal
    // comme vu : quand mapStatus passe à 'ready', l'effet se rejoue et démarre enfin.
    if (mapStatus !== 'ready') return;
    lastRevealKey.current = revealKey;
    const token = revealToken.current + 1;
    revealToken.current = token;
    revealRunningRef.current = true;
    onRevealStateChange?.(true);
    setRevealRunning(true);
    rotating.current = false;
    if (rotationFrame.current !== null) window.cancelAnimationFrame(rotationFrame.current);
    if (rotationResumeTimer.current !== null) window.clearTimeout(rotationResumeTimer.current);

    const isStale = () => token !== revealToken.current;

    // Cinematic reveal: world → continent → country → region → city → results framing.
    // Mirrors the accepted maquette search experience (globe zooms in progressively).
    const steps = buildSearchRevealSteps(facilities, userPositionRef.current);
    if (!steps.length) {
      revealRunningRef.current = false;
      onRevealStateChange?.(false);
      setRevealRunning(false);
      setRevealLabel(null);
      return () => undefined;
    }
    cameraMode.current = 'search_reveal';
    setCameraModeState('search_reveal');

    const finish = () => {
      if (isStale()) return;
      const finalPoints = pointsForResultFraming(facilities, userPositionRef.current);
      const finalBounds = boundsOfPoints(finalPoints);
      cameraMode.current = 'result_framing';
      setCameraModeState('result_framing');

      if (finalBounds) {
        const [[west, south], [east, north]] = finalBounds;
        if (Math.abs(east - west) < 0.0001 && Math.abs(north - south) < 0.0001) {
          map.easeTo({ center: [west, south], zoom: RESULT_LOCAL_ZOOM, duration: 600, essential: true });
        } else {
          map.fitBounds(finalBounds, { padding: { top: 90, right: 60, bottom: 180, left: 60 }, maxZoom: RESULT_MAX_ZOOM, duration: 700, essential: true });
        }
      }

      revealRunningRef.current = false;
      onRevealStateChange?.(false);
      setRevealRunning(false);
      setRevealLabel(null);
      cameraMode.current = 'manual_navigation';
      setCameraModeState('manual_navigation');
    };

    let chain: Promise<void> = Promise.resolve();
    steps.forEach((step) => {
      chain = chain.then(() => new Promise<void>((resolve) => {
        if (isStale()) { resolve(); return; }
        setRevealLabel(step.label);
        // V1.1 founder: the globe phase spins. easeTo + setCenter per frame fight
        // each other, so the world step runs its own rAF loop that lerps the
        // zoom down to globe level while rotating the longitude.
        if (step.kind === 'world') {
          rotating.current = true;
          const duration = step.pause + 820;
          const startZoom = map.getZoom();
          const startCenter = map.getCenter();
          const startTime = performance.now();
          const spin = (now: number) => {
            if (isStale() || !rotating.current) return;
            const t = Math.min(1, (now - startTime) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            map.jumpTo({
              center: [startCenter.lng + t * 55, startCenter.lat],
              zoom: startZoom + (step.zoom - startZoom) * eased,
            });
            if (t < 1) {
              rotationFrame.current = window.requestAnimationFrame(spin);
            } else {
              rotating.current = false;
              rotationFrame.current = null;
              resolve();
            }
          };
          rotationFrame.current = window.requestAnimationFrame(spin);
        } else {
          map.easeTo({ center: step.center, zoom: step.zoom, duration: 820, essential: true });
          window.setTimeout(resolve, step.pause + 820);
        }
      }));
    });
    chain.then(() => { if (!isStale()) finish(); }).catch(() => undefined);

    return () => {
      if (token === revealToken.current) {
        revealToken.current += 1;
        revealRunningRef.current = false;
        onRevealStateChange?.(false);
        setRevealRunning(false);
        setRevealLabel(null);
      }
    };
  }, [facilities, mapStatus, onRevealStateChange, revealKey]);

  useEffect(() => {
    const source = mapRef.current?.getSource(SOURCE) as GeoJSONSource | undefined;
    source?.setData(pinFeatureCollection(facilities, ownedFacilityIds));
    scheduleUserPosition();
  }, [facilities, ownedFacilityIds, scheduleUserPosition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Rule 7: mirror the selection into feature-state for the scale/shadow
    // emphasis (and clear the previous pin). Re-runs on data changes too,
    // because a GeoJSON setData can drop per-feature state.
    lastEmphasizedIdRef.current = applyPinEmphasis(map, selectedId, lastEmphasizedIdRef.current);
    if (map.getLayer('omni-pins')) map.setPaintProperty('omni-pins', 'circle-color', PIN_CORE_COLOR);
    if (!selectedId) return;
    const selected = facilities.find((facility) => facility.id === selectedId);
    if (!selected || map.isMoving()) return;
    cameraMode.current = 'selected_facility';
    setCameraModeState('selected_facility');
    map.easeTo({ center: [selected.longitude, selected.latitude], zoom: Math.max(map.getZoom(), 5.2), duration: 650, essential: true });
  }, [facilities, selectedId]);

  // R-03 map-contextual focus (admin review selection, audit hop-to-object):
  // pan/zoom onto coordinates supplied by a contextual surface. Keyed on the
  // focus key so identical coordinates can be re-requested for a new object.
  const lastFocusKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;
    if (lastFocusKeyRef.current === focusTarget.key) return;
    lastFocusKeyRef.current = focusTarget.key;
    rotating.current = false;
    cameraMode.current = 'selected_facility';
    setCameraModeState('selected_facility');
    map.easeTo({ center: [focusTarget.longitude, focusTarget.latitude], zoom: Math.max(map.getZoom(), 14), duration: 900, essential: true });
  }, [focusTarget]);

  // Evergreen route trace (écran 10): update the GeoJSON source data when the
  // route target or the user position changes; clear it when closed. Camera
  // framing happens once per drawn route, never on unrelated re-renders.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource(ROUTE_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;
    if (!routeTarget) {
      source.setData(EMPTY_ROUTE);
      routeOriginRequestKey.current = null;
      lastRouteDrawKey.current = null;
      setRouteStatus(null);
      return;
    }
    const origin = userPositionRef.current;
    if (origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude)) {
      const drawKey = `${origin.latitude.toFixed(5)},${origin.longitude.toFixed(5)}>${routeTarget.latitude.toFixed(5)},${routeTarget.longitude.toFixed(5)}`;
      if (lastRouteDrawKey.current !== drawKey) {
        lastRouteDrawKey.current = drawKey;
        source.setData(routeFeatureCollection(routeTarget, origin));
        setRouteStatus(`Itinéraire vers ${routeTarget.name} · ${routeDistanceLabel(origin, routeTarget)} (tracé direct)`);
        pauseMotion('interaction', false);
        map.fitBounds(
          [
            [Math.min(origin.longitude, routeTarget.longitude), Math.min(origin.latitude, routeTarget.latitude)],
            [Math.max(origin.longitude, routeTarget.longitude), Math.max(origin.latitude, routeTarget.latitude)],
          ],
          { padding: { top: 96, right: 76, bottom: 220, left: 76 }, maxZoom: 14, duration: 900, essential: true },
        );
      }
      return;
    }
    // No live position yet: ask once for this route target, then report it
    // gracefully instead of leaving the trace silently empty.
    const requestKey = `${routeTarget.latitude.toFixed(5)},${routeTarget.longitude.toFixed(5)}`;
    if (routeOriginRequestKey.current !== requestKey) {
      routeOriginRequestKey.current = requestKey;
      requestLocation(false);
    }
    setRouteStatus(
      locationState === 'denied' || locationState === 'timeout' || locationState === 'unavailable' || locationState === 'cancelled'
        ? 'Position indisponible. Activez la localisation puis relancez « Voir l’itinéraire ».'
        : 'Recherche de votre position pour tracer l’itinéraire…',
    );
  }, [routeTarget, userPosition, locationState]);

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const locationCopy = locationState === 'requesting'
    ? { title: 'Localisation en cours…', detail: 'La carte reste sur votre vue pendant la demande.' }
    : locationState === 'exact'
      ? { title: 'Position détectée', detail: 'Votre repère est visible; utilisez le contrôle pour recentrer.' }
      : locationState === 'approximate'
        ? { title: 'Position détectée', detail: 'Votre repère approximatif reste distinct sans déplacer la carte.' }
        : locationState === 'denied'
          ? { title: 'Localisation désactivée', detail: 'Autorisez-la dans votre navigateur ou continuez à explorer.' }
          : locationState === 'timeout'
            ? { title: 'Localisation trop lente', detail: 'La carte publique reste disponible pendant la nouvelle tentative.' }
            : locationState === 'cancelled'
              ? { title: 'Localisation annulée', detail: 'Vous pouvez continuer à explorer la carte publique.' }
              : { title: 'Localisation indisponible', detail: 'Vous pouvez continuer à explorer la carte publique.' };

      return (
    <div className="map-stage omni-stage-viewport" data-motion={prefersReducedMotion ? 'reduced' : 'full'} data-map-status={mapStatus} data-basemap={basemap} data-projection={projection} data-camera-mode={cameraModeState} data-reveal-stage={revealLabel ?? 'idle'} data-zoom-enabled="true" data-zoom={zoom.toFixed(2)} data-bearing={bearing.toFixed(2)} data-center-lng={centerLongitude.toFixed(4)} data-rotation={rotationState} data-location={locationState} data-user-position={userPosition ? 'visible' : 'hidden'} data-route={routeTarget ? 'active' : 'idle'} data-rotation-owner="map-only">
      <div ref={container} className="map-canvas" aria-label="Carte de découverte Omni" />
      {mapStatus === 'ready' && screenUserPosition && <div className="user-position-overlay" style={{ left: screenUserPosition.left, top: screenUserPosition.top }} role="img" aria-label={locationState === 'approximate' ? 'Votre zone approximative sur la carte' : 'Votre position sur la carte'}><span className="user-position-marker omni-user-marker-ring" /></div>}
      {revealRunning && revealLabel && <div className="map-reveal-status" role="status" aria-live="polite"><span className="sr-only">{revealLabel}</span><div className="omni-progress-track" aria-hidden="true"><span /></div></div>}
      {routeTarget && <div className="route-status-chip" role="status" aria-live="polite" data-state={routeStatus?.startsWith('Position indisponible') ? 'unavailable' : 'active'}><span>{routeStatus ?? `Itinéraire vers ${routeTarget.name}`}</span><button type="button" onClick={() => onRouteClose?.()} aria-label="Fermer l’itinéraire"><X size={14} /></button></div>}
      <div className="map-pin-a11y" aria-label="Lieux publics sur la carte">
        {facilities.map((facility) => <button key={facility.id} type="button" aria-label={`Ouvrir ${facility.name}`} onClick={() => { const map = mapRef.current; if (!map) return; pauseMotion('interaction', false); onSelect(facility); map.easeTo({ center: [facility.longitude, facility.latitude], zoom: Math.max(map.getZoom(), 5.2), duration: 650, essential: true }); }}>{facility.name}</button>)}
      </div>
      <div className="map-texture" aria-hidden="true" />
      <div className="map-attribution">© OpenStreetMap contributors</div>
      <div className="map-status" aria-live="polite">{mapStatus === 'loading' ? 'Chargement de la carte' : mapStatus === 'error' ? 'Carte indisponible' : 'Carte active'}</div>
      {mapStatus === 'error' && <div className="map-provider-error" role="alert"><span>La carte vectorielle est temporairement indisponible.</span><button type="button" onClick={() => { setMapStatus('loading'); setMapRetryKey((key) => key + 1); }}>Réessayer</button></div>}
      {locationState !== 'idle' && <div className="location-status-sr" role="status" aria-live="polite">{locationCopy.title}. {locationCopy.detail}</div>}
      <div className="map-controls" aria-label="Contrôles de carte">
        <button className="zoom-out-control" type="button" aria-label="Zoom arrière" onClick={zoomOut}><Minus size={16} /></button>
        <button className="zoom-in-control" type="button" aria-label="Zoom avant" onClick={zoomIn}><Plus size={17} /></button>
        <button className="location-control" type="button" aria-label="Utiliser ma localisation" onClick={() => requestLocation()}><Crosshair size={16} /></button>
      </div>
    </div>
  );
}
