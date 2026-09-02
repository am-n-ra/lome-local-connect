import { useEffect, useRef, useState } from "react";
import {
  applyPastelPalette,
  setGlobeLabelVisibility,
  PASTEL_STYLE_URL,
  rewriteOpenFreeMapGlyphUrl,
  useMapLibreState,
  type MapInstance,
} from "@/lib/maplibre";
import { LOCATION_APPROXIMATE_ACCURACY_METERS, type FacilityRow } from "@/lib/omni";
import {
  clearHighlight,
  highlightBoundaryAtTarget,
  loadBoundariesForZoom,
  resetBoundaryState,
} from "@/lib/boundaries/loader";
import { shouldCancelReveal, type CameraMode, type RevealInterruptReason } from "@/lib/map-globe-state";

export type MapFacility = FacilityRow & {
  isPro?: boolean;
  mobile_presence?: boolean;
  product_count?: number;
  min_price?: number | null;
  max_discount_percent?: number | null;
  matched_product_id?: string | null;
  matched_product_name?: string | null;
  matched_product_price?: number | null;
  matched_product_quantity?: number | null;
  matched_product_photo_url?: string | null;
};

type Props = {
  facilities: MapFacility[];
  selectedId?: string | null;
  onSelect?: (facility: MapFacility) => void;
  routeCoords?: [number, number][] | null;
  userPosition?: { lat: number; lng: number; accuracy?: number | null } | null;
  /** Raw browser estimate shown only as neutral uncertainty context when accuracy is poor. */
  approximatePosition?: { lat: number; lng: number; accuracy?: number | null } | null;
  focus?: { lat: number; lng: number; zoom?: number } | null;
  fitPoints?: { lat: number; lng: number }[] | null;
  marketCenter?: { lat: number; lng: number } | null;
  marketZoom?: number;
  interactive?: boolean;
  className?: string;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  /** A stable key that starts a new globe-to-result reveal. */
  revealKey?: string | null;
  /** Keeps the resting globe visually clean until the user searches. */
  showFacilities?: boolean;
  /** Shows the user marker only in an active search/final framing state. */
  showUserLocation?: boolean;
  onRevealStateChange?: (running: boolean) => void;
  onViewportChange?: (viewport: {
    west: number;
    south: number;
    east: number;
    north: number;
    zoom: number;
  }) => void;
};

const GLOBE_ZOOM = 5;
const GLOBE_START_ZOOM = 0.8;
const GLOBE_START_CENTER: [number, number] = [8, 7];
const RESET_DURATION = 900;
const REVEAL_FLIGHT_DURATION = 1250;
const REVEAL_PAUSE_DURATION = 1400;
// Positive longitude motion makes the visible earth travel left-to-right around
// the stable vertical axis from a standing viewer’s perspective. Calibrated in the
// browser against the requested Africa/Europe → Asia → Americas → Africa sequence.
const RESTING_LONGITUDE_DIRECTION = 1;
const ROTATION_DEGREES_PER_SECOND = 2.8;
const IDLE_RESUME_DELAY = 1800;

const REVEAL_STEPS = [
  { label: "Continent", zoom: 2.15, pause: REVEAL_PAUSE_DURATION },
  { label: "Pays", zoom: 5.35, pause: REVEAL_PAUSE_DURATION },
  { label: "Région", zoom: 8.25, pause: REVEAL_PAUSE_DURATION },
  { label: "Ville / zone", zoom: 11.25, pause: REVEAL_PAUSE_DURATION },
  { label: "Votre position", zoom: 14.2, pause: 0 },
] as const;

function facilitiesToGeoJSON(facilities: MapFacility[]) {
  const mappableFacilities = facilities.filter(
    (f) => Number.isFinite(f.longitude) && Number.isFinite(f.latitude),
  );

  return {
    type: "FeatureCollection" as const,
    features: mappableFacilities.map((f) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [f.longitude, f.latitude] },
      id: f.id,
      properties: {
        id: f.id,
        name: f.name,
        status: f.status,
        type: f.type,
        isPro: f.isPro ?? false,
        mobile_presence: f.mobile_presence ?? false,
      },
    })),
  };
}

function getTargetPoint(
  userPosition: { lat: number; lng: number } | null | undefined,
  marketCenter: { lat: number; lng: number } | null | undefined,
) {
  return userPosition ?? marketCenter ?? null;
}

function setFacilitiesVisibility(map: MapInstance, visible: boolean) {
  for (const layerId of [
    "omni-clusters",
    "omni-cluster-count",
    "omni-point-pulse",

    "omni-point-halo",
    "omni-points",
    "omni-pin-icons",
    "omni-point-labels",
  ]) {
    try {
      const labelLayer = layerId === "omni-point-labels";
      const labelsVisible = map.getZoom() > GLOBE_ZOOM;
      map.setLayoutProperty(
        layerId,
        "visibility",
        visible && (!labelLayer || labelsVisible) ? "visible" : "none",
      );
    } catch {
      // The map may not have loaded its style layer yet.
    }
  }
}

const PIN_IMAGE_ID = "omni-pin-icon";
const USER_ACCURACY_SOURCE_ID = "omni-user-accuracy";
const USER_ACCURACY_FILL_LAYER_ID = "omni-user-accuracy-fill";
const USER_ACCURACY_OUTLINE_LAYER_ID = "omni-user-accuracy-outline";

function emptyGeoJSON() {
  return { type: "FeatureCollection" as const, features: [] };
}

function accuracyCircleToGeoJSON(
  position: { lat: number; lng: number },
  accuracy: number | null | undefined,
) {
  if (!Number.isFinite(accuracy) || !accuracy || accuracy <= 0) return emptyGeoJSON();
  const earthRadiusMeters = 6_378_137;
  const angularDistance = accuracy / earthRadiusMeters;
  const latitude = (position.lat * Math.PI) / 180;
  const longitude = (position.lng * Math.PI) / 180;
  const coordinates: [number, number][] = [];

  for (let index = 0; index <= 64; index += 1) {
    const bearing = (index / 64) * Math.PI * 2;
    const circleLatitude = Math.asin(
      Math.sin(latitude) * Math.cos(angularDistance) +
        Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const circleLongitude =
      longitude +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
        Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(circleLatitude),
      );
    coordinates.push([
      (((circleLongitude * 180) / Math.PI + 540) % 360) - 180,
      (circleLatitude * 180) / Math.PI,
    ]);
  }

  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        geometry: { type: "Polygon" as const, coordinates: [coordinates] },
        properties: { accuracy },
      },
    ],
  };
}

function setAccuracyCircle(
  map: MapInstance,
  position: { lat: number; lng: number } | null | undefined,
  accuracy: number | null | undefined,
) {
  const source = map.getSource(USER_ACCURACY_SOURCE_ID);
  source?.setData(position ? accuracyCircleToGeoJSON(position, accuracy) : emptyGeoJSON());
}

function ensurePinImage(map: MapInstance) {
  const imageMap = map as MapInstance & {
    hasImage?: (id: string) => boolean;
    addImage?: (id: string, image: unknown, options?: Record<string, unknown>) => void;
  };
  if (!imageMap.hasImage || !imageMap.addImage || imageMap.hasImage(PIN_IMAGE_ID)) return;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, size, size);
  context.beginPath();
  context.arc(size / 2, 24, 14, 0, Math.PI * 2);
  context.lineTo(size / 2, 57);
  context.lineTo(size / 2 - 9, 39);
  context.closePath();
  context.fillStyle = "#e2793f";
  context.fill();
  context.lineWidth = 4;
  context.strokeStyle = "#ffffff";
  context.stroke();
  context.beginPath();
  context.arc(size / 2, 24, 4, 0, Math.PI * 2);
  context.fillStyle = "#ffffff";
  context.fill();
  imageMap.addImage(PIN_IMAGE_ID, context.getImageData(0, 0, size, size), { pixelRatio: 2 });
}

function hasLayer(map: MapInstance, id: string) {
  return Boolean(map.getStyle()?.layers?.some((layer) => layer.id === id));
}

function addOmniLayers(map: MapInstance, showFacilities: boolean) {
  ensurePinImage(map);
  if (!map.getSource(USER_ACCURACY_SOURCE_ID)) {
    map.addSource(USER_ACCURACY_SOURCE_ID, {
      type: "geojson",
      data: emptyGeoJSON(),
    });
  }
  if (!hasLayer(map, USER_ACCURACY_FILL_LAYER_ID)) {
    map.addLayer({
      id: USER_ACCURACY_FILL_LAYER_ID,
      type: "fill",
      source: USER_ACCURACY_SOURCE_ID,
      paint: {
        "fill-color": "#245646",
        "fill-opacity": 0.1,
      },
    });
  }
  if (!hasLayer(map, USER_ACCURACY_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: USER_ACCURACY_OUTLINE_LAYER_ID,
      type: "line",
      source: USER_ACCURACY_SOURCE_ID,
      paint: {
        "line-color": "#245646",
        "line-width": 1.5,
        "line-opacity": 0.45,
        "line-dasharray": [2, 2],
      },
    });
  }
  if (!map.getSource("omni-facilities")) {
    map.addSource("omni-facilities", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      promoteId: "id",
      cluster: true,
      clusterMaxZoom: 8,
      clusterRadius: 48,
    });
  }
  if (!hasLayer(map, "omni-clusters")) {
    map.addLayer({
      id: "omni-clusters",
      type: "circle",
      source: "omni-facilities",
      filter: ["has", "point_count"],
      layout: { visibility: showFacilities ? "visible" : "none" },
      paint: {
        "circle-color": "#2d3335",
        "circle-radius": ["step", ["get", "point_count"], 18, 20, 23, 100, 29],
        "circle-stroke-color": "#e2793f",
        "circle-stroke-width": 3,
        "circle-opacity": 0.93,
      },
    });
  }
  if (!hasLayer(map, "omni-cluster-count")) {
    map.addLayer({
      id: "omni-cluster-count",
      type: "symbol",
      source: "omni-facilities",
      filter: ["has", "point_count"],
      layout: {
        visibility: showFacilities ? "visible" : "none",
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 11,
        "text-font": ["Open Sans Bold"],
      },
      paint: { "text-color": "#ffffff" },
    });
  }
  if (!hasLayer(map, "omni-point-pulse")) {
    map.addLayer({
      id: "omni-point-pulse",
      type: "circle",
      source: "omni-facilities",
      filter: ["!", ["has", "point_count"]],
      layout: { visibility: showFacilities ? "visible" : "none" },
      paint: {
        "circle-color": "#e2793f",
        "circle-radius": 14,
        "circle-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.25, 0],
        "circle-blur": 0.35,
      },
    });
  }
  if (!hasLayer(map, "omni-point-halo")) {

    map.addLayer({
      id: "omni-point-halo",
      type: "circle",
      source: "omni-facilities",
      filter: ["!", ["has", "point_count"]],
      layout: { visibility: showFacilities ? "visible" : "none" },
      paint: {
        "circle-color": "#ffffff",
        "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 16, 13],
        "circle-opacity": 0.9,
        "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 1],
        "circle-stroke-color": ["case", ["boolean", ["feature-state", "selected"], false], "#e2793f", "#2d3335"],
      },
    });
  }
  if (!hasLayer(map, "omni-points")) {
    map.addLayer({
      id: "omni-points",
      type: "circle",
      source: "omni-facilities",
      filter: ["!", ["has", "point_count"]],
      layout: { visibility: showFacilities ? "visible" : "none" },
      paint: {
        "circle-color": [
          "match",
          ["get", "status"],
          "confirmed",
          "#4f9d69",
          "certified",
          "#2d3335",
          "unconfirmed",
          "#e2793f",
          "unclaimed",
          "#f6eee4",
          "#d97724",
        ],
        "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 12, 9],
        "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 2],
        "circle-stroke-color": ["case", ["boolean", ["feature-state", "selected"], false], "#e2793f", "#2d3335"],
        "circle-opacity": 0.98,
      },
    });
  }
  if (!hasLayer(map, "omni-pin-icons")) {
    map.addLayer({
      id: "omni-pin-icons",
      type: "symbol",
      source: "omni-facilities",
      filter: ["!", ["has", "point_count"]],
      layout: {
        visibility: showFacilities ? "visible" : "none",
        "icon-image": PIN_IMAGE_ID,
        "icon-size": ["case", ["boolean", ["feature-state", "selected"], false], 1.18, 0.92],
        "icon-anchor": "bottom",
        "icon-offset": [0, -5],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: {
        "icon-color": [
          "match",
          ["get", "status"],
          "certified",
          "#2d3335",
          "confirmed",
          "#4f9d69",
          "unclaimed",
          "#f6eee4",
          "#d97724",
        ],
        "icon-opacity": 1,
        "icon-halo-color": "#ffffff",
        "icon-halo-width": 1.5,
        "icon-halo-blur": 0.15,
      },
    });
  }
  if (!hasLayer(map, "omni-point-labels")) {
    map.addLayer({
      id: "omni-point-labels",
      type: "symbol",
      source: "omni-facilities",
      filter: ["!", ["has", "point_count"]],
      layout: {
        visibility: showFacilities ? "visible" : "none",
        "text-field": ["get", "name"],
        "text-size": 11,
        "text-offset": [0, 1.45],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#2d2520",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.4,
      },
    });
  }

  if (!map.getSource("omni-route")) {
    map.addSource("omni-route", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }
  if (!hasLayer(map, "omni-route-line")) {
    map.addLayer({
      id: "omni-route-line",
      type: "line",
      source: "omni-route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#a45f2d", "line-width": 4, "line-opacity": 0.82 },
    });
  }
}

function waitForRenderFrames(frameCount = 2): Promise<void> {
  return new Promise((resolve) => {
    let remaining = frameCount;
    const nextFrame = () => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
        return;
      }
      window.requestAnimationFrame(nextFrame);
    };
    window.requestAnimationFrame(nextFrame);
  });
}

function waitForMapSettle(map: MapInstance, timeout = 2600): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      void waitForRenderFrames(2).then(resolve);
    };
    const timeoutId = window.setTimeout(finish, timeout);
    map.once("moveend", finish);
  });
}

function waitForDuration(duration: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function renderedFacilityCount(map: MapInstance) {
  const canvas = map.getCanvas();
  const points = [
    { x: canvas.width / 2, y: canvas.height / 2 },
    { x: canvas.width * 0.25, y: canvas.height * 0.35 },
    { x: canvas.width * 0.75, y: canvas.height * 0.35 },
    { x: canvas.width * 0.25, y: canvas.height * 0.65 },
    { x: canvas.width * 0.75, y: canvas.height * 0.65 },
  ];
  const ids = new Set<string | number>();
  for (const point of points) {
    for (const feature of map.queryRenderedFeatures(point, { layers: ["omni-points"] })) {
      if (feature.id != null) ids.add(feature.id);
    }
  }
  return ids.size;
}

export type ViewportSnapshot = {
  west: number;
  south: number;
  east: number;
  north: number;
  zoom: number;
};

function clampViewportCoordinate(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function readViewportSnapshot(map: MapInstance): ViewportSnapshot | null {
  const mapWithBounds = map as MapInstance & {
    getBounds?: () => {
      getWest: () => number;
      getSouth: () => number;
      getEast: () => number;
      getNorth: () => number;
    };
  };
  const bounds = mapWithBounds.getBounds?.();
  const zoom = map.getZoom();
  if (!bounds || !Number.isFinite(zoom)) return null;

  const west = clampViewportCoordinate(bounds.getWest(), -180, 180);
  const east = clampViewportCoordinate(bounds.getEast(), -180, 180);
  const rawSouth = clampViewportCoordinate(bounds.getSouth(), -85, 85);
  const rawNorth = clampViewportCoordinate(bounds.getNorth(), -85, 85);
  if (![west, east, rawSouth, rawNorth].every(Number.isFinite)) return null;

  return {
    west,
    south: Math.min(rawSouth, rawNorth),
    east,
    north: Math.max(rawSouth, rawNorth),
    zoom: clampViewportCoordinate(zoom, 0, 24),
  };
}

function debugMapEvent(map: MapInstance, event: string, details: Record<string, unknown> = {}) {
  if (!import.meta.env.DEV) return;
  console.debug("[OmniMap]", event, {
    zoom: Number(map.getZoom().toFixed(3)),
    center: map.getCenter(),
    ...details,
  });
}

function fitMapToPoints(
  map: MapInstance,
  points: { lat: number; lng: number }[] | null | undefined,
) {
  if (!points || points.length === 0) return;
  if (points.length === 1) {
    const point = points[0]!;
    map.flyTo({
      center: [point.lng, point.lat],
      zoom: 15.5,
      duration: 900,
      speed: 0.8,
      essential: true,
    });
    return;
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  map.fitBounds(
    [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    {
      padding: { top: 80, bottom: 220, left: 40, right: 40 },
      maxZoom: 16,
      duration: 1000,
    },
  );
}

export function MapCanvas({
  facilities,
  selectedId,
  onSelect,
  routeCoords,
  userPosition,
  approximatePosition,
  focus,
  fitPoints,
  marketCenter,
  marketZoom = 12.2,
  interactive = true,
  className,
  onMapClick,
  revealKey = null,
  showFacilities = true,
  showUserLocation = true,
  onRevealStateChange,
  onViewportChange,
}: Props) {
  const { gl, error: mapLoadError, retry: retryMapLibre } = useMapLibreState();
  const [revealLabel, setRevealLabel] = useState<string | null>(null);
  const [revealRunning, setRevealRunning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [mapReadyVersion, setMapReadyVersion] = useState(0);

  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;
  const viewportChangeRef = useRef(onViewportChange);
  viewportChangeRef.current = onViewportChange;
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const facilitiesRef = useRef(facilities);
  facilitiesRef.current = facilities;
  const fitPointsRef = useRef(fitPoints);
  fitPointsRef.current = fitPoints;
  const routeCoordsRef = useRef(routeCoords);
  routeCoordsRef.current = routeCoords;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const readyRef = useRef(false);
  const revealTokenRef = useRef(0);
  const lastRevealKeyRef = useRef<string | null>(null);
  const revealRunningRef = useRef(false);
  const rotationFrameRef = useRef<number | null>(null);
  const rotationResumeRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const revealPauseTimerRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const showFacilitiesRef = useRef(showFacilities);
  showFacilitiesRef.current = showFacilities;
  const styleReadyRef = useRef(false);
  const styleRecoveryTimerRef = useRef<number | null>(null);
  const userMarkerRef = useRef<{ remove: () => void } | null>(null);
  const approximateMarkerRef = useRef<{ remove: () => void } | null>(null);
  const userPositionRef = useRef(userPosition);
  userPositionRef.current = userPosition;
  const cameraModeRef = useRef<CameraMode>("resting_globe");

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotionRef.current = query.matches;
      setReducedMotion(query.matches);
    };
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!gl || !containerRef.current || mapRef.current) return;

    const map = new gl.Map({
      container: containerRef.current,
      style: PASTEL_STYLE_URL,
      transformRequest: (url: string, resourceType: string) => ({
        url: resourceType === "Glyphs" ? rewriteOpenFreeMapGlyphUrl(url) : url,
      }),
      center: GLOBE_START_CENTER,
      zoom: GLOBE_START_ZOOM,
      interactive,
      attributionControl: true,
      projection: { type: "globe" },
    });
    mapRef.current = map;

    const stopRotation = () => {
      if (rotationFrameRef.current != null) {
        window.cancelAnimationFrame(rotationFrameRef.current);
        rotationFrameRef.current = null;
      }
    };

    const scheduleIdleRotation = (delay = IDLE_RESUME_DELAY) => {
      stopRotation();
      if (rotationResumeRef.current != null) window.clearTimeout(rotationResumeRef.current);
      if (
        reducedMotionRef.current ||
        revealRunningRef.current ||
        cameraModeRef.current !== "resting_globe" ||
        map.getZoom() > GLOBE_ZOOM
      )
        return;
      rotationResumeRef.current = window.setTimeout(() => {
        rotationResumeRef.current = null;
        if (
          reducedMotionRef.current ||
          revealRunningRef.current ||
          cameraModeRef.current !== "resting_globe" ||
          map.getZoom() > GLOBE_ZOOM
        )
          return;
        let previousTime = performance.now();
        const rotate = (time: number) => {
          if (
            reducedMotionRef.current ||
            revealRunningRef.current ||
            cameraModeRef.current !== "resting_globe" ||
            map.getZoom() > GLOBE_ZOOM
          ) {
            stopRotation();
            return;
          }
          const elapsedSeconds = Math.min(0.1, Math.max(0, time - previousTime) / 1000);
          previousTime = time;
          const center = map.getCenter();
          map.jumpTo({
            center: [
              center.lng +
                RESTING_LONGITUDE_DIRECTION * ROTATION_DEGREES_PER_SECOND * elapsedSeconds,
              center.lat,
            ],
            bearing: 0,
            pitch: 0,
          });
          rotationFrameRef.current = window.requestAnimationFrame(rotate);
        };
        rotationFrameRef.current = window.requestAnimationFrame(rotate);
      }, delay);
    };

    let viewportTimer: number | null = null;
    let initialViewportTimer: number | null = null;
    const emitViewport = (reason = "event") => {
      if (viewportTimer != null) window.clearTimeout(viewportTimer);
      viewportTimer = window.setTimeout(() => {
        const viewport = readViewportSnapshot(map);
        if (!viewport) {
          debugMapEvent(map, "viewport-unavailable", { reason });
          return;
        }
        debugMapEvent(map, "viewport-ready", { reason, viewport });
        viewportChangeRef.current?.(viewport);
      }, 180);
    };
    const emitInitialViewport = () => {
      emitViewport("initial-ready");
      if (initialViewportTimer != null) window.clearTimeout(initialViewportTimer);
      initialViewportTimer = window.setTimeout(() => emitViewport("initial-fallback"), 900);
    };
    const handleMoveEnd = () => emitViewport("moveend");

    const cancelActiveReveal = (reason: RevealInterruptReason) => {
      if (!revealRunningRef.current || !shouldCancelReveal(reason)) return;
      revealTokenRef.current += 1;
      if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
      if (revealPauseTimerRef.current != null) window.clearTimeout(revealPauseTimerRef.current);
      map.stop();
      revealRunningRef.current = false;
      cameraModeRef.current = "manual_navigation";
      setFacilitiesVisibility(map, showFacilitiesRef.current);
      setRevealRunning(false);
      onRevealStateChange?.(false);
      setRevealLabel(null);
      debugMapEvent(map, "search-reveal-cancelled", { reason });
    };

    const pauseForInteraction = () => {
      stopRotation();
      if (rotationResumeRef.current != null) window.clearTimeout(rotationResumeRef.current);
      rotationResumeRef.current = null;
      cancelActiveReveal("manual_interaction");
      cameraModeRef.current = "manual_navigation";
    };

    const reapplyOmniState = () => {
      addOmniLayers(map, showFacilitiesRef.current);
      const facilitiesSource = map.getSource("omni-facilities");
      facilitiesSource?.setData(facilitiesToGeoJSON(facilitiesRef.current));
      const routeSource = map.getSource("omni-route");
      routeSource?.setData(
        routeCoordsRef.current && routeCoordsRef.current.length >= 2
          ? {
              type: "Feature",
              geometry: { type: "LineString", coordinates: routeCoordsRef.current },
              properties: {},
            }
          : { type: "FeatureCollection", features: [] },
      );
      for (const facility of facilitiesRef.current) {
        map.setFeatureState(
          { source: "omni-facilities", id: facility.id },
          { selected: facility.id === selectedIdRef.current },
        );
      }
      setFacilitiesVisibility(map, showFacilitiesRef.current && !revealRunningRef.current);
    };

    const applyLoadedStyle = () => {
      if (!map.isStyleLoaded()) return;
      if (styleRecoveryTimerRef.current != null) {
        window.clearTimeout(styleRecoveryTimerRef.current);
        styleRecoveryTimerRef.current = null;
      }
      styleReadyRef.current = true;
      readyRef.current = true;
      debugMapEvent(map, "style-ready", { mapStatus: "ready", cameraMode: cameraModeRef.current });
      setMapReadyVersion((version) => version + 1);
      if (map.getZoom() <= GLOBE_ZOOM) map.setProjection({ type: "globe" });
      containerRef.current?.setAttribute(
        "data-omni-projection",
        map.getZoom() <= GLOBE_ZOOM ? "globe" : "mercator",
      );
      map.resize();
      applyPastelPalette(map);
      setGlobeLabelVisibility(map, map.getZoom() > GLOBE_ZOOM);
      reapplyOmniState();
      void loadBoundariesForZoom(map, map.getZoom()).then(() => {
        if (map.getZoom() <= GLOBE_ZOOM && userPositionRef.current) {
          highlightBoundaryAtTarget(map, map.getZoom(), userPositionRef.current);
        }
      });
      cameraModeRef.current = "resting_globe";
      setMapStatus("ready");
      scheduleIdleRotation(600);
      emitInitialViewport();
    };

    map.on("load", applyLoadedStyle);
    map.on("style.load", applyLoadedStyle);
    map.once("idle", () => emitViewport("idle"));
    map.on("error", () => {
      debugMapEvent(map, "style-error", { styleReady: styleReadyRef.current });
      if (!styleReadyRef.current) setMapStatus("error");
    });
    styleRecoveryTimerRef.current = window.setTimeout(() => {
      if (!styleReadyRef.current) setMapStatus("error");
    }, 8000);

    let globe = true;
    const refreshLivingBoundary = () => {
      const zoom = map.getZoom();
      const wantsGlobe = zoom <= GLOBE_ZOOM;
      debugMapEvent(map, "projection-check", {
        wantsGlobe,
        cameraMode: cameraModeRef.current,
      });
      if (wantsGlobe !== globe) {
        globe = wantsGlobe;
        map.setProjection({ type: wantsGlobe ? "globe" : "mercator" });
        if (wantsGlobe && cameraModeRef.current === "manual_navigation") {
          cameraModeRef.current = "resting_globe";
        }
      }
      containerRef.current?.setAttribute("data-omni-projection", wantsGlobe ? "globe" : "mercator");
      setGlobeLabelVisibility(map, !wantsGlobe);
      void loadBoundariesForZoom(map, zoom).then(() => {
        if (wantsGlobe && userPositionRef.current) {
          highlightBoundaryAtTarget(map, zoom, userPositionRef.current);
        }
      });
    };

    map.on("zoom", refreshLivingBoundary);
    map.on("moveend", refreshLivingBoundary);
    map.on("moveend", handleMoveEnd);
    map.on("dragstart", pauseForInteraction);
    map.on("zoomstart", pauseForInteraction);
    map.on("rotatestart", pauseForInteraction);
    map.on("mousedown", pauseForInteraction);
    map.on("touchstart", pauseForInteraction);
    map.on("wheel", pauseForInteraction);

    map.on("click", (event) => {
      pauseForInteraction();
      clickRef.current?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });

    map.on("click", "omni-clusters", (event) => {
      pauseForInteraction();
      const feature = event.features?.[0];
      const clusterId = feature?.properties?.["cluster_id"];
      const source = map.getSource("omni-facilities") as
        | {
            getClusterExpansionZoom?: (
              id: number,
              callback: (error: unknown, zoom: number) => void,
            ) => void;
          }
        | undefined;
      if (clusterId == null || !source?.getClusterExpansionZoom) return;
      source.getClusterExpansionZoom(Number(clusterId), (error, zoom) => {
        if (error) return;
        const coordinates: [number, number] = [event.lngLat.lng, event.lngLat.lat];
        map.easeTo({ center: coordinates, zoom, duration: 420 });
      });
    });

    map.on("click", "omni-points", (event) => {
      pauseForInteraction();
      const feature = event.features?.[0];
      if (!feature) return;
      const id = feature.properties?.["id"] as string;
      const facility = facilitiesRef.current.find((item) => item.id === id);
      if (facility) selectRef.current?.(facility);
    });

    map.on("mouseenter", "omni-clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "omni-clusters", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("mouseenter", "omni-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "omni-points", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      if (rotationFrameRef.current != null) window.cancelAnimationFrame(rotationFrameRef.current);
      if (rotationResumeRef.current != null) window.clearTimeout(rotationResumeRef.current);
      if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
      if (revealPauseTimerRef.current != null) window.clearTimeout(revealPauseTimerRef.current);
      if (styleRecoveryTimerRef.current != null) window.clearTimeout(styleRecoveryTimerRef.current);
      if (viewportTimer != null) window.clearTimeout(viewportTimer);
      if (initialViewportTimer != null) window.clearTimeout(initialViewportTimer);
      const mapWithOff = map as MapInstance & {
        off?: (event: string, listener: () => void) => void;
      };
      mapWithOff.off?.("moveend", handleMoveEnd);
      approximateMarkerRef.current?.remove();
      approximateMarkerRef.current = null;
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      resetBoundaryState();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
      revealRunningRef.current = false;
    };
  }, [gl, interactive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    setFacilitiesVisibility(map, showFacilities && !revealRunningRef.current);
  }, [showFacilities]);

  useEffect(() => {
    const map = mapRef.current;
    if (!gl || !map || !readyRef.current) return;
    addOmniLayers(map, showFacilities);
    const source = map.getSource("omni-facilities") as
      { setData: (data: unknown) => void } | undefined;
    const geojson = facilitiesToGeoJSON(facilities);
    source?.setData(geojson);
    setFacilitiesVisibility(map, showFacilities && !revealRunning);
    debugMapEvent(map, "facilities-rendered", {
      facilityCount: facilities.length,
      mappableCount: geojson.features.length,
      visible: showFacilities && !revealRunning,
    });

    // Apparition douce des pins quand un nouveau jeu de résultats arrive.
    if (reducedMotionRef.current || !geojson.features.length) return;
    let frame: number | null = null;
    const start = performance.now();
    const duration = 340;
    const step = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      try {
        map.setPaintProperty("omni-points", "circle-opacity", 0.2 + eased * 0.78);
        map.setPaintProperty("omni-point-halo", "circle-opacity", eased * 0.9);
        map.setPaintProperty("omni-pin-icons", "icon-opacity", eased);
      } catch {
        return;
      }
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => {
      if (frame != null) window.cancelAnimationFrame(frame);
    };
  }, [gl, facilities, mapReadyVersion, revealRunning, showFacilities]);

  // Halo pulsé sur le pin sélectionné.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !selectedId || reducedMotion) return;
    let frame: number | null = null;
    const start = performance.now();
    const loop = (time: number) => {
      const phase = ((time - start) % 1800) / 1800;
      try {
        map.setPaintProperty("omni-point-pulse", "circle-radius", 14 + phase * 22);
        map.setPaintProperty("omni-point-pulse", "circle-opacity", [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          Math.max(0, 0.32 * (1 - phase)),
          0,
        ]);
      } catch {
        return;
      }
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => {
      if (frame != null) window.cancelAnimationFrame(frame);
      try {
        map.setPaintProperty("omni-point-pulse", "circle-opacity", 0);
      } catch {
        /* la carte peut déjà être démontée */
      }
    };
  }, [mapReadyVersion, reducedMotion, selectedId]);


  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    for (const facility of facilities) {
      map.setFeatureState(
        { source: "omni-facilities", id: facility.id },
        { selected: facility.id === selectedId },
      );
    }
  }, [facilities, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!gl || !map || !readyRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (approximateMarkerRef.current) {
      approximateMarkerRef.current.remove();
      approximateMarkerRef.current = null;
    }
    setAccuracyCircle(map, approximatePosition ?? null, approximatePosition?.accuracy ?? null);
    if (approximatePosition) {
      const estimateElement = document.createElement("div");
      estimateElement.setAttribute("aria-label", "Centre réseau approximatif");
      estimateElement.dataset["omniApproximateMarker"] = "network";
      estimateElement.style.position = "relative";
      estimateElement.style.width = "28px";
      estimateElement.style.height = "28px";
      estimateElement.style.pointerEvents = "none";
      estimateElement.style.zIndex = "10";
      estimateElement.innerHTML = `
        <span style="position:absolute;left:50%;top:50%;width:14px;height:14px;transform:translate(-50%,-50%);border-radius:999px;background:#747b7d;border:3px solid #fff;box-shadow:0 0 0 5px rgba(116,123,125,.18),0 2px 8px rgba(15,23,42,.22);"></span>
      `;
      approximateMarkerRef.current = new gl.Marker({ element: estimateElement, anchor: "center" })
        .setLngLat([approximatePosition.lng, approximatePosition.lat])
        .addTo(map);
    }
    if (!showUserLocation || !userPosition) return;

    const isApproximate =
      userPosition.accuracy != null && userPosition.accuracy > LOCATION_APPROXIMATE_ACCURACY_METERS;
    const markerLabel = isApproximate ? "Position approximative (réseau)" : "Position GPS précise";
    const markerChip = isApproximate ? "Position ≈" : "Votre position";
    const element = document.createElement("div");
    element.setAttribute("aria-label", markerLabel);
    element.title = markerLabel;
    element.dataset["omniUserMarker"] = isApproximate ? "approximate-network" : "exact";
    element.dataset["omniUserLat"] = String(userPosition.lat);
    element.dataset["omniUserLng"] = String(userPosition.lng);
    element.dataset["omniUserAccuracy"] = String(userPosition.accuracy ?? "");
    element.style.position = "relative";
    element.style.width = "30px";
    element.style.height = "38px";
    element.style.pointerEvents = "none";
    element.style.zIndex = "20";
    element.innerHTML = `
      <span style="position:absolute;left:50%;top:-22px;transform:translateX(-50%);display:block;white-space:nowrap;border-radius:999px;background:#245646;color:#fff;border:2px solid #fff;padding:3px 6px;font:700 10px/1 system-ui,sans-serif;box-shadow:0 2px 8px rgba(15,23,42,.22);">${markerChip}</span>
      <span style="position:absolute;inset:${isApproximate ? "-8px -8px 0 -8px" : "0 2px 6px 2px"};display:block;transform:rotate(-45deg);border-radius:55% 55% 55% 0;background:#245646;border:3px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,.32),0 0 0 6px rgba(36,86,70,.18);">
        <span style="position:absolute;left:50%;top:50%;width:8px;height:8px;transform:translate(-50%,-50%) rotate(45deg);border-radius:999px;background:#fff;box-shadow:0 0 0 2px #245646;"></span>
      </span>
      ${isApproximate ? '<span style="position:absolute;right:-18px;top:-10px;display:block;border-radius:999px;background:#fff;color:#245646;border:1px solid #245646;padding:1px 4px;font:600 10px/1 system-ui,sans-serif;">≈</span>' : ""}
    `;
    const marker = new gl.Marker({ element, anchor: "bottom" });
    marker.setLngLat([userPosition.lng, userPosition.lat]).addTo(map);
    userMarkerRef.current = marker;
  }, [approximatePosition, gl, mapReadyVersion, showUserLocation, userPosition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let tries = 0;
    const apply = () => {
      const source = map.getSource("omni-route");
      if (!source) {
        if (tries++ < 40) window.setTimeout(apply, 150);
        return;
      }
      source.setData(
        routeCoords && routeCoords.length >= 2
          ? {
              type: "Feature",
              geometry: { type: "LineString", coordinates: routeCoords },
              properties: {},
            }
          : { type: "FeatureCollection", features: [] },
      );
    };
    apply();
  }, [routeCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus || revealRunningRef.current) return;
    cameraModeRef.current = "selected_facility";
    map.flyTo({
      center: [focus.lng, focus.lat],
      zoom: focus.zoom ?? 15,
      duration: 900,
      speed: 0.8,
      curve: 1.1,
      essential: true,
    });
  }, [focus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !revealKey || revealKey === lastRevealKeyRef.current) return;

    lastRevealKeyRef.current = revealKey;
    revealTokenRef.current += 1;
    const token = revealTokenRef.current;
    revealRunningRef.current = true;
    cameraModeRef.current = "search_reveal";
    debugMapEvent(map, "search-reveal-start", { revealKey });
    setRevealRunning(true);
    onRevealStateChange?.(true);
    setRevealLabel("Recherche mondiale");
    setFacilitiesVisibility(map, false);

    if (rotationFrameRef.current != null) window.cancelAnimationFrame(rotationFrameRef.current);
    if (rotationResumeRef.current != null) window.clearTimeout(rotationResumeRef.current);
    if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
    if (revealPauseTimerRef.current != null) window.clearTimeout(revealPauseTimerRef.current);

    const target = getTargetPoint(userPosition, marketCenter);
    const approximateTarget = target ?? {
      lat: GLOBE_START_CENTER[1],
      lng: GLOBE_START_CENTER[0],
    };
    const waypoints = REVEAL_STEPS.map((step) => ({
      ...step,
      label: step.label === "Votre position" && !userPosition ? "Marché approximatif" : step.label,
      center: [approximateTarget.lng, approximateTarget.lat] as [number, number],
      zoom: step.label === "Votre position" ? (userPosition ? 14.2 : marketZoom) : step.zoom,
    }));

    const cancelIfStale = () => token !== revealTokenRef.current;
    const finish = async () => {
      if (cancelIfStale()) return;
      const source = map.getSource("omni-facilities");
      source?.setData(facilitiesToGeoJSON(facilitiesRef.current));
      cameraModeRef.current = "result_framing";
      fitMapToPoints(map, fitPointsRef.current);
      await waitForMapSettle(map, 3000);
      if (cancelIfStale()) return;
      setFacilitiesVisibility(map, showFacilities);
      const repaintableMap = map as MapInstance & { triggerRepaint?: () => void };
      repaintableMap.triggerRepaint?.();
      await waitForRenderFrames(2);
      if (showFacilities && facilitiesRef.current.length > 0 && renderedFacilityCount(map) === 0) {
        fitMapToPoints(map, fitPointsRef.current);
        await waitForMapSettle(map, 1800);
        setFacilitiesVisibility(map, true);
        repaintableMap.triggerRepaint?.();
        await waitForRenderFrames(2);
      }
      revealRunningRef.current = false;
      cameraModeRef.current = map.getZoom() <= GLOBE_ZOOM ? "resting_globe" : "manual_navigation";
      setFacilitiesVisibility(map, showFacilitiesRef.current);
      setRevealRunning(false);
      onRevealStateChange?.(false);
      setRevealLabel(null);
    };

    const runStep = async (index: number) => {
      if (cancelIfStale()) return;
      const step = waypoints[index];
      if (!step) {
        await finish();
        return;
      }

      setRevealLabel(step.label);
      map.flyTo({
        center: step.center,
        zoom: step.zoom,
        duration: REVEAL_FLIGHT_DURATION,
        speed: 0.55,
        curve: 1.15,
        essential: true,
      });
      await waitForMapSettle(map, REVEAL_FLIGHT_DURATION + 2200);
      if (cancelIfStale()) return;
      await loadBoundariesForZoom(map, step.zoom);
      await waitForRenderFrames(3);
      if (cancelIfStale()) return;
      highlightBoundaryAtTarget(map, step.zoom, approximateTarget);
      await waitForDuration(step.pause);
      if (cancelIfStale()) return;
      if (index === waypoints.length - 1) {
        await finish();
        return;
      }
      await runStep(index + 1);
    };

    void (async () => {
      map.stop();
      clearHighlight(map);
      map.setProjection({ type: "globe" });
      map.flyTo({
        center: GLOBE_START_CENTER,
        zoom: GLOBE_START_ZOOM,
        bearing: 0,
        pitch: 0,
        duration: RESET_DURATION,
        speed: 0.55,
        curve: 1.15,
        essential: true,
      });
      await waitForMapSettle(map, RESET_DURATION + 2200);
      if (cancelIfStale()) return;
      await waitForDuration(350);
      await runStep(0);
    })();

    return () => {
      revealTokenRef.current += 1;
      if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
      if (revealPauseTimerRef.current != null) window.clearTimeout(revealPauseTimerRef.current);
      map.stop();
      revealRunningRef.current = false;
      cameraModeRef.current = map.getZoom() <= GLOBE_ZOOM ? "resting_globe" : "manual_navigation";
      setFacilitiesVisibility(map, showFacilitiesRef.current);
      setRevealRunning(false);
      onRevealStateChange?.(false);
      setRevealLabel(null);
    };
  }, [revealKey]);

  function zoomBy(delta: number) {
    const map = mapRef.current;
    if (!map) return;
    map.stop();
    map.easeTo({ zoom: map.getZoom() + delta, duration: 250 });
  }

  function recenterMap() {
    const map = mapRef.current;
    if (!map) return;
    const target = getTargetPoint(userPosition, marketCenter);
    if (!target) return;
    map.stop();
    map.flyTo({
      center: [target.lng, target.lat],
      zoom: userPosition ? 15.5 : marketZoom,
      duration: 900,
      speed: 0.8,
    });
  }

  return (
    <div
      className={`${className ?? "h-full w-full"} relative overflow-hidden`}
      style={{ backgroundColor: "#fbfaf7" }}
      data-omni-map-status={mapStatus}
      data-omni-reveal={revealRunning ? "running" : "idle"}
    >
      <div
        ref={containerRef}
        className="h-full w-full transition-opacity duration-200"
        style={{ opacity: mapStatus === "ready" ? 1 : 0 }}
      />
      <div className="pointer-events-auto absolute left-3 top-1/2 z-10 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-[var(--shadow-soft)] backdrop-blur">
        <button
          type="button"
          aria-label="Zoom avant"
          onClick={() => zoomBy(1)}
          className="grid h-11 w-11 place-items-center text-lg font-bold transition-colors hover:bg-background/70 active:scale-95"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom arrière"
          onClick={() => zoomBy(-1)}
          className="grid h-11 w-11 place-items-center border-y border-border/70 text-lg font-bold transition-colors hover:bg-background/70 active:scale-95"
        >
          −
        </button>
        <button
          type="button"
          aria-label={
            userPosition ? "Recentrer sur ma position exacte" : "Explorer le marché approximatif"
          }
          title={
            userPosition ? "Recentrer sur ma position exacte" : "Explorer le marché approximatif"
          }
          onClick={recenterMap}
          className="grid h-11 w-11 place-items-center text-lg font-bold transition-colors hover:bg-background/70 active:scale-95"
        >
          ◎
        </button>
      </div>

      {revealRunning && (
        <div className="pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2">
          <div className="omni-glass rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-foreground/80">
            {revealLabel}
          </div>
        </div>
      )}

      {reducedMotion && (
        <span className="sr-only">
          Les animations de globe sont réduites selon vos préférences.
        </span>
      )}

      {gl && mapStatus === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[#fbfaf7] text-foreground">
          <div className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs tracking-wide text-foreground/70 shadow-sm backdrop-blur">
            Chargement du globe MapLibre…
          </div>
        </div>
      )}

      {mapLoadError && (
        <div className="absolute left-1/2 top-20 z-10 w-[min(92vw,24rem)] -translate-x-1/2">
          <div className="omni-glass rounded-2xl px-4 py-3 text-center text-sm text-foreground">
            <p className="font-semibold">Données cartographiques indisponibles</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Le globe ne peut pas être chargé dans cet environnement. Réessayez pour relancer le
              chargement.
            </p>
            <button
              type="button"
              className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              onClick={retryMapLibre}
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {!gl && !mapLoadError && (
        <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
          Chargement de la carte…
        </div>
      )}
    </div>
  );
}
