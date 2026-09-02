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
  const importPromise = (async () => {
    await import("maplibre-gl/dist/maplibre-gl.css");
    const mod = await import("maplibre-gl");
    return (mod.default ?? mod) as unknown as MapLibreGlobal;
  })();
  loader = Promise.race([
    importPromise,
    new Promise<MapLibreGlobal>((_, reject) =>
      window.setTimeout(() => reject(new Error("Chargement MapLibre expiré")), 12_000),
    ),
  ]);
  return loader;
}

export function useMapLibreState() {
  const [gl, setGl] = useState<MapLibreGlobal | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setGl(null);
    setError(null);
    loadMapLibre()
      .then((lib) => {
        if (!cancelled) setGl(lib);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason : new Error("MapLibre indisponible"));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return {
    gl,
    error,
    retry: () => {
      loader = null;
      setAttempt((value) => value + 1);
    },
  };
}

export function useMapLibre() {
  return useMapLibreState().gl;
}

/**
 * Free, key-less vector basemap (OpenFreeMap "positron"): near-white roads on a
 * desaturated base. `applyPastelPalette` then repaints water, land and
 * buildings with the OmniView landing palette.
 */
export const PASTEL_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

/** OpenFreeMap serves Noto Sans, while some style revisions still request Open Sans. */
export function rewriteOpenFreeMapGlyphUrl(url: string) {
  return url
    .replace(/Open(?:%20|\s)Sans(?:%20|\s)Bold/g, "Noto%20Sans%20Bold")
    .replace(/Open(?:%20|\s)Sans(?:%20|\s)Regular/g, "Noto%20Sans%20Regular")
    .replace(/Open(?:%20|\s)Sans(?:%20|\s)Italic/g, "Noto%20Sans%20Italic");
}

const PASTEL = {
  water: "#2d3335",
  green: "#ffffff",
  building: "#fffefb",
  background: "#fbfaf7",
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

type StyleSpecLayer = {
  id: string;
  type: string;
  paint?: Record<string, unknown>;
};
type StyleSpec = { layers?: StyleSpecLayer[]; glyphs?: string; [key: string]: unknown };

/**
 * Repaints the raw vector style JSON *before* MapLibre renders it, so the map
 * never flashes the upstream blue-ocean palette while waiting for the
 * post-load repaint pass.
 */
export function paintStyleSpec(style: StyleSpec): StyleSpec {
  for (const layer of style.layers ?? []) {
    const id = layer.id.toLowerCase();
    const paint = (layer.paint ??= {});
    if (layer.type === "background") {
      paint["background-color"] = PASTEL.background;
    } else if (layer.type === "fill" && /water|ocean|sea|river/.test(id)) {
      paint["fill-color"] = PASTEL.water;
    } else if (layer.type === "line" && /water|river|stream/.test(id)) {
      paint["line-color"] = PASTEL.water;
    } else if (
      layer.type === "fill" &&
      /park|wood|grass|forest|garden|pitch|golf|landcover|vegetation|cemetery/.test(id)
    ) {
      paint["fill-color"] = PASTEL.green;
    } else if (layer.type === "fill" && /building/.test(id)) {
      paint["fill-color"] = PASTEL.building;
      paint["fill-outline-color"] = PASTEL.building;
    }
  }
  if (typeof style.glyphs === "string") style.glyphs = rewriteOpenFreeMapGlyphUrl(style.glyphs);
  return style;
}

let pastelStylePromise: Promise<StyleSpec> | null = null;

/** Fetches the base vector style once per session and returns it pre-painted. */
export function loadPastelStyle(): Promise<StyleSpec> {
  pastelStylePromise ??= fetch(PASTEL_STYLE_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`style ${response.status}`);
      return response.json() as Promise<StyleSpec>;
    })
    .then(paintStyleSpec)
    .catch((error: unknown) => {
      pastelStylePromise = null;
      throw error;
    });
  return pastelStylePromise;
}

