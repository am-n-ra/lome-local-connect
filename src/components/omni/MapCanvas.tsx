import { useEffect, useRef } from "react";
import {
  CARTO_LIGHT_STYLE,
  useMapLibre,
  type MapInstance,
  type MarkerInstance,
} from "@/lib/maplibre";
import { LOME_CENTER, STATUS_COLOR, type FacilityRow } from "@/lib/omni";

export type MapFacility = FacilityRow & { isPro?: boolean };

type Props = {
  facilities: MapFacility[];
  selectedId?: string | null;
  onSelect?: (facility: MapFacility) => void;
  routeCoords?: [number, number][] | null;
  userPosition?: { lat: number; lng: number } | null;
  focus?: { lat: number; lng: number; zoom?: number } | null;
  initialCenter?: { lat: number; lng: number } | null;
  initialZoom?: number;
  interactive?: boolean;
  className?: string;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
};

/** Zoom under which the map switches to a 3D globe. */
const GLOBE_ZOOM = 5;

function markerElement(f: MapFacility, selected: boolean): HTMLDivElement {
  // Outer element is positioned by MapLibre (it owns `transform`/`position`).
  const el = document.createElement("div");
  el.style.cursor = "pointer";

  const inner = document.createElement("div");
  inner.style.position = "relative";
  inner.style.transform = selected ? "scale(1.35)" : "scale(1)";
  inner.style.transition = "transform .15s ease";
  el.appendChild(inner);

  const color = STATUS_COLOR[f.status] ?? "#9a938c";
  const pin = document.createElement("div");
  pin.style.width = "14px";
  pin.style.height = "14px";
  pin.style.borderRadius = "999px";
  pin.style.background = f.type === "mobile" ? "#ffffff" : color;
  pin.style.border = `2.5px solid ${f.type === "mobile" ? color : "#ffffff"}`;
  pin.style.boxShadow = "0 2px 6px rgba(60,40,20,.28)";
  inner.appendChild(pin);

  if (f.isPro) {
    const dot = document.createElement("span");
    dot.style.position = "absolute";
    dot.style.top = "-3px";
    dot.style.right = "-3px";
    dot.style.width = "6px";
    dot.style.height = "6px";
    dot.style.borderRadius = "999px";
    dot.style.background = "#e0a52a";
    dot.style.border = "1.5px solid #ffffff";
    inner.appendChild(dot);
  }
  return el;
}

export function MapCanvas({
  facilities,
  selectedId,
  onSelect,
  routeCoords,
  userPosition,
  focus,
  initialCenter,
  initialZoom,
  interactive = true,
  className,
  onMapClick,
}: Props) {
  const gl = useMapLibre();
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;
  const startRef = useRef({
    center: initialCenter ?? LOME_CENTER,
    zoom: initialZoom ?? 12.2,
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const readyRef = useRef(false);
  const markersRef = useRef<MarkerInstance[]>([]);
  const userMarkerRef = useRef<MarkerInstance | null>(null);

  useEffect(() => {
    if (!gl || !containerRef.current || mapRef.current) return;
    const start = startRef.current;
    const map = new gl.Map({
      container: containerRef.current,
      style: CARTO_LIGHT_STYLE,
      center: [start.center.lng, start.center.lat],
      zoom: start.zoom,
      interactive,
      attributionControl: true,
      projection: start.zoom <= GLOBE_ZOOM ? { type: "globe" } : { type: "mercator" },
    });
    mapRef.current = map;
    map.on("load", () => {
      readyRef.current = true;
      map.addSource("omni-route", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
      });
      map.addLayer({
        id: "omni-route-line",
        type: "line",
        source: "omni-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#1f7a4d", "line-width": 5, "line-opacity": 0.9 },
      });
    });
    // Flat city map when close in, 3D globe once the user zooms far out.
    let globe = start.zoom <= GLOBE_ZOOM;
    map.on("zoom", () => {
      const wantsGlobe = map.getZoom() <= GLOBE_ZOOM;
      if (wantsGlobe === globe) return;
      globe = wantsGlobe;
      map.setProjection({ type: wantsGlobe ? "globe" : "mercator" });
    });
    map.on("click", (e) => {
      clickRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, [gl, interactive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!gl || !map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = facilities.map((f) => {
      const el = markerElement(f, f.id === selectedId);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect?.(f);
      });
      return new gl.Marker({ element: el }).setLngLat([f.longitude, f.latitude]).addTo(map);
    });
  }, [gl, facilities, selectedId, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!gl || !map) return;
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    if (!userPosition) return;
    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "999px";
    el.style.background = "#2f6fb5";
    el.style.border = "3px solid #fff";
    el.style.boxShadow = "0 0 0 6px rgba(47,111,181,.22)";
    userMarkerRef.current = new gl.Marker({ element: el })
      .setLngLat([userPosition.lng, userPosition.lat])
      .addTo(map);
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
      source.setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: routeCoords ?? [] },
      });
    };
    apply();
  }, [routeCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo({ center: [focus.lng, focus.lat], zoom: focus.zoom ?? 15, speed: 1.3 });
  }, [focus]);

  return (
    <div ref={containerRef} className={className ?? "h-full w-full"}>
      {!gl && (
        <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
          Chargement de la carte…
        </div>
      )}
    </div>
  );
}
