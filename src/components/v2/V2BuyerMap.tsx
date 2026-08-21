import { useEffect, useRef } from "react";
import type { DiscoveryBounds, PublicFacility } from "../../contracts/discovery";

type V2BuyerMapProps = {
  facilities: PublicFacility[];
  onBoundsChange: (bounds: DiscoveryBounds) => void;
};

type MapInstance = import("maplibre-gl").Map;
type MarkerInstance = import("maplibre-gl").Marker;

export function V2BuyerMap({ facilities, onBoundsChange }: V2BuyerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onBoundsChange);
  const facilitiesRef = useRef(facilities);
  const mapRef = useRef<MapInstance | null>(null);
  const markersRef = useRef<MarkerInstance[]>([]);

  useEffect(() => {
    callbackRef.current = onBoundsChange;
    facilitiesRef.current = facilities;

    const map = mapRef.current;
    if (map?.isStyleLoaded()) {
      void syncMarkers(map, facilities);
    }
  }, [facilities, onBoundsChange]);

  useEffect(() => {
    let disposed = false;
    let map: MapInstance | undefined;
    let rotationFrame: number | undefined;
    let lastTimestamp = 0;
    let userInteracting = false;

    const emitBounds = () => {
      if (!map || disposed) return;
      const bounds = map.getBounds();
      callbackRef.current({
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
        zoom: map.getZoom(),
      });
    };

    const handleLoad = () => {
      if (!map || disposed) return;
      // MapLibre applies globe reliably after the style has loaded. The
      // constructor projection keeps the first frame correct; this call makes
      // the runtime state explicit for style reloads and deployments.
      map.setProjection({ type: "globe" });
      void syncMarkers(map, facilitiesRef.current);
      emitBounds();
    };

    const start = async () => {
      if (!containerRef.current) return;
      const maplibre = await import("maplibre-gl");
      if (disposed || !containerRef.current) return;

      map = new maplibre.Map({
        container: containerRef.current,
        style: "https://demotiles.maplibre.org/style.json",
        center: [0, 16],
        zoom: 1.1,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ showCompass: true }), "bottom-left");
      map.on("load", handleLoad);
      map.on("styledata", () => {
        if (map?.isStyleLoaded()) void syncMarkers(map, facilitiesRef.current);
      });
      map.on("moveend", emitBounds);
      map.on("dragstart", () => { userInteracting = true; });
      map.on("zoomstart", () => { userInteracting = true; });
      map.on("rotatestart", () => { userInteracting = true; });
      map.on("moveend", () => {
        window.setTimeout(() => { userInteracting = false; }, 900);
      });

      const rotate = (timestamp: number) => {
        if (disposed || !map) return;
        const elapsed = lastTimestamp ? timestamp - lastTimestamp : 0;
        lastTimestamp = timestamp;
        if (!userInteracting && !map.isMoving()) {
          const center = map.getCenter();
          map.setCenter([center.lng + elapsed * 0.0018, center.lat]);
        }
        rotationFrame = window.requestAnimationFrame(rotate);
      };
      rotationFrame = window.requestAnimationFrame(rotate);
    };

    void start();

    return () => {
      disposed = true;
      if (rotationFrame) window.cancelAnimationFrame(rotationFrame);
      if (map) {
        markersRefForMap(map).forEach((marker) => marker.remove());
        markerRegistry.delete(map);
      }
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="v2-map-canvas" aria-label="Globe Omni V2" />;
}

async function syncMarkers(map: MapInstance, facilities: PublicFacility[]) {
  const { Marker } = await import("maplibre-gl");
  markersRefForMap(map).forEach((marker) => marker.remove());
  const nextMarkers = facilities.map((facility) => {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "v2-facility-pin";
    marker.title = facility.name;
    marker.setAttribute("aria-label", facility.name);
    return new Marker({ element: marker })
      .setLngLat([facility.longitude, facility.latitude])
      .addTo(map);
  });
  markersRefForMap(map).splice(0, markersRefForMap(map).length, ...nextMarkers);
}

const markerRegistry = new WeakMap<MapInstance, MarkerInstance[]>();
function markersRefForMap(map: MapInstance) {
  const existing = markerRegistry.get(map);
  if (existing) return existing;
  const created: MarkerInstance[] = [];
  markerRegistry.set(map, created);
  return created;
}
