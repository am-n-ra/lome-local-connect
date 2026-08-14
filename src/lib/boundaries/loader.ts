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

export type BoundaryLevel = {
  id: string;
  source: string;
  minzoom: number;
  maxzoom: number;
  labelMinzoom: number;
  name: string;
};

export const BOUNDARY_LEVELS: BoundaryLevel[] = [
  {
    id: "africa",
    source: "africa",
    minzoom: 0,
    maxzoom: 5.5,
    labelMinzoom: 1.25,
    name: "Continent",
  },
  { id: "togo", source: "togo", minzoom: 3.5, maxzoom: 8.5, labelMinzoom: 4, name: "Pays" },
  {
    id: "togo-regions",
    source: "togo-regions",
    minzoom: 6.5,
    maxzoom: 11.25,
    labelMinzoom: 7,
    name: "Région",
  },
  {
    id: "togo-communes",
    source: "togo-communes",
    minzoom: 9,
    maxzoom: 14,
    labelMinzoom: 10,
    name: "Ville",
  },
  {
    id: "lome-quartiers",
    source: "lome-quartiers",
    minzoom: 12,
    maxzoom: 22,
    labelMinzoom: 13,
    name: "Quartier",
  },
];

const BOUNDARY_COLOR = "#a45f2d";
const ACTIVE_BOUNDARY_COLOR = "#7a3e1d";
const BOUNDARY_GLOW_COLOR = "#f4c38a";

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
      (typeof feature.properties.id === "string" || typeof feature.properties.id === "number"
        ? feature.properties.id
        : `${path}-${index}`),
    properties: {
      ...feature.properties,
      name:
        feature.properties.name ??
        feature.properties.shapeName ??
        feature.properties.NAME ??
        feature.properties.admin ??
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
    tolerance: 3,
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
        ACTIVE_BOUNDARY_COLOR,
        BOUNDARY_COLOR,
      ],
      "fill-opacity": ["case", ["boolean", ["feature-state", "active"], false], 0.16, 0.025],
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
        ACTIVE_BOUNDARY_COLOR,
        BOUNDARY_COLOR,
      ],
      "line-width": ["case", ["boolean", ["feature-state", "active"], false], 2.75, 0.75],
      "line-opacity": ["case", ["boolean", ["feature-state", "active"], false], 0.76, 0.28],
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
      "line-color": BOUNDARY_GLOW_COLOR,
      "line-width": ["case", ["boolean", ["feature-state", "active"], false], 6, 0],
      "line-opacity": ["case", ["boolean", ["feature-state", "active"], false], 0.26, 0],
    },
  });

  map.addLayer({
    id: `${level.id}-labels`,
    type: "symbol",
    source: level.source,
    minzoom: level.labelMinzoom,
    maxzoom: level.maxzoom,
    layout: {
      "text-field": ["coalesce", ["get", "name"], ["get", "shapeName"], ""],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], level.labelMinzoom, 11, level.maxzoom, 15],
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": [
        "case",
        ["boolean", ["feature-state", "active"], false],
        ACTIVE_BOUNDARY_COLOR,
        "#6f4c38",
      ],
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.25,
      "text-opacity": ["case", ["boolean", ["feature-state", "active"], false], 0.9, 0.58],
    },
  });
}

const BOUNDARY_PATHS: Record<string, string> = {
  africa: "/boundaries/africa.geojson",
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
        /* boundary file missing, skip */
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

export function highlightBoundaryAtCenter(map: MapInstance, zoom: number) {
  for (const level of [...BOUNDARY_LEVELS].reverse()) {
    if (!loadedLevels.has(level.source)) continue;
    if (zoom < level.minzoom || zoom > level.maxzoom) continue;

    const layerId = `${level.id}-fills`;
    const center = map.getCenter();
    const point = map.project([center.lng, center.lat]);
    const features = map.queryRenderedFeatures(point, { layers: [layerId] });
    const feature = features[0];

    if (feature && feature.id != null) {
      if (activeFeature && activeFeature.source === level.source && activeFeature.id === feature.id)
        return;

      if (activeFeature) {
        map.setFeatureState(
          { source: activeFeature.source, id: activeFeature.id },
          { active: false },
        );
      }
      map.setFeatureState({ source: level.source, id: feature.id }, { active: true });
      activeFeature = { source: level.source, id: feature.id };
      return;
    }
  }

  clearHighlight(map);
}

export function clearHighlight(map: MapInstance) {
  if (activeFeature) {
    map.setFeatureState({ source: activeFeature.source, id: activeFeature.id }, { active: false });
    activeFeature = null;
  }
}

export function resetBoundaryState() {
  loadedLevels = new Set();
  activeFeature = null;
}
