// Fallback "map" — port 1:1 de la maquette V1.3 (initFallbackMap).
// Quand MapLibre ou les tuiles échouent, on rend une carte monde animée avec
// les VRAIES facilités avec lat/lng réels, jamais un écran « Carte indisponible » mort.
// Même surface méthode que MapLibre avec easeTo/flyTo/once/on/zoomIn/zoomOut/cameraForBounds
// pour que TrunkMap l'utilise sans changements lourds.

export type FallbackMapEvent = 'moveend' | 'move';

export type FallbackFacility = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  kind?: 'standard' | 'claimed' | 'mobile';
};

export type FallbackCameraOptions = {
  center?: [number, number];
  zoom?: number;
  duration?: number;
};

export type FallbackMapHandle = {
  getZoom(): number;
  getCenter(): [number, number];
  easeTo(options?: FallbackCameraOptions): void;
  flyTo(options?: FallbackCameraOptions): void;
  zoomIn(options?: { duration?: number }): void;
  zoomOut(options?: { duration?: number }): void;
  jumpTo(options?: FallbackCameraOptions): void;
  cameraForBounds(bounds: unknown, opts?: { maxZoom?: number }): { center: [number, number]; zoom: number };
  once(event: FallbackMapEvent, cb: () => void): void;
  on(event: FallbackMapEvent, cb: () => void): void;
  off(event: FallbackMapEvent, cb?: () => void): void;
  resize(): void;
  remove(): void;
  setFacilities(facilities: readonly FallbackFacility[]): void;
  setUserLocation(ll: [number, number] | null): void;
  dragRotate: { disable(): void };
  touchZoomRotate: { disableRotation(): void };
};

type FallbackMapOptions = {
  container: HTMLElement;
  facilities?: readonly FallbackFacility[];
  userLL?: [number, number];
  onSelect?: (facility: { id: string; name: string; latitude: number; longitude: number }) => void;
};

const BOUNDS = {
  minLng: 1.215,
  maxLng:  1.236,
 minLat:  6.122,
 maxLat: 6.140,
};

const BASE_FIT_ZOOM = 15.6;
const MIN_ZOOM = 0;
const MAX_ZOOM = 18;

function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

function project(ll: [number, number]): { x: number; y: number } {
  const x = ((ll[0] - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
 const y = (1 - (ll[1] - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) *  100;
 return { x, y };
}

function boundsCenter(bounds: unknown): [number, number] | null {
  const b = bounds as { _ne?: { lng: number; lat: number }; _sw?: { lng: number; lat: number } };
 if (!b._ne || !b._sw) return null;
 return [(b._ne.lng + b._sw.lng) / 2, (b._ne.lat + b._sw.lat) / 2] as [number, number];
}

function escapeHtml(s: string): string {
 return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

type Marker = {
 el: HTMLElement;
 ll: [number, number];
 remove(): void;
 setLngLat(next: [number, number]): void;
};

export function createFallbackMap(options: FallbackMapOptions): FallbackMapHandle {
  const { container, userLL, onSelect } = options;
  let facilities = options.facilities ?? ([] as readonly FallbackFacility[]);
  let userLocation: [number, number] | undefined = userLL;
  let zoom = 15.4;
  let center: [number, number] = userLocation ?? ([1.2255,6.1319] as [number, number]);
  let world: HTMLDivElement | null = null;
  const markers: Marker[] = [];
  const pendingOnce = new Map<FallbackMapEvent, Array<() => void>>();
  const onCallbacks = new Map<FallbackMapEvent, Array<() => void>>();

  container.style.background = 'linear-gradient(135deg,#e9ede7,#dfe4db;;';
  world = document.createElement('div');
  world.style.cssText = 'position:absolute;inset:0;transition:transform .32s cubic-bezier(.23,1,.32,1);transform-origin:50% 50%;pointer-events:none';
  container.appendChild(world);

  function applyView() {
    if (!world) return;
    const scale = Math.pow(1.55, zoom - 15);
    const p = project(center);
    world.style.transform = 'scale(' + scale + ') translate(' + ((50 - p.x) * (100 / scale)) / 100 + '%,' + ((50 - p.y) * (100 / scale)) / 100 + '%)';
  }

  function fireEvent(ev: FallbackMapEvent) {
    const onceCbs = pendingOnce.get(ev) ?? [];
    pendingOnce.delete(ev);
    onceCbs.forEach((cb) => cb());
    const onCbs = onCallbacks.get(ev) ?? [];
    onCbs.forEach((cb) => cb());
  }

  function scheduleMoveEnd(duration?: number) {
    window.setTimeout(() => fireEvent('moveend'), duration ?? 300);
  }

  function makeMarker(el: HTMLElement, ll: [number, number]): Marker {
    const marker: Marker = {
      el,
      ll,
      remove: () => { el.remove(); },
      setLngLat: (next: [number, number]) => {
        marker.ll = next;
        const p = project(next);
        el.style.left = p.x + '%';
        el.style.top = p.y + '%';
      },
    };
    el.style.position = 'absolute';
    el.style.transform = 'translate(-50%,-50%)';
    el.style.zIndex = 'auto';
    if (world) world.appendChild(el);
    marker.setLngLat(ll);
    return marker;
  }

  function rebuildMarkers() {
    if (!world) return;
    markers.forEach((mk) => mk.remove());
    markers.length = 0;
    if (userLocation) {
      const uEl = document.createElement('div');
      uEl.className = 'usermarker';
      markers.push(makeMarker(uEl, userLocation));
    }
    facilities.forEach((f, i) => {
      const el = document.createElement('div');
      const cls = (f.kind === 'claimed' ? 'cmark' : 'vdot') + (f.kind === 'mobile' ? ' mobile' : '');
      el.className = cls + ' pop-hidden';
      el.style.opacity = '0';
      const stateLabel = f.kind === 'claimed' ? 'Non revendiquée' : f.kind === 'mobile' ? 'Vente ambulante' : 'Vérifiée';
      el.innerHTML = '<div class="pin-label"><b>' + escapeHtml(f.name) + '</b><span>' + escapeHtml(stateLabel) + '</span></div>';
      el.addEventListener('click', () => {
        onSelect?.({ id: f.id, name: f.name, latitude: f.latitude, longitude: f.longitude });
      });
      const mk = makeMarker(el, [f.longitude, f.latitude]);
      markers.push(mk);
      window.setTimeout(() => {
        el.style.transition = '';
        el.style.opacity = '1';
        el.classList.add('vdot-reveal');
      }, 260 + i * 50);
    });
    applyView();
  }

  rebuildMarkers();

  const handle: FallbackMapHandle = {
    getZoom: () => zoom,
    getCenter: () => ([...center] as [number, number]),
    easeTo: (opts?: FallbackCameraOptions) => {
      if (opts?.zoom !== undefined) zoom = clampZoom(opts.zoom);
      if (opts?.center) center = [...opts.center] as [number, number];
      applyView();
      scheduleMoveEnd(opts?.duration);
    },
    flyTo: (opts?: FallbackCameraOptions) => {
      handle.easeTo(opts);
    },
    zoomIn: (opts?: { duration?: number }) => {
      zoom = clampZoom(zoom +  1);
      applyView();
      scheduleMoveEnd(opts?.duration);
    },
    zoomOut: (opts?: { duration?: number }) => {
      zoom = clampZoom(zoom -  1);
      applyView();
      scheduleMoveEnd(opts?.duration);
    },
    jumpTo: (opts?: FallbackCameraOptions) => {
      if (opts?.zoom !== undefined) zoom = clampZoom(opts.zoom);
      if (opts?.center) center = [...opts.center] as [number, number];
      applyView();
    },
    cameraForBounds: (bounds: unknown, opts?: { maxZoom?: number }) => {
      const c = boundsCenter(bounds);
      const target = c ?? center;
      const fitZoom = clampZoom(Math.min(BASE_FIT_ZOOM, opts?.maxZoom ?? BASE_FIT_ZOOM));
      return { center: ([...target] as [number, number]), zoom: fitZoom };
    },
    once: (ev: FallbackMapEvent, cb: () => void) => {
      const list = pendingOnce.get(ev) ?? [];
      list.push(cb);
      pendingOnce.set(ev, list);
    },
    on: (ev: FallbackMapEvent, cb: () => void) => {
      const list = onCallbacks.get(ev) ?? [];
      list.push(cb);
      onCallbacks.set(ev, list);
    },
    off: (ev: FallbackMapEvent, cb?: () => void) => {
      if (!cb) { onCallbacks.delete(ev); return; }
      const list = onCallbacks.get(ev) ?? [];
      onCallbacks.set(ev, list.filter((fn) => fn !== cb));
    },
    resize: () => { applyView(); },
    remove: () => {
      markers.forEach((mk) => mk.remove());
      markers.length = 0;
      if (world && world.parentNode === container) container.removeChild(world);
      world = null;
    },
    setFacilities: (next: readonly FallbackFacility[]) => {
      facilities = next;
      rebuildMarkers();
    },
    setUserLocation: (ll: [number, number] | null) => {
      userLocation = ll ?? undefined;
      rebuildMarkers();
    },
    dragRotate: { disable: () => {} },
    touchZoomRotate: { disableRotation: () => {} },
  };

  return handle;
}
