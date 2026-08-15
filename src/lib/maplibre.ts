import { useEffect, useState } from "react";

type MapLibreGlobal = {
  Map: new (options: Record<string, unknown>) => MapInstance;
  Marker: new (options?: Record<string, unknown>) => MarkerInstance;
};

export type MapMouseEvent = {
  lngLat: { lat: number; lng: number };
  features?: { id?: string | number; properties?: Record<string, unknown> }[];
};

export type StyleLayer = { id: string; type: string };

export type MapInstance = {
  on: (
    event: string,
    layerOrCb: string | ((e: MapMouseEvent) => void),
    cb?: (e: MapMouseEvent) => void,
  ) => void;
  once: (event: string, cb: (e: MapMouseEvent) => void) => void;
  remove: () => void;
  setStyle: (style: string | object) => void;
  flyTo: (opts: Record<string, unknown>) => void;
  easeTo: (opts: Record<string, unknown>) => void;
  jumpTo: (opts: Record<string, unknown>) => void;
  stop: () => void;
  fitBounds: (bounds: [[number, number], [number, number]], opts?: Record<string, unknown>) => void;
  getZoom: () => number;
  getBearing: () => number;
  getCenter: () => { lng: number; lat: number };
  project: (lngLat: [number, number]) => { x: number; y: number };
  queryRenderedFeatures: (
    point: { x: number; y: number },
    opts?: { layers?: string[] },
  ) => { id?: string | number; properties?: Record<string, unknown> }[];
  setFeatureState: (
    source: { source: string; id?: string | number },
    state: Record<string, unknown>,
  ) => void;
  setProjection: (projection: Record<string, unknown>) => void;
  getSource: (id: string) =>
    | {
        setData: (data: unknown) => void;
        getClusterExpansionZoom?: (
          id: number,
          cb: (err: Error | null, zoom: number) => void,
        ) => void;
      }
    | undefined;
  addSource: (id: string, source: Record<string, unknown>) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  getStyle: () => { layers?: StyleLayer[] } | undefined;
  setPaintProperty: (layerId: string, name: string, value: unknown) => void;
  setLayoutProperty: (layerId: string, name: string, value: unknown) => void;
  isStyleLoaded: () => boolean;
  resize: () => void;
  getCanvas: () => HTMLCanvasElement;
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

/**
 * Free, key-less vector basemap (OpenFreeMap "positron"): near-white roads on a
 * desaturated base. `applyPastelPalette` then repaints water, land and
 * buildings with the OmniView landing palette.
 */
export const PASTEL_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const PASTEL = {
  water: "#15191b",
  green: "#ffffff",
  building: "#ffffff",
  background: "#f4f4f1",
};

/** Repaints a loaded vector style into the high-contrast Omni landing palette. */
const GLOBE_LABEL_PATTERN = /label|place|country|state|city|settlement|locality/;

export function setGlobeLabelVisibility(map: MapInstance, visible: boolean) {
  const layers = map.getStyle()?.layers ?? [];
  for (const layer of layers) {
    const id = layer.id.toLowerCase();
    if (layer.type !== "symbol" || id.startsWith("omni-") || !GLOBE_LABEL_PATTERN.test(id))
      continue;
    try {
      map.setLayoutProperty(layer.id, "visibility", visible ? "visible" : "none");
    } catch {
      /* A style layer may not expose layout visibility in a fallback style. */
    }
  }
}

export function applyPastelPalette(map: MapInstance) {
  const layers = map.getStyle()?.layers ?? [];
  for (const layer of layers) {
    const id = layer.id.toLowerCase();
    try {
      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", PASTEL.background);
      } else if (layer.type === "fill" && /water|ocean|sea|river/.test(id)) {
        map.setPaintProperty(layer.id, "fill-color", PASTEL.water);
      } else if (layer.type === "line" && /water|river|stream/.test(id)) {
        map.setPaintProperty(layer.id, "line-color", PASTEL.water);
      } else if (
        layer.type === "fill" &&
        /park|wood|grass|forest|garden|pitch|golf|landcover|vegetation|cemetery/.test(id)
      ) {
        map.setPaintProperty(layer.id, "fill-color", PASTEL.green);
      } else if (layer.type === "fill" && /building/.test(id)) {
        map.setPaintProperty(layer.id, "fill-color", PASTEL.building);
        map.setPaintProperty(layer.id, "fill-outline-color", PASTEL.building);
      }
    } catch {
      /* a layer without that paint property is simply skipped */
    }
  }
}
