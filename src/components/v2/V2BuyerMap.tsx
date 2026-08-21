import { useEffect, useRef } from "react";
import type { DiscoveryBounds, PublicFacility } from "../../contracts/discovery";

type V2BuyerMapProps = {
  facilities: PublicFacility[];
  onBoundsChange: (bounds: DiscoveryBounds) => void;
};

export function V2BuyerMap({ facilities, onBoundsChange }: V2BuyerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onBoundsChange);
  const facilitiesRef = useRef(facilities);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);

  useEffect(() => {
    callbackRef.current = onBoundsChange;
    facilitiesRef.current = facilities;
  }, [facilities, onBoundsChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    let markers: Array<import("maplibre-gl").Marker> = [];
    let cancelled = false;

    void import("maplibre-gl").then(({ Marker }) => {
      if (cancelled || !map.isStyleLoaded()) return;
      markers = facilitiesRef.current.map((facility) => {
        const marker = document.createElement("button");
        marker.type = "button";
        marker.className = "v2-facility-pin";
        marker.title = facility.name;
        marker.setAttribute("aria-label", facility.name);
        marker.textContent = "";
        return new Marker({ element: marker })
          .setLngLat([facility.longitude, facility.latitude])
          .addTo(map);
      });
    });

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
    };
  }, [facilities]);

  useEffect(() => {
    let disposed = false;
    let map: import("maplibre-gl").Map | undefined;
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

    const start = async () => {
      if (!containerRef.current) return;
      const maplibre = await import("maplibre-gl");
      if (disposed || !containerRef.current) return;

      map = new maplibre.Map({
        container: containerRef.current,
        style: "https://demotiles.maplibre.org/style.json",
        center: [1.224, 6.1316],
        zoom: 1.35,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      });
      mapRef.current = map;
      map.setProjection({ type: "globe" });
      map.addControl(new maplibre.NavigationControl({ showCompass: true }), "bottom-left");
      map.on("load", emitBounds);
      map.on("moveend", emitBounds);
      map.on("dragstart", () => {
        userInteracting = true;
      });
      map.on("zoomstart", () => {
        userInteracting = true;
      });
      map.on("rotatestart", () => {
        userInteracting = true;
      });
      map.on("moveend", () => {
        window.setTimeout(() => {
          userInteracting = false;
        }, 900);
      });

      const rotate = (timestamp: number) => {
        if (disposed || !map) return;
        const elapsed = lastTimestamp ? timestamp - lastTimestamp : 0;
        lastTimestamp = timestamp;
        if (!userInteracting && !map.isMoving()) {
          map.setCenter([map.getCenter().lng + elapsed * 0.0018, map.getCenter().lat]);
        }
        rotationFrame = window.requestAnimationFrame(rotate);
      };
      rotationFrame = window.requestAnimationFrame(rotate);
    };

    void start();

    return () => {
      disposed = true;
      if (rotationFrame) window.cancelAnimationFrame(rotationFrame);
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="v2-map-canvas" aria-label="Globe Omni V2" />;
}
