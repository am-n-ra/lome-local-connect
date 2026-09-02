import type { MapInstance } from "../maplibre";

type GeoJSONFeature = {
  type: "Feature";
  id?: string | number;
  geometry: unknown;
  properties: Record<string, unknown>;
};

type GeoJSON = {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
};

type TargetPoint = { lat: number; lng: number };
type QueryableMap = MapInstance & {
  querySourceFeatures?: (source: string, options?: { sourceLayer?: string }) => GeoJSONFeature[];
  triggerRepaint?: () => void;
};

export type BoundaryLevel = {
  id: string;
  source: string;
  minzoom: number;
  maxzoom: number;
  labelMinzoom: number;
  name: string;
  targetNames?: string[];
};

export const BOUNDARY_LEVELS: BoundaryLevel[] = [
  {
    id: "africa-continent",
    source: "africa-continent",
    minzoom: 0,
    maxzoom: 5.5,
    labelMinzoom: 1.1,
    name: "Continent",
    targetNames: ["Afrique", "Africa"],
  },
  {
    id: "togo",
    source: "togo",
    minzoom: 3.5,
    maxzoom: 8.5,
    labelMinzoom: 4,
    name: "Pays",
    targetNames: ["Togo"],
  },
  {
    id: "togo-regions",
    source: "togo-regions",
    minzoom: 6.5,
    maxzoom: 11.5,
    labelMinzoom: 7,
    name: "Région",
    targetNames: ["Maritime Region", "Maritime"],
  },
  {
    id: "togo-communes",
    source: "togo-communes",
    minzoom: 9,
    maxzoom: 14,
    labelMinzoom: 10,
    name: "Ville / commune",
    targetNames: ["Lome", "Lomé", "Golfe"],
  },
  {
    id: "lome-quartiers",
    source: "lome-quartiers",
    minzoom: 12,
    maxzoom: 22,
    labelMinzoom: 13,
    name: "Quartier",
    targetNames: ["Lome", "Lomé", "Tokoin", "Adidogomé"],
  },
];

const INACTIVE_BORDER_COLOR = "#a8a09a";
const ACTIVE_FILL_COLOR = "#11100f";
const ACTIVE_BORDER_COLOR = "#11100f";
const ACTIVE_GLOW_COLOR = "#000000";

const cache = new Map<string, GeoJSON>();

async function fetchGeoJSON(path: string): Promise<GeoJSON> {
  const cached = cache.get(path);
  if (cached) return cached;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load boundary: ${path}`);
  const data = (await res.json()) as GeoJSON;
  data.features = data.features.map((feature, index) => ({
    ...feature,
    id:
      feature.id ??
      (typeof feature.properties["id"] === "string" || typeof feature.properties["id"] === "number"
        ? feature.properties["id"]
        : `${path}-${index}`),
    properties: {
      ...feature.properties,
      name:
        feature.properties["name"] ??
        feature.properties["shapeName"] ??
        feature.properties["NAME"] ??
        feature.properties["admin"] ??
        "",
    },
  }));
  cache.set(path, data);
  return data;
}

function addBoundaryLayers(map: MapInstance, level: BoundaryLevel, data: GeoJSON) {
  if (map.getSource(level.source)) return;

  map.addSource(level.source, {
    type: "geojson",
    data,
    maxzoom: 14,
    tolerance: 2,
    buffer: 64,
    promoteId: "id",
  });

  map.addLayer({
    id: `${level.id}-fills`,
    type: "fill",
    source: level.source,
    minzoom: level.minzoom,
    maxzoom: level.maxzoom,
    layout: { visibility: "visible" },
    paint: {
      "fill-color": [
        "case",
        ["boolean", ["feature-state", "active"], false],
        ACTIVE_FILL_COLOR,
        "#ffffff",
      ],
      "fill-opacity": ["case", ["boolean", ["feature-state", "active"], false], 0.12, 0],
    },
  });

  map.addLayer({
    id: `${level.id}-borders`,
    type: "line",
    source: level.source,
    minzoom: level.minzoom,
    maxzoom: level.maxzoom,
    layout: { visibility: "visible" },
    paint: {
      "line-color": [
        "case",
        ["boolean", ["feature-state", "active"], false],
        ACTIVE_BORDER_COLOR,
        INACTIVE_BORDER_COLOR,
      ],
      "line-width": ["case", ["boolean", ["feature-state", "active"], false], 2.5, 0],
      "line-opacity": ["case", ["boolean", ["feature-state", "active"], false], 0.92, 0],
    },
  });

  map.addLayer({
    id: `${level.id}-glow`,
    type: "line",
    source: level.source,
    minzoom: level.minzoom,
    maxzoom: level.maxzoom,
    layout: { visibility: "visible" },
    paint: {
      "line-color": ACTIVE_GLOW_COLOR,
      "line-width": ["case", ["boolean", ["feature-state", "active"], false], 7, 0],
      "line-opacity": ["case", ["boolean", ["feature-state", "active"], false], 0.24, 0],
      "line-blur": 1.2,
    },
  });

  map.addLayer({
    id: `${level.id}-labels`,
    type: "symbol",
    source: level.source,
    minzoom: level.labelMinzoom,
    maxzoom: level.maxzoom,
    layout: {
      visibility: "none",
      "text-field": ["coalesce", ["get", "name"], ["get", "shapeName"], ""],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], level.labelMinzoom, 12, level.maxzoom, 16],
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": [
        "case",
        ["boolean", ["feature-state", "active"], false],
        ACTIVE_BORDER_COLOR,
        "#6a625c",
      ],
      "text-halo-color": "#ffffff",
      "text-halo-width": 2,
      "text-opacity": ["case", ["boolean", ["feature-state", "active"], false], 1, 0.5],
    },
  });
}

const BOUNDARY_PATHS: Record<string, string> = {
  "africa-continent": "/boundaries/africa-continent.geojson",
  togo: "/boundaries/togo.geojson",
  "togo-regions": "/boundaries/togo-regions.geojson",
  "togo-communes": "/boundaries/togo-communes.geojson",
  "lome-quartiers": "/boundaries/lome-quartiers.geojson",
};

let loadedLevels = new Set<string>();

export async function loadBoundariesForZoom(map: MapInstance, zoom: number) {
  for (const level of BOUNDARY_LEVELS) {
    if (loadedLevels.has(level.source)) continue;
    if (zoom >= level.minzoom - 1 && zoom <= level.maxzoom + 1) {
      try {
        const path = BOUNDARY_PATHS[level.source];
        if (!path) continue;
        const data = await fetchGeoJSON(path);
        addBoundaryLayers(map, level, data);
        loadedLevels.add(level.source);
      } catch {
        /* Boundary assets are optional; the camera reveal can continue without one. */
      }
    }
  }
}

let activeFeature: { source: string; id: string | number } | null = null;

export function boundaryLevelForZoom(zoom: number) {
  return [...BOUNDARY_LEVELS]
    .reverse()
    .find((level) => zoom >= level.minzoom && zoom <= level.maxzoom);
}

function normalizeName(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function featureMatchesLevel(feature: GeoJSONFeature, level: BoundaryLevel) {
  const name = normalizeName(
    feature.properties["name"] ?? feature.properties["shapeName"] ?? feature.properties["NAME"],
  );
  return level.targetNames?.some((target) => {
    const normalizedTarget = normalizeName(target);
    return name === normalizedTarget || name.includes(normalizedTarget);
  });
}

export function highlightBoundaryAtTarget(map: MapInstance, zoom: number, target: TargetPoint) {
  const queryableMap = map as QueryableMap;
  const level = boundaryLevelForZoom(zoom);
  if (!level || !loadedLevels.has(level.source)) {
    clearHighlight(map);
    return null;
  }

  const layerId = `${level.id}-fills`;
  const point = map.project([target.lng, target.lat]);
  let feature = map.queryRenderedFeatures(point, { layers: [layerId] })[0] as GeoJSONFeature | undefined;

  if (!feature && queryableMap.querySourceFeatures) {
    const sourceFeatures = queryableMap.querySourceFeatures(level.source);
    feature = sourceFeatures.find((candidate) => featureMatchesLevel(candidate, level));
  }

  if (!feature || feature.id == null) {
    clearHighlight(map);
    return null;
  }

  if (activeFeature && (activeFeature.source !== level.source || activeFeature.id !== feature.id)) {
    map.setFeatureState({ source: activeFeature.source, id: activeFeature.id }, { active: false });
  }
  map.setFeatureState({ source: level.source, id: feature.id }, { active: true });
  activeFeature = { source: level.source, id: feature.id };
  queryableMap.triggerRepaint?.();
  return { level: level.name, source: level.source, id: feature.id };
}

/** @deprecated Use highlightBoundaryAtTarget for deterministic target highlighting. */
export function highlightBoundaryAtCenter(map: MapInstance, zoom: number) {
  const center = map.getCenter();
  return highlightBoundaryAtTarget(map, zoom, { lat: center.lat, lng: center.lng });
}

export function clearHighlight(map: MapInstance) {
  if (activeFeature) {
    map.setFeatureState({ source: activeFeature.source, id: activeFeature.id }, { active: false });
    activeFeature = null;
    (map as QueryableMap).triggerRepaint?.();
  }
}

export function resetBoundaryState() {
  loadedLevels = new Set();
  activeFeature = null;
}
