import { useEffect, useState } from "react";

type MapLibreGlobal = {
  Map: new (options: Record<string, unknown>) => MapInstance;
  Marker: new (options?: Record<string, unknown>) => MarkerInstance;
};

export type MapMouseEvent = { lngLat: { lat: number; lng: number } };

export type MapInstance = {
  on: (event: string, cb: (e: MapMouseEvent) => void) => void;
  remove: () => void;
  flyTo: (opts: Record<string, unknown>) => void;
  jumpTo: (opts: Record<string, unknown>) => void;
  fitBounds: (
    bounds: [[number, number], [number, number]],
    opts?: Record<string, unknown>,
  ) => void;
  getZoom: () => number;
  setProjection: (projection: Record<string, unknown>) => void;
  getSource: (id: string) => { setData: (data: unknown) => void } | undefined;
  addSource: (id: string, source: Record<string, unknown>) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  isStyleLoaded: () => boolean;
  resize: () => void;
};


export type MarkerInstance = {
  setLngLat: (coords: [number, number]) => MarkerInstance;
  addTo: (map: MapInstance) => MarkerInstance;
  remove: () => void;
};

let loader: Promise<MapLibreGlobal> | null = null;

function loadMapLibre(): Promise<MapLibreGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (loader) return loader;
  loader = (async () => {
    await import("maplibre-gl/dist/maplibre-gl.css");
    const mod = await import("maplibre-gl");
    return (mod.default ?? mod) as unknown as MapLibreGlobal;
  })();
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
