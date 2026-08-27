import { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair, Minus, Plus } from 'lucide-react';
import { Map, setWorkerUrl, type GeoJSONSource, type MapGeoJSONFeature, type MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PublicFacility } from './types';
import { globeContextLabelsVisibleForZoom, GLOBE_TO_MERCATOR_ZOOM, projectionForZoom } from './map-camera';
import { boundsOfPoints, buildSearchRevealSteps, pointsForResultFraming, type RevealPoint } from './map-reveal';
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
};

const REMOTE_STYLE = 'https://tiles.openfreemap.org/styles/positron';
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
const MAPLIBRE_WORKER_URL = '/maplibre-gl-worker.mjs';
const GLOBE_SUPPRESSED_LABEL_LAYERS = [
  'label_country_1',
  'label_country_2',
  'label_country_3',
  'water_name_point_label',
  'water_name_line_label',
] as const;

if (typeof window !== 'undefined') setWorkerUrl(MAPLIBRE_WORKER_URL);

function featureCollection(facilities: PublicFacility[]) {
  return {
    type: 'FeatureCollection' as const,
    features: facilities.map((facility) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [facility.longitude, facility.latitude] },
      properties: { id: facility.id, name: facility.name, trust: facility.trust, productCount: facility.productCount },
    })),
  };
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

function rewriteOpenFreeMapGlyphUrl(url: string) {
  return url
    .replace(/Open(?:%20|\\s)Sans(?:%20|\\s)Bold/g, 'Noto%20Sans%20Bold')
    .replace(/Open(?:%20|\\s)Sans(?:%20|\\s)Regular/g, 'Noto%20Sans%20Regular')
    .replace(/Open(?:%20|\\s)Sans(?:%20|\\s)Italic/g, 'Noto%20Sans%20Italic');
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

export function TrunkMap({ facilities, selectedId, onSelect, onBoundsChange, onRevealStateChange, revealKey = null }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const facilitiesRef = useRef(facilities);
  const rotating = useRef(true);
  const cameraMode = useRef<CameraMode>('resting_globe');
  const rotationFrame = useRef<number | null>(null);
  const rotationResumeTimer = useRef<number | null>(null);
  const revealToken = useRef(0);
  const revealRunningRef = useRef(false);
  const lastRevealKey = useRef<string | null>(null);
  const pointerInside = useRef(false);
  const initialStyleReady = useRef(false);
  const lastBoundsKey = useRef<string | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [basemap, setBasemap] = useState<'vector' | 'raster'>('vector');
  const [mapRetryKey, setMapRetryKey] = useState(0);
  const [rotationState, setRotationState] = useState<'idle' | 'rotating' | 'paused' | 'reduced'>('idle');
  const [cameraModeState, setCameraModeState] = useState<CameraMode>('resting_globe');
  const [revealRunning, setRevealRunning] = useState(false);
  const [revealLabel, setRevealLabel] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.35);
  const [projection, setProjection] = useState<'globe' | 'mercator'>('globe');
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
    const map = new Map({
      container: container.current,
      style: REMOTE_STYLE,
      transformRequest: (url, resourceType) => ({
        url: resourceType === 'Glyphs' ? rewriteOpenFreeMapGlyphUrl(url) : url,
      }),
      center: [1.22, 6.13],
      zoom: 1.35,
      minZoom: 1,
      maxZoom: 18,
      attributionControl: false,
      cooperativeGestures: false,
      dragPan: true,
      dragRotate: true,
      touchZoomRotate: true,
    });
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
      const initialGlobe = !fallbackApplied && projectionForZoom(map.getZoom()) === 'globe';
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
      source?.setData(featureCollection(facilitiesRef.current));
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
      onBoundsChange?.(next);
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
    // Prefer the vector style, but recover automatically to a lightweight OSM
    // raster style when the provider or its worker cannot render the first map.
    // This keeps the map visible on cold/mobile networks instead of leaving a
    // blank canvas while preserving retryability.
    fallbackTimer = window.setTimeout(() => {
      if (!initialStyleReady.current && mapRef.current === map && !fallbackApplied) {
        fallbackApplied = true;
        setBasemap('raster');
        setMapStatus('loading');
        map.stop();
        rotating.current = false;
        cameraMode.current = 'manual_navigation';
        setCameraModeState('manual_navigation');
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
      }
    }, 8_000);
    readinessTimer = window.setTimeout(() => {
      if (!initialStyleReady.current && mapRef.current === map) setMapStatus('error');
    }, 18_000);
    let globeProjection = true;
    const syncProjection = () => {
      const wantsGlobe = !fallbackApplied && projectionForZoom(map.getZoom()) === 'globe';
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
      globeProjection = !fallbackApplied && map.getZoom() < GLOBE_TO_MERCATOR_ZOOM;
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
      map.remove();
      mapRef.current = null;
    };

    function addLayers(target: Map) {
      if (target.getSource(SOURCE)) return;
      target.addSource(SOURCE, { type: 'geojson', data: featureCollection(facilitiesRef.current), cluster: true, clusterMaxZoom: 8, clusterRadius: 48 });
      // Facilities and clusters are visible MapLibre features, so the basemap and public presence
      // reproject in the same render cycle during drag, rotate and zoom. The accessible HTML list
      // below is only the keyboard fallback; it is not a second visual marker renderer.
      target.addLayer({ id: 'omni-cluster-rings', type: 'circle', source: SOURCE, filter: ['has', 'point_count'], paint: { 'circle-color': '#d8d8d8', 'circle-radius': ['step', ['get', 'point_count'], 28, 10, 36, 30, 46], 'circle-stroke-color': '#777777', 'circle-stroke-width': 1.5, 'circle-stroke-opacity': 0.55, 'circle-opacity': 0.2 } });
      target.addLayer({ id: 'omni-clusters', type: 'circle', source: SOURCE, filter: ['has', 'point_count'], paint: { 'circle-color': '#222222', 'circle-radius': ['step', ['get', 'point_count'], 15, 10, 19, 30, 23], 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2, 'circle-opacity': 0.96 } });
      target.addLayer({ id: 'omni-cluster-count', type: 'symbol', source: SOURCE, filter: ['has', 'point_count'], layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 11, 'text-font': ['Noto Sans Bold'] }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#222222', 'text-halo-width': 0.8 } });
      target.addLayer({ id: 'omni-pins', type: 'circle', source: SOURCE, filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#111111', 'circle-radius': 7, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2, 'circle-opacity': 0.98 } });
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
          onSelect(facility);
          target.easeTo({ center: [facility.longitude, facility.latitude], zoom: Math.max(target.getZoom(), 5.2), duration: 700 });
        }
      });
      for (const layer of ['omni-clusters', 'omni-pins']) {
        target.on('mouseenter', layer, () => { target.getCanvas().style.cursor = 'pointer'; });
        target.on('mouseleave', layer, () => { target.getCanvas().style.cursor = ''; });
      }
    }
  }, [mapRetryKey, onBoundsChange, onSelect, scheduleUserPosition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !revealKey || revealKey === lastRevealKey.current || !facilities.length) return;
    lastRevealKey.current = revealKey;
    const token = revealToken.current + 1;
    revealToken.current = token;
    revealRunningRef.current = true;
    onRevealStateChange?.(true);
    cameraMode.current = 'search_reveal';
    setCameraModeState('search_reveal');
    setRevealRunning(true);
    setRevealLabel('Recherche mondiale');
    rotating.current = false;
    if (rotationFrame.current !== null) window.cancelAnimationFrame(rotationFrame.current);
    if (rotationResumeTimer.current !== null) window.clearTimeout(rotationResumeTimer.current);
    const steps = buildSearchRevealSteps(facilities, userPositionRef.current);
    const isStale = () => token !== revealToken.current;
    const wait = (duration: number) => new Promise<void>((resolve) => window.setTimeout(resolve, duration));
    const finish = async () => {
      if (isStale()) return;
      const finalPoints = pointsForResultFraming(facilities, userPositionRef.current);
      const finalBounds = boundsOfPoints(finalPoints);
      cameraMode.current = 'result_framing';
      setCameraModeState('result_framing');
      setRevealLabel('Facilités trouvées');
      if (finalBounds) {
        const [[west, south], [east, north]] = finalBounds;
        if (Math.abs(east - west) < 0.0001 && Math.abs(north - south) < 0.0001) {
          map.easeTo({ center: [west, south], zoom: RESULT_LOCAL_ZOOM, duration: 800, essential: true });
        } else {
          map.fitBounds(finalBounds, { padding: { top: 120, right: 76, bottom: 230, left: 76 }, maxZoom: RESULT_MAX_ZOOM, duration: 900, essential: true });
        }
        await waitForMapMove(map, 1500);
      }
      if (isStale()) return;
      revealRunningRef.current = false;
      onRevealStateChange?.(false);
      setRevealRunning(false);
      setRevealLabel(null);
      cameraMode.current = map.getZoom() < GLOBE_TO_MERCATOR_ZOOM ? 'resting_globe' : 'manual_navigation';
      setCameraModeState(cameraMode.current);
      if (cameraMode.current === 'resting_globe') {
        rotating.current = true;
        setRotationState('idle');
      }
    };
    const run = async () => {
      map.stop();
      for (const step of steps) {
        if (isStale()) return;
        setRevealLabel(step.label);
        map.flyTo({ center: step.center, zoom: step.zoom, duration: 650, speed: 0.55, curve: 1.12, essential: true });
        await waitForMapMove(map, 1250);
        await wait(step.pause);
      }
      await finish();
    };
    void run();
    return () => {
      if (token === revealToken.current) {
        revealToken.current += 1;
        revealRunningRef.current = false;
        onRevealStateChange?.(false);
        setRevealRunning(false);
        setRevealLabel(null);
        if (cameraMode.current === 'search_reveal') {
          cameraMode.current = 'manual_navigation';
          setCameraModeState('manual_navigation');
        }
      }
    };
  }, [facilities, onRevealStateChange, revealKey]);

  useEffect(() => {
    const source = mapRef.current?.getSource(SOURCE) as GeoJSONSource | undefined;
    source?.setData(featureCollection(facilities));
    scheduleUserPosition();
  }, [facilities, scheduleUserPosition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer('omni-pins')) map.setPaintProperty('omni-pins', 'circle-color', '#111111');
    if (!selectedId) return;
    const selected = facilities.find((facility) => facility.id === selectedId);
    if (!selected || map.isMoving()) return;
    cameraMode.current = 'selected_facility';
    setCameraModeState('selected_facility');
    map.easeTo({ center: [selected.longitude, selected.latitude], zoom: Math.max(map.getZoom(), 5.2), duration: 650, essential: true });
  }, [facilities, selectedId]);

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
    <div className="map-stage omni-stage-viewport" data-motion={prefersReducedMotion ? 'reduced' : 'full'} data-map-status={mapStatus} data-basemap={basemap} data-projection={projection} data-camera-mode={cameraModeState} data-reveal-stage={revealLabel ?? 'idle'} data-zoom-enabled="true" data-zoom={zoom.toFixed(2)} data-bearing={bearing.toFixed(2)} data-center-lng={centerLongitude.toFixed(4)} data-rotation={rotationState} data-location={locationState} data-user-position={userPosition ? 'visible' : 'hidden'} data-rotation-owner="map-only">
      <div ref={container} className="map-canvas" aria-label="Carte de découverte Omni" />
      {mapStatus === 'ready' && screenUserPosition && <div className="user-position-overlay" style={{ left: screenUserPosition.left, top: screenUserPosition.top }} role="img" aria-label={locationState === 'approximate' ? 'Votre zone approximative sur la carte' : 'Votre position sur la carte'}><span className="user-position-marker omni-user-marker-ring" /></div>}
      {revealRunning && revealLabel && <div className="map-reveal-status" role="status" aria-live="polite"><span className="sr-only">{revealLabel}</span><div className="omni-progress-track" aria-hidden="true"><span /></div></div>}
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
