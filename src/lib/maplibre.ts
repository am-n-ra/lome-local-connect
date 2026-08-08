import { useEffect, useState } from "react";

const MAPLIBRE_JS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
const MAPLIBRE_CSS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";

type MapLibreGlobal = {
  Map: new (options: Record<string, unknown>) => MapInstance;
  Marker: new (options?: Record<string, unknown>) => MarkerInstance;
};

export type MapInstance = {
  on: (event: string, cb: () => void) => void;
  remove: () => void;
  flyTo: (opts: Record<string, unknown>) => void;
  getSource: (id: string) => { setData: (data: unknown) => void } | undefined;
  addSource: (id: string, source: Record<string, unknown>) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  isStyleLoaded: () => boolean;
};

export type MarkerInstance = {
  setLngLat: (coords: [number, number]) => MarkerInstance;
  addTo: (map: MapInstance) => MarkerInstance;
  remove: () => void;
};

declare global {
  interface Window {
    maplibregl?: MapLibreGlobal;
  }
}

let loader: Promise<MapLibreGlobal> | null = null;

function loadMapLibre(): Promise<MapLibreGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (loader) return loader;

  loader = new Promise<MapLibreGlobal>((resolve, reject) => {
    if (!document.querySelector(`link[href="${MAPLIBRE_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = MAPLIBRE_CSS;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = MAPLIBRE_JS;
    script.async = true;
    script.onload = () => {
      if (window.maplibregl) resolve(window.maplibregl);
      else reject(new Error("maplibre indisponible"));
    };
    script.onerror = () => reject(new Error("échec du chargement de la carte"));
    document.head.appendChild(script);
  });
  return loader;
}

export function useMapLibre() {
  const [gl, setGl] = useState<MapLibreGlobal | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMapLibre()
      .then((lib) => {
        if (!cancelled) setGl(lib);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return gl;
}

export const CARTO_LIGHT_STYLE = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap, © CARTO",
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
} as const;
