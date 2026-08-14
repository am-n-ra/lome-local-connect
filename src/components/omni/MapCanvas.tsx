import { useEffect, useRef, useState } from "react";
import {
  applyPastelPalette,
  CARTO_LIGHT_STYLE,
  PASTEL_STYLE_URL,
  useMapLibre,
  type MapInstance,
} from "@/lib/maplibre";
import { type FacilityRow } from "@/lib/omni";
import {
  highlightBoundaryAtCenter,
  loadBoundariesForZoom,
  resetBoundaryState,
} from "@/lib/boundaries/loader";

export type MapFacility = FacilityRow & {
  isPro?: boolean;
  mobile_presence?: boolean;
};

type Props = {
  facilities: MapFacility[];
  selectedId?: string | null;
  onSelect?: (facility: MapFacility) => void;
  routeCoords?: [number, number][] | null;
  userPosition?: { lat: number; lng: number } | null;
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
};

const GLOBE_ZOOM = 5;
const GLOBE_START_ZOOM = 0.8;
const GLOBE_START_CENTER: [number, number] = [8, 7];
const RESET_DURATION = 900;
const REVEAL_FLIGHT_DURATION = 1250;
const REVEAL_PAUSE_DURATION = 560;
const ROTATION_STEP_DEGREES = 2;
const ROTATION_STEP_DURATION = 1600;
const IDLE_RESUME_DELAY = 2400;

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
  return userPosition ?? marketCenter ?? { lat: 6.13, lng: 1.22 };
}

function setFacilitiesVisibility(map: MapInstance, visible: boolean) {
  try {
    map.setLayoutProperty("omni-points", "visibility", visible ? "visible" : "none");
  } catch {
    // The map may not have loaded its style layer yet.
  }
}

function hasLayer(map: MapInstance, id: string) {
  return Boolean(map.getStyle()?.layers?.some((layer) => layer.id === id));
}

function addOmniLayers(map: MapInstance, showFacilities: boolean) {
  if (!map.getSource("omni-facilities")) {
    map.addSource("omni-facilities", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }
  if (!hasLayer(map, "omni-points")) {
    map.addLayer({
      id: "omni-points",
      type: "circle",
      source: "omni-facilities",
      layout: { visibility: showFacilities ? "visible" : "none" },
      paint: {
        "circle-color": [
          "match",
          ["get", "status"],
          "confirmed",
          "#d9a521",
          "certified",
          "#2f6fb5",
          "unconfirmed",
          "#9a938c",
          "unclaimed",
          "#b8b0a8",
          "#9a938c",
        ],
        "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 10, 7],
        "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 2],
        "circle-stroke-color": "#ffffff",
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

function CleanGlobeBackdrop({
  reducedMotion,
  revealing,
}: {
  reducedMotion: boolean;
  revealing: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`omni-globe-backdrop ${revealing ? "opacity-35" : "opacity-100"}`}
    >
      <div className={`omni-globe-orbit ${reducedMotion ? "omni-globe-static" : ""}`}>
        <svg viewBox="0 0 600 600" role="presentation" className="h-full w-full">
          <defs>
            <radialGradient id="omni-globe-light" cx="34%" cy="28%" r="74%">
              <stop offset="0" stopColor="#fffdf8" />
              <stop offset="0.42" stopColor="#f8e5d4" />
              <stop offset="0.78" stopColor="#ebbf9b" />
              <stop offset="1" stopColor="#c97c4d" />
            </radialGradient>
            <linearGradient id="omni-globe-land" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8b5e48" stopOpacity="0.42" />
              <stop offset="1" stopColor="#8b5e48" stopOpacity="0.12" />
            </linearGradient>
            <clipPath id="omni-globe-clip">
              <circle cx="300" cy="300" r="220" />
            </clipPath>
          </defs>
          <circle cx="300" cy="300" r="220" fill="url(#omni-globe-light)" />
          <g
            clipPath="url(#omni-globe-clip)"
            fill="none"
            stroke="#9d6d54"
            strokeOpacity="0.16"
            strokeWidth="2"
          >
            <ellipse cx="300" cy="300" rx="205" ry="88" />
            <ellipse cx="300" cy="300" rx="205" ry="156" />
            <ellipse cx="300" cy="300" rx="92" ry="220" />
            <ellipse cx="300" cy="300" rx="155" ry="220" />
          </g>
          <g
            clipPath="url(#omni-globe-clip)"
            fill="url(#omni-globe-land)"
            stroke="#8b5e48"
            strokeOpacity="0.15"
            strokeWidth="2"
          >
            <path d="M180 202c28-27 62-40 91-32l27 28-13 31-25 13-10 35-31 2-12-28-25-17z" />
            <path d="M286 195l31-18 32 10 25 28-12 24-28 2-14 30-16-12-2-26-22-14z" />
            <path d="M326 293l31-4 26 23 8 38-20 34-24 43-24-7 5-42-17-32z" />
            <path d="M407 205l42 18 31 35-15 20-34-7-18-24-24-9z" />
          </g>
          <circle
            cx="300"
            cy="300"
            r="220"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.82"
            strokeWidth="4"
          />
          <circle
            cx="250"
            cy="218"
            r="185"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.28"
            strokeWidth="12"
          />
        </svg>
      </div>
      <div className="omni-globe-signal omni-globe-signal-one" />
      <div className="omni-globe-signal omni-globe-signal-two" />
    </div>
  );
}

export function MapCanvas({
  facilities,
  selectedId,
  onSelect,
  routeCoords,
  userPosition,
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
}: Props) {
  const gl = useMapLibre();
  const [revealLabel, setRevealLabel] = useState<string | null>(null);
  const [revealRunning, setRevealRunning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading");

  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;
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
  const rotationIntervalRef = useRef<number | null>(null);
  const rotationResumeRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const revealPauseTimerRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const showFacilitiesRef = useRef(showFacilities);
  showFacilitiesRef.current = showFacilities;
  const styleReadyRef = useRef(false);
  const fallbackAttemptedRef = useRef(false);
  const styleRecoveryTimerRef = useRef<number | null>(null);
  const userMarkerRef = useRef<{ remove: () => void } | null>(null);

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
      center: GLOBE_START_CENTER,
      zoom: GLOBE_START_ZOOM,
      interactive,
      attributionControl: true,
      projection: { type: "globe" },
    });
    mapRef.current = map;

    const stopRotation = () => {
      if (rotationIntervalRef.current != null) {
        window.clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    };

    const scheduleIdleRotation = (delay = IDLE_RESUME_DELAY) => {
      stopRotation();
      if (rotationResumeRef.current != null) window.clearTimeout(rotationResumeRef.current);
      if (reducedMotionRef.current || revealRunningRef.current || map.getZoom() > GLOBE_ZOOM)
        return;
      rotationResumeRef.current = window.setTimeout(() => {
        rotationResumeRef.current = null;
        if (reducedMotionRef.current || revealRunningRef.current || map.getZoom() > GLOBE_ZOOM)
          return;
        rotationIntervalRef.current = window.setInterval(() => {
          if (reducedMotionRef.current || revealRunningRef.current || map.getZoom() > GLOBE_ZOOM) {
            stopRotation();
            return;
          }
          const currentBearing = map.getBearing();
          map.easeTo({
            bearing: currentBearing + ROTATION_STEP_DEGREES,
            duration: ROTATION_STEP_DURATION,
            easing: (value: number) => value,
            essential: false,
          });
        }, ROTATION_STEP_DURATION);
      }, delay);
    };

    const pauseForInteraction = () => {
      stopRotation();
      if (rotationResumeRef.current != null) window.clearTimeout(rotationResumeRef.current);
      rotationResumeRef.current = null;
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
      if (map.getZoom() <= GLOBE_ZOOM) map.setProjection({ type: "globe" });
      containerRef.current?.setAttribute(
        "data-omni-projection",
        map.getZoom() <= GLOBE_ZOOM ? "globe" : "mercator",
      );
      map.resize();
      applyPastelPalette(map);
      reapplyOmniState();
      void loadBoundariesForZoom(map, map.getZoom());
      setMapStatus(fallbackAttemptedRef.current ? "fallback" : "ready");
      scheduleIdleRotation(600);
    };

    const tryFallbackStyle = () => {
      if (fallbackAttemptedRef.current) {
        setMapStatus("error");
        return;
      }
      fallbackAttemptedRef.current = true;
      styleReadyRef.current = false;
      setMapStatus("fallback");
      map.stop();
      map.setStyle(CARTO_LIGHT_STYLE);
    };

    map.on("load", applyLoadedStyle);
    map.on("style.load", applyLoadedStyle);
    map.on("error", () => {
      if (!styleReadyRef.current) tryFallbackStyle();
    });
    styleRecoveryTimerRef.current = window.setTimeout(() => {
      if (!styleReadyRef.current) tryFallbackStyle();
    }, 8000);

    let globe = true;
    const refreshLivingBoundary = () => {
      const zoom = map.getZoom();
      const wantsGlobe = zoom <= GLOBE_ZOOM;
      if (wantsGlobe !== globe) {
        globe = wantsGlobe;
        map.setProjection({ type: wantsGlobe ? "globe" : "mercator" });
      }
      containerRef.current?.setAttribute("data-omni-projection", wantsGlobe ? "globe" : "mercator");
      void loadBoundariesForZoom(map, zoom);
    };

    map.on("zoom", refreshLivingBoundary);
    map.on("moveend", refreshLivingBoundary);
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

    map.on("click", "omni-points", (event) => {
      pauseForInteraction();
      const feature = event.features?.[0];
      if (!feature) return;
      const id = feature.properties?.["id"] as string;
      const facility = facilitiesRef.current.find((item) => item.id === id);
      if (facility) selectRef.current?.(facility);
    });

    map.on("mouseenter", "omni-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "omni-points", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      if (rotationIntervalRef.current != null) window.clearInterval(rotationIntervalRef.current);
      if (rotationResumeRef.current != null) window.clearTimeout(rotationResumeRef.current);
      if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
      if (revealPauseTimerRef.current != null) window.clearTimeout(revealPauseTimerRef.current);
      if (styleRecoveryTimerRef.current != null) window.clearTimeout(styleRecoveryTimerRef.current);
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
    const source = map.getSource("omni-facilities") as
      { setData: (data: unknown) => void } | undefined;
    source?.setData(facilitiesToGeoJSON(facilities));
  }, [gl, facilities]);

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
    if (!showUserLocation || !userPosition) return;

    const element = document.createElement("div");
    element.setAttribute("aria-label", "Votre position");
    element.style.width = "16px";
    element.style.height = "16px";
    element.style.borderRadius = "999px";
    element.style.background = "#2f6fb5";
    element.style.border = "3px solid #fff";
    element.style.boxShadow = "0 0 0 6px rgba(47,111,181,.22)";
    const { Marker } = gl as unknown as {
      Marker: new (opts: { element: HTMLDivElement }) => {
        setLngLat: (coords: [number, number]) => { addTo: (map: MapInstance) => unknown };
      };
    };
    const marker = new Marker({ element });
    marker.setLngLat([userPosition.lng, userPosition.lat]).addTo(map);
    userMarkerRef.current = marker as unknown as { remove: () => void };
  }, [gl, showUserLocation, userPosition]);

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
    if (!map || revealRunningRef.current) return;
    fitMapToPoints(map, fitPoints);
  }, [fitPoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !revealKey || revealKey === lastRevealKeyRef.current) return;

    lastRevealKeyRef.current = revealKey;
    revealTokenRef.current += 1;
    const token = revealTokenRef.current;
    revealRunningRef.current = true;
    setRevealRunning(true);
    onRevealStateChange?.(true);
    setRevealLabel("Recherche mondiale");
    setFacilitiesVisibility(map, false);

    if (rotationIntervalRef.current != null) window.clearInterval(rotationIntervalRef.current);
    if (rotationResumeRef.current != null) window.clearTimeout(rotationResumeRef.current);
    if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
    if (revealPauseTimerRef.current != null) window.clearTimeout(revealPauseTimerRef.current);

    map.stop();
    map.setProjection({ type: "globe" });
    map.flyTo({
      center: GLOBE_START_CENTER,
      zoom: GLOBE_START_ZOOM,
      bearing: map.getBearing() + 8,
      duration: RESET_DURATION,
      speed: 0.55,
      curve: 1.15,
      essential: true,
    });

    const target = getTargetPoint(userPosition, marketCenter);
    const waypoints = REVEAL_STEPS.map((step) => ({
      ...step,
      center: [target.lng, target.lat] as [number, number],
      zoom: step.label === "Votre position" ? (userPosition ? 14.2 : marketZoom) : step.zoom,
    }));

    const cancelIfStale = () => token !== revealTokenRef.current;
    const finish = () => {
      if (cancelIfStale()) return;
      revealRunningRef.current = false;
      setRevealRunning(false);
      onRevealStateChange?.(false);
      setRevealLabel(null);
      setFacilitiesVisibility(map, showFacilities);
      fitMapToPoints(map, fitPointsRef.current);
    };

    const runStep = (index: number) => {
      if (cancelIfStale()) return;
      const step = waypoints[index];
      if (!step) {
        finish();
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
      revealTimerRef.current = window.setTimeout(() => {
        if (cancelIfStale()) return;
        highlightBoundaryAtCenter(map, step.zoom);
        if (index === waypoints.length - 1) {
          finish();
          return;
        }
        revealPauseTimerRef.current = window.setTimeout(() => runStep(index + 1), step.pause);
      }, REVEAL_FLIGHT_DURATION);
    };

    revealTimerRef.current = window.setTimeout(() => runStep(0), RESET_DURATION + 350);

    return () => {
      revealTokenRef.current += 1;
      if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
      if (revealPauseTimerRef.current != null) window.clearTimeout(revealPauseTimerRef.current);
      map.stop();
      revealRunningRef.current = false;
      setRevealRunning(false);
      onRevealStateChange?.(false);
      setRevealLabel(null);
    };
  }, [marketCenter, marketZoom, onRevealStateChange, revealKey, showFacilities, userPosition]);

  function zoomBy(delta: number) {
    const map = mapRef.current;
    if (!map) return;
    map.stop();
    map.easeTo({ zoom: map.getZoom() + delta, duration: 250 });
  }

  function recenterUser() {
    const map = mapRef.current;
    if (!map) return;
    const target = getTargetPoint(userPosition, marketCenter);
    map.stop();
    map.flyTo({
      center: [target.lng, target.lat],
      zoom: userPosition ? 15.5 : marketZoom,
      duration: 900,
      speed: 0.8,
    });
  }

  return (
    <div className={`${className ?? "h-full w-full"} relative overflow-hidden`}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-auto absolute left-3 top-1/2 z-10 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-[var(--shadow-soft)] backdrop-blur">
        <button
          type="button"
          aria-label="Zoom avant"
          onClick={() => zoomBy(1)}
          className="grid h-10 w-10 place-items-center text-lg font-bold transition-colors hover:bg-background/70 active:scale-95"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom arrière"
          onClick={() => zoomBy(-1)}
          className="grid h-10 w-10 place-items-center border-y border-border/70 text-lg font-bold transition-colors hover:bg-background/70 active:scale-95"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Recentrer sur ma position"
          onClick={recenterUser}
          className="grid h-10 w-10 place-items-center text-lg font-bold transition-colors hover:bg-background/70 active:scale-95"
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
        <div className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2">
          <div className="omni-glass rounded-full px-4 py-2 text-xs text-muted-foreground">
            Chargement du globe MapLibre…
          </div>
        </div>
      )}

      {gl && mapStatus === "fallback" && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2">
          <div className="omni-glass rounded-full px-4 py-2 text-xs text-muted-foreground">
            Fond de carte de secours actif
          </div>
        </div>
      )}

      {gl && mapStatus === "error" && (
        <div className="absolute left-1/2 top-20 z-10 w-[min(92vw,24rem)] -translate-x-1/2">
          <div className="omni-glass rounded-2xl px-4 py-3 text-center text-sm text-foreground">
            <p className="font-semibold">Données cartographiques indisponibles</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Le globe MapLibre reste utilisable. Réessayez pour recharger le fond géographique.
            </p>
            <button
              type="button"
              className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {!gl && (
        <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
          Chargement de la carte…
        </div>
      )}
    </div>
  );
}
