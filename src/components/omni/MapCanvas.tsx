import { useEffect, useRef } from "react";
import {
  applyPastelPalette,
  PASTEL_STYLE_URL,
  useMapLibre,
  type MapInstance,
} from "@/lib/maplibre";
import { type FacilityRow } from "@/lib/omni";
import { loadBoundariesForZoom, resetBoundaryState } from "@/lib/boundaries/loader";

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
};

const GLOBE_ZOOM = 5;
const GLOBE_START_ZOOM = 1.25;
const GLOBE_START_CENTER: [number, number] = [8, 7];
const FLY_IN_DURATION = 2500;

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
}: Props) {
  const gl = useMapLibre();
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const readyRef = useRef(false);
  const flownRef = useRef(false);
  const userMarkerRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!gl || !containerRef.current || mapRef.current) return;
    const target = marketCenter ?? { lat: 6.1725, lng: 1.2314 };

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

    map.on("load", () => {
      readyRef.current = true;
      applyPastelPalette(map);

      map.addSource("omni-facilities", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "omni-points",
        type: "circle",
        source: "omni-facilities",
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

      map.addSource("omni-route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "omni-route-line",
        type: "line",
        source: "omni-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#a45f2d", "line-width": 4, "line-opacity": 0.82 },
      });

      void loadBoundariesForZoom(map, GLOBE_START_ZOOM);
    });

    let globe = true;
    const refreshLivingBoundary = () => {
      const z = map.getZoom();
      const wantsGlobe = z <= GLOBE_ZOOM;
      if (wantsGlobe !== globe) {
        globe = wantsGlobe;
        map.setProjection({ type: wantsGlobe ? "globe" : "mercator" });
      }
      void loadBoundariesForZoom(map, z);
    };

    map.on("zoom", refreshLivingBoundary);
    map.on("moveend", refreshLivingBoundary);

    map.on("click", (e) => {
      clickRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    map.on("click", "omni-points", (e) => {
      const feat = e.features?.[0];
      if (!feat) return;
      const id = feat.properties?.["id"] as string;
      const f = facilities.find((x) => x.id === id);
      if (f) selectRef.current?.(f);
    });

    map.on("mouseenter", "omni-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "omni-points", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      resetBoundaryState();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
      flownRef.current = false;
    };
  }, [gl, interactive, marketCenter?.lat, marketCenter?.lng, marketZoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !marketCenter || flownRef.current) return;
    flownRef.current = true;
    setTimeout(() => {
      map.flyTo({
        center: [marketCenter.lng, marketCenter.lat],
        zoom: marketZoom,
        duration: FLY_IN_DURATION,
        speed: 0.8,
      });
    }, 800);
  }, [marketCenter, marketZoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!gl || !map || !readyRef.current) return;
    const source = map.getSource("omni-facilities") as
      | { setData: (data: unknown) => void }
      | undefined;
    source?.setData(facilitiesToGeoJSON(facilities));
  }, [gl, facilities]);

  useEffect(() => {
    const map = mapRef.current;
    if (!gl || !map || !readyRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (!userPosition) return;

    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "999px";
    el.style.background = "#2f6fb5";
    el.style.border = "3px solid #fff";
    el.style.boxShadow = "0 0 0 6px rgba(47,111,181,.22)";
    const { Marker } = gl as unknown as {
      Marker: new (opts: { element: HTMLDivElement }) => {
        setLngLat: (c: [number, number]) => { addTo: (m: MapInstance) => unknown };
      };
    };
    const marker = new Marker({ element: el });
    marker.setLngLat([userPosition.lng, userPosition.lat]).addTo(map);
    userMarkerRef.current = marker;
  }, [gl, userPosition]);

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
    if (!map || !focus) return;
    map.flyTo({ center: [focus.lng, focus.lat], zoom: focus.zoom ?? 15, speed: 1.3 });
  }, [focus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitPoints || fitPoints.length === 0) return;
    if (fitPoints.length === 1) {
      const p = fitPoints[0]!;
      map.flyTo({ center: [p.lng, p.lat], zoom: 15.5, speed: 1.3 });
      return;
    }
    const lats = fitPoints.map((p) => p.lat);
    const lngs = fitPoints.map((p) => p.lng);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: { top: 80, bottom: 220, left: 40, right: 40 }, maxZoom: 16, duration: 900 },
    );
  }, [fitPoints]);

  function zoomBy(delta: number) {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: map.getZoom() + delta, duration: 250 });
  }

  function recenterUser() {
    const map = mapRef.current;
    if (!map) return;
    const target = userPosition ?? marketCenter;
    if (!target) return;
    map.flyTo({
      center: [target.lng, target.lat],
      zoom: userPosition ? 15.5 : marketZoom,
      speed: 1.3,
    });
  }

  return (
    <div ref={containerRef} className={`${className ?? "h-full w-full"} relative`}>
      <div className="pointer-events-auto absolute left-3 top-1/2 z-10 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-[var(--shadow-soft)] backdrop-blur">
        <button
          type="button"
          aria-label="Zoom avant"
          onClick={() => zoomBy(1)}
          className="grid h-10 w-10 place-items-center text-lg font-bold transition-colors hover:bg-background/70"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom arrière"
          onClick={() => zoomBy(-1)}
          className="grid h-10 w-10 place-items-center border-y border-border/70 text-lg font-bold transition-colors hover:bg-background/70"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Recentrer sur ma position"
          onClick={recenterUser}
          className="grid h-10 w-10 place-items-center text-lg font-bold transition-colors hover:bg-background/70"
        >
          ◎
        </button>
      </div>

      {!gl && (
        <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
          Chargement de la carte…
        </div>
      )}
    </div>
  );
}
