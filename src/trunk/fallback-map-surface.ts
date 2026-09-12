// Fallback "map" surface — adapter MapLibre-compatible autour de createFallbackMap.
// Quand MapLibre init/charge/tuiles échoue, TrunkMap bascule ici: on rend la
// surface minimale exacte que le reste du composant exerce ( camera, markers, events(
// sur le fallback DOM animé, avec no-ops pour les membres GL-only ( style, paint,
// feature-state, bounds streaming(. Ainsi la cinématique de recherche ( computeSearchFlight,
// stagger, paliers( et les contrôles ( zoom/localisation( s'exécutent sur le fallback comme
// sur MapLibre — jamais un écran « Carte indisponible » mort.
import type { PublicFacility } from './types';
import { createFallbackMap, type FallbackCameraOptions, type FallbackMapEvent, type FallbackMapHandle } from './fallback-map';

export type FallbackSurfaceOptions = {
  container: HTMLElement;
  facilities?: readonly FallbackSurfaceFacility[];
  userLL?: [number, number] | null;
  onSelect?: (facility: { id: string; name: string; latitude: number; longitude: number }) => void;
};

export type FallbackSurfaceFacility = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  kind?: 'standard' | 'claimed' | 'mobile';
};

type PaddingLike = {
  top: number; left: number; bottom: number; right: number;
};

type LngLatBoundsLike = {
  getWest(): number;
  getSouth(): number;
  getEast(): number;
  getNorth(): number;
};

type SourceLike = {
  setData(data: unknown): void;
};

type EngineMembers = Partial<FallbackMapHandle> & {
  getBounds(): LngLatBoundsLike;
  project(lngLat: [number, number]): { x: number; y: number };
  unproject(point: { x: number; y: number } | [number, number]): { lng: number; lat: number };
  getBearing(): number;
  getContainer(): HTMLElement;
  getCanvasContainer(): HTMLElement;

  getCanvas(): HTMLElement;
  getPadding(): PaddingLike;
  setPadding(_padding: PaddingLike): void;
  setProjection(_projection: Record<string, unknown>): void;
  triggerRepaint(): void;
  stop(): void;
  isMoving(): boolean;
  isStyleLoaded(): boolean;
  fitBounds(bounds: unknown, opts?: { maxZoom?: number }): void;
  setFeatureState(_source: { source: string; id?: string | number }, _state: Record<string, unknown>): void;
  setPaintProperty(_layerId: string, _name: string, _value: unknown): void;
  setLayoutProperty(_layerId: string, _name: string, _value: unknown): void;
  getLayer(_layerId: string): unknown;
  getSource(_sourceId: string): SourceLike | undefined;
  addSource(_sourceId: string, _source: Record<string, unknown>): void;
  on(event: FallbackMapEvent, selector: string, cb: (ev?: unknown) => void): void;
  on2(event: FallbackMapEvent, cb: () => void): void;
  addLayer(_layer: Record<string, unknown>): void;
  getStyle(): { layers?: { id: string; type: string }[] } | undefined;
  dragPan: { disable(): void; enable(): void };
  keyboard: { disable(): void; enable(): void };
  scrollZoom: { disable(): void; enable(): void };
  boxZoom: { disable(): void; enable(): void };
  doubleClickZoom: { disable(): void; enable(): void };
  touchZoomRotate: { disable(): void; enable(): void; disableRotation(): void };
};

export type FallbackMapSurface = FallbackMapHandle & EngineMembers;

/** Hemisphere clamped helpers usable par les tests. */
export function clampLongitude(lng: number): number {
  return Math.min(180, Math.max(-180, lng));
}
export function clampLatitude(lat: number): number {
  return Math.min(90, Math.max(-90, lat));
}

/** Projection linéaire monde entier ( pour recentrage/sélection/itinéraire( alignée
 * sur les repères DOM en pourcentage de createFallbackMap: mêmé bornes monde. */
const WORLD = {
  minLng: -180,
  maxLng: 180,
  minLat: -85,
  maxLat: 85,
};
export function projectFallbackPoint(ll: [number, number]): { x: number; y: number } {
  const x = ((ll[0] - WORLD.minLng) / (WORLD.maxLng - WORLD.minLng)) * 100;
 const y = (1 - (ll[1] - WORLD.minLat) / (WORLD.maxLat - WORLD.minLat)) *  100;
 return { x, y };
}

function boundsCenter(bounds: unknown): [number, number] | null {
  if (Array.isArray(bounds)) {
    const arr = bounds as [[number, number], [number, number]];
    if (arr.length >= 2 && arr[0]?.length >= 2 && arr[1]?.length >=  2) {
      return [(arr[0][0] + arr[1][0]) / 2, (arr[0][1] + arr[1][1]) / 2] as [number, number];
    }
  } else {
    const b = bounds as { _ne?: { lng: number; lat: number }; _sw?: { lng: number; lat: number } };
    if (b._ne && b._sw) return [(b._ne.lng + b._sw.lng) / 2, (b._ne.lat + b._sw.lat) / 2] as [number, number];
  }
  return null;
}

export function createFallbackMapSurface(options: FallbackSurfaceOptions): FallbackMapSurface {
  const { container, userLL, onSelect } = options;
  let facilities = options.facilities ?? ([] as readonly FallbackSurfaceFacility[]);
  let userLocation: [number, number] | null = userLL ?? null;
  const base = createFallbackMap({
    container,
    facilities,
    userLL: userLocation ?? undefined,
    onSelect,
  });
  const touchZoomRotate = (base as unknown as { touchZoomRotate?: { disable: () => void; enable: () => void } }).touchZoomRotate;
  if (touchZoomRotate) {
    touchZoomRotate.disable ??= (() => undefined);
    touchZoomRotate.enable ??= (() => undefined);
  }
  let lastEaseCenter: [number, number] = base.getCenter();
  let lastEaseZoom = base.getZoom();

  const getContainer = () => container;
  const surface: FallbackMapSurface = {
    ...base,
    touchZoomRotate: { ...(base as unknown as { touchZoomRotate?: { disableRotation: () => void } }).touchZoomRotate, disable: () => undefined, enable: () => undefined, disableRotation: (base as unknown as { touchZoomRotate?: { disableRotation: () => void } }).touchZoomRotate?.disableRotation ?? (() => undefined) },
    getZoom: () => lastEaseZoom,
    getCenter: () => ([...lastEaseCenter] as [number, number]),
    easeTo: (opts?: FallbackCameraOptions) => {
      if (opts?.center) lastEaseCenter = [...opts.center] as [number, number];
      if (opts?.zoom !== undefined) lastEaseZoom = opts.zoom;

      base.easeTo(opts);
    },
    flyTo: (opts?: FallbackCameraOptions) => {
      surface.easeTo(opts);
    },
    jumpTo: (opts?: FallbackCameraOptions) => {
      if (opts?.center) lastEaseCenter = [...opts.center] as [number, number];
      if (opts?.zoom !== undefined) lastEaseZoom = opts.zoom;

      base.jumpTo(opts);
    },
    zoomIn: (opts?: { duration?: number }) => {
      lastEaseZoom = base.getZoom() + 1;
      base.zoomIn(opts);
    },
    zoomOut: (opts?: { duration?: number }) => {
      lastEaseZoom = base.getZoom() - 1;
      base.zoomOut(opts);
    },
    setFacilities: (next: readonly FallbackSurfaceFacility[]) => {
      facilities = next;
      base.setFacilities(next);
    },
    setUserLocation: (ll: [number, number] | null) => {
      userLocation = ll;
      base.setUserLocation(ll);
    },
    resize: () => { base.resize(); },
    remove: () => { base.remove(); },
    once: (ev: FallbackMapEvent, cb: () => void) => { base.once(ev, cb); },
    on2: (ev: FallbackMapEvent, cb: () => void) => { base.on(ev, cb); },
    on: (ev: FallbackMapEvent, selector?: string | (() => void), cb?: () => void) => {
      base.on(ev, selector as never, cb as never);
    },
    off: (ev: FallbackMapEvent, cb?: () => void) => { base.off(ev, cb); },
    cameraForBounds: (bounds: unknown, opts?: { maxZoom?: number }) => {
      const c = boundsCenter(bounds) ?? base.getCenter();
      const fitZoom = Math.min(18, Math.max(0, opts?.maxZoom ?? base.getZoom()));
      return { center: c, zoom: fitZoom };
    },
    getBounds: (): LngLatBoundsLike => {
      const center = surface.getCenter();
      const spanLng = 360 / Math.max(1, Math.pow(2, surface.getZoom() - 1));
      const spanLat = 170 / Math.max(1, Math.pow(2, surface.getZoom() - 1));
      const west = clampLongitude(center[0] - spanLng / 2);
      const east = clampLongitude(center[0] + spanLng / 2);
      const south = clampLatitude(center[1] - spanLat /  2);
      const north = clampLatitude(center[1] + spanLat /  2);
      return {
        getWest: () => west,
        getSouth: () => south,
        getEast: () => east,
        getNorth: () => north,
      };
    },
    project: (ll: [number, number]): { x: number; y: number } => {
      const p = projectFallbackPoint(ll);
      const rect = container.getBoundingClientRect();
      return { x: (p.x * rect.width) / 100, y: (p.y * rect.height) / 100 };
    },
    unproject: (point: { x: number; y: number }): { lng: number; lat: number } => {
      const rect = container.getBoundingClientRect();
      const lng = ((point.x * 100) / Math.max(1, rect.width) - 50) / 50 * WORLD.maxLng;
      // échelle Y: linéaire inversé: y=0 → lat=maxLat; y=100 → lat=minLat.
      const lat = WORLD.maxLat - ((point.y * 100) / Math.max(1, rect.height) / 100) * (WORLD.maxLat - WORLD.minLat);
      return { lng, lat };
    },
    getBearing: () => 0,
    getPadding: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
    setPadding: () => undefined,
    getContainer,
    getCanvasContainer: () => container,
    getCanvas: () => container,
    setProjection: () => undefined,
    triggerRepaint: () => undefined,
    stop: () => undefined,
    isMoving: () => false,
    isStyleLoaded: () => true,
    fitBounds: (bounds: unknown, opts?: { maxZoom?: number }) => {
      const c = boundsCenter(bounds);
      if (!c) return;
      const targetZoom = Math.min(18, Math.max(0, opts?.maxZoom ?? base.getZoom()));
      surface.easeTo({ center: c, zoom: targetZoom });
    },
    setFeatureState: () => undefined,
    setPaintProperty: () => undefined,
    setLayoutProperty: () => undefined,
    getLayer: () => undefined,
    getSource: () => undefined,
    addSource: () => undefined,
    addLayer: () => undefined,
    getStyle: () => ({ layers: [] }),
    dragPan: { disable: () => undefined, enable: () => undefined },
    keyboard: { disable: () => undefined, enable: () => undefined },
    scrollZoom: { disable: () => undefined, enable: () => undefined },
    boxZoom: { disable: () => undefined, enable: () => undefined },
    doubleClickZoom: { disable: () => undefined, enable: () => undefined },
  };
  void facilities; void userLocation;
  return surface;
}