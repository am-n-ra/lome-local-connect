import { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair, MapPin, Minus, Plus } from 'lucide-react';
import { Map, type GeoJSONSource, type MapGeoJSONFeature, type MapLayerMouseEvent, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PublicFacility } from './types';
import { groupProjectedFacilities, type ProjectedFacility, type ScreenPin } from './map-pins';

type LocationState = 'idle' | 'requesting' | 'exact' | 'approximate' | 'denied' | 'unavailable' | 'timeout' | 'cancelled';

type Props = {
  facilities: PublicFacility[];
  selectedId: string | null;
  onSelect: (facility: PublicFacility) => void;
  onBoundsChange?: (bounds: [number, number, number, number]) => void;
  contextSurfaceOpen?: boolean;
};

const REMOTE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -1, 'raster-contrast': 0.08, 'raster-brightness-min': 0.24, 'raster-brightness-max': 0.98, 'raster-opacity': 0.9 } }],
};
const FALLBACK_STYLE = '/omni-local-style.json';
const SOURCE = 'omni-v2-facilities';

function featureCollection(facilities: PublicFacility[]) {
  return {
    type: 'FeatureCollection' as const,
    features: facilities.map((facility) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [facility.longitude, facility.latitude] },
      properties: { id: facility.id, name: facility.name, trust: facility.trust, productCount: facility.productCount },
    })),
  };
}

export function TrunkMap({ facilities, selectedId, onSelect, onBoundsChange, contextSurfaceOpen = false }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const facilitiesRef = useRef(facilities);
  const rotating = useRef(true);
  const rotationTimer = useRef<number | null>(null);
  const rotationResumeTimer = useRef<number | null>(null);
  const fallbackUsed = useRef(false);
  const initialStyleReady = useRef(false);
  const contextSurfaceRef = useRef(contextSurfaceOpen);
  const lastBoundsKey = useRef<string | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [rotationState, setRotationState] = useState<'idle' | 'rotating' | 'paused' | 'reduced'>('idle');
  const [zoom, setZoom] = useState(1.35);
  const [centerLongitude, setCenterLongitude] = useState(1.22);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [zoomExpanded, setZoomExpanded] = useState(false);
  const [screenPins, setScreenPins] = useState<ScreenPin[]>([]);
  const screenPinsFrame = useRef<number | null>(null);
  const locationRequest = useRef<number | null>(null);
  const resumeMotionRef = useRef<(() => void) | null>(null);
  facilitiesRef.current = facilities;

  const updateScreenPins = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const { width, height } = map.getContainer().getBoundingClientRect();
    const projected = facilitiesRef.current
      .filter((facility) => Number.isFinite(facility.longitude) && Number.isFinite(facility.latitude))
      .map((facility) => {
        const point = map.project([facility.longitude, facility.latitude]);
        return { facility, x: point.x, y: point.y } satisfies ProjectedFacility;
      })
      .filter(({ x, y }) => Number.isFinite(x) && Number.isFinite(y) && x >= -56 && x <= width + 56 && y >= -56 && y <= height + 56);
    setScreenPins(groupProjectedFacilities(projected));
  }, []);

  const scheduleScreenPins = useCallback(() => {
    if (screenPinsFrame.current !== null) window.cancelAnimationFrame(screenPinsFrame.current);
    screenPinsFrame.current = window.requestAnimationFrame(() => {
      screenPinsFrame.current = null;
      updateScreenPins();
    });
  }, [updateScreenPins]);

  const pauseMotion = () => {
    rotating.current = false;
    if (rotationTimer.current !== null) {
      window.clearTimeout(rotationTimer.current);
      rotationTimer.current = null;
    }
    if (rotationResumeTimer.current !== null) {
      window.clearTimeout(rotationResumeTimer.current);
      rotationResumeTimer.current = null;
    }
    mapRef.current?.stop();
    setRotationState(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'paused');
  };

  const cancelLocation = () => {
    if (locationRequest.current !== null) window.clearTimeout(locationRequest.current);
    locationRequest.current = null;
    rotating.current = false;
    setLocationState('cancelled');
  };

  const requestLocation = () => {
    if (locationState === 'requesting') {
      cancelLocation();
      return;
    }
    pauseMotion();
    if (!navigator.geolocation) {
      setLocationState('unavailable');
      return;
    }
    setLocationState('requesting');
    locationRequest.current = window.setTimeout(() => {
      locationRequest.current = null;
      setLocationState('timeout');
    }, 10_000);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (locationRequest.current !== null) window.clearTimeout(locationRequest.current);
        locationRequest.current = null;
        const approximate = position.coords.accuracy > 500;
        setLocationState(approximate ? 'approximate' : 'exact');
        mapRef.current?.stop();
        rotating.current = false;
        mapRef.current?.easeTo({ center: [position.coords.longitude, position.coords.latitude], zoom: approximate ? 5 : 7, duration: 900, essential: true });
      },
      (error) => {
        if (locationRequest.current !== null) window.clearTimeout(locationRequest.current);
        locationRequest.current = null;
        setLocationState(error.code === error.PERMISSION_DENIED ? 'denied' : error.code === error.TIMEOUT ? 'timeout' : 'unavailable');
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 8_000 },
    );
  };

  const zoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    pauseMotion();
    map.zoomIn({ duration: 0 });
  };

  const zoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    pauseMotion();
    map.zoomOut({ duration: 0 });
  };

  useEffect(() => {
    const readinessTimer = window.setTimeout(() => setMapStatus((current) => current === 'loading' ? 'fallback' : current), 3500);
    return () => window.clearTimeout(readinessTimer);
  }, []);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    let fallbackTimer: number | null = null;
    const map = new Map({
      container: container.current,
      style: REMOTE_STYLE,
      center: [1.22, 6.13],
      zoom: 1.35,
      minZoom: 1,
      maxZoom: 18,
      attributionControl: false,
      cooperativeGestures: false,
    });
    mapRef.current = map;
    const syncCameraPadding = () => {
      const sheet = document.querySelector<HTMLElement>('.nearby-sheet');
      const sheetHeight = sheet ? Math.max(0, window.innerHeight - sheet.getBoundingClientRect().top) : 0;
      const bottomPadding = sheetHeight > 0 ? Math.min(sheetHeight + 56, Math.max(180, window.innerHeight - 110)) : 0;
      map.setPadding({ top: 0, right: 0, bottom: bottomPadding, left: 0 });
    };
    syncCameraPadding();

    const scheduleRotation = () => {
      if (rotationTimer.current !== null) window.clearTimeout(rotationTimer.current);
      rotationTimer.current = window.setTimeout(rotate, 1400);
    };
    const resume = () => {
      if (contextSurfaceRef.current) {
        rotating.current = false;
        setRotationState('paused');
        return;
      }
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        rotating.current = false;
        setRotationState('reduced');
        return;
      }
      if (map.getZoom() < 2.4 && !map.isMoving()) {
        rotating.current = true;
        setRotationState('idle');
        scheduleRotation();
      } else {
        rotating.current = false;
        setRotationState('paused');
      }
    };
    const scheduleSettledResume = () => {
      if (rotationResumeTimer.current !== null) window.clearTimeout(rotationResumeTimer.current);
      rotationResumeTimer.current = window.setTimeout(() => {
        rotationResumeTimer.current = null;
        resume();
      }, 900);
    };
    const rotate = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        rotating.current = false;
        setRotationState('reduced');
        rotationTimer.current = null;
        return;
      }
      if (!rotating.current || map.isMoving() || map.getZoom() >= 2.4) {
        rotationTimer.current = null;
        return;
      }
      const nextLongitude = map.getCenter().lng + 0.035;
      setRotationState('rotating');
      setCenterLongitude(nextLongitude);
      map.easeTo({ center: [nextLongitude, map.getCenter().lat], duration: 1200, essential: false });
      scheduleRotation();
    };
    const configureStyle = () => {
      initialStyleReady.current = true;
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      if (!fallbackUsed.current) setMapStatus('ready');
      map.setProjection({ type: 'globe' });
      map.resize();
      syncCameraPadding();
      addLayers(map);
      const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
      source?.setData(featureCollection(facilitiesRef.current));
      setZoom(map.getZoom());
      scheduleScreenPins();
      emitBounds();
    };
    resumeMotionRef.current = resume;
    map.on('style.load', configureStyle);
    const emitBounds = () => {
      const bounds = map.getBounds();
      const next: [number, number, number, number] = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
      const key = next.map((value) => value.toFixed(4)).join(',');
      if (key === lastBoundsKey.current) return;
      lastBoundsKey.current = key;
      onBoundsChange?.(next);
    };

    map.on('mousedown', pauseMotion);
    map.on('touchstart', pauseMotion);
    map.on('wheel', pauseMotion);
    map.on('dragstart', pauseMotion);
    map.on('zoomstart', pauseMotion);
    map.on('move', scheduleScreenPins);
    map.on('moveend', () => { setCenterLongitude(map.getCenter().lng); emitBounds(); scheduleScreenPins(); scheduleSettledResume(); });
    map.on('dragend', () => { emitBounds(); scheduleScreenPins(); scheduleSettledResume(); });
    map.on('zoomend', () => { setZoom(map.getZoom()); emitBounds(); scheduleScreenPins(); });
    map.on('error', () => {
      if (fallbackUsed.current || initialStyleReady.current) return;
      fallbackUsed.current = true;
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      setMapStatus('fallback');
      map.setStyle(FALLBACK_STYLE);
    });
    fallbackTimer = window.setTimeout(() => {
      if (!initialStyleReady.current && !fallbackUsed.current && mapRef.current === map) {
        fallbackUsed.current = true;
        setMapStatus('fallback');
        map.setStyle(FALLBACK_STYLE);
      }
    }, 3000);
    map.on('load', () => {
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      if (!fallbackUsed.current) setMapStatus('ready');
      configureStyle();
      resume();
    });

    const observer = new ResizeObserver(() => { map.resize(); syncCameraPadding(); });
    observer.observe(container.current);
    const surfaceObserver = new MutationObserver(() => { syncCameraPadding(); scheduleScreenPins(); });
    surfaceObserver.observe(document.body, { childList: true, subtree: true });
    const handleWindowResize = () => { map.resize(); syncCameraPadding(); scheduleScreenPins(); };
    window.addEventListener('resize', handleWindowResize);
    return () => {
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      if (rotationTimer.current !== null) window.clearTimeout(rotationTimer.current);
      if (rotationResumeTimer.current !== null) window.clearTimeout(rotationResumeTimer.current);
      if (screenPinsFrame.current !== null) window.cancelAnimationFrame(screenPinsFrame.current);
      observer.disconnect();
      surfaceObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      resumeMotionRef.current = null;
      if (locationRequest.current !== null) window.clearTimeout(locationRequest.current);
      locationRequest.current = null;
      map.remove();
      mapRef.current = null;
    };

    function addLayers(target: Map) {
      if (target.getSource(SOURCE)) return;
      target.addSource(SOURCE, { type: 'geojson', data: featureCollection(facilitiesRef.current), cluster: true, clusterMaxZoom: 6, clusterRadius: 48 });
      target.addLayer({ id: 'omni-clusters', type: 'circle', source: SOURCE, filter: ['has', 'point_count'], paint: { 'circle-color': '#ed8a60', 'circle-radius': ['step', ['get', 'point_count'], 17, 10, 22, 30, 28], 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2, 'circle-opacity': 0.86 } });
      target.addLayer({ id: 'omni-cluster-count', type: 'symbol', source: SOURCE, filter: ['has', 'point_count'], layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 11 }, paint: { 'text-color': '#ffffff' } });
      target.addLayer({ id: 'omni-pins', type: 'circle', source: SOURCE, filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#2c5b50', 'circle-radius': 5.5, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } });
      target.addLayer({ id: 'omni-selected-halo', type: 'circle', source: SOURCE, filter: ['==', ['get', 'id'], ''], paint: { 'circle-color': '#e97c54', 'circle-radius': 17, 'circle-opacity': 0.2, 'circle-stroke-color': '#e97c54', 'circle-stroke-width': 1.5 } });
      target.on('click', 'omni-clusters', (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
        const clusterId = feature?.properties?.cluster_id;
        if (!feature || clusterId === undefined) return;
        const source = target.getSource(SOURCE) as GeoJSONSource;
        source.getClusterExpansionZoom(Number(clusterId)).then((nextZoom) => target.easeTo({ center: (feature.geometry as { type: 'Point'; coordinates: number[] }).coordinates as [number, number], zoom: nextZoom })).catch(() => undefined);
      });
      target.on('click', 'omni-pins', (event: MapLayerMouseEvent) => {
        const id = String(event.features?.[0]?.properties?.id ?? '');
        const facility = facilitiesRef.current.find((item) => item.id === id);
        if (facility) {
          pauseMotion();
          onSelect(facility);
          target.easeTo({ center: [facility.longitude, facility.latitude], zoom: Math.max(target.getZoom(), 5.2), duration: 700 });
        }
      });
      for (const layer of ['omni-clusters', 'omni-pins']) {
        target.on('mouseenter', layer, () => { target.getCanvas().style.cursor = 'pointer'; });
        target.on('mouseleave', layer, () => { target.getCanvas().style.cursor = ''; });
      }
    }
  }, [onBoundsChange, onSelect, scheduleScreenPins]);

  useEffect(() => {
    contextSurfaceRef.current = contextSurfaceOpen;
    if (contextSurfaceOpen) pauseMotion();
    else resumeMotionRef.current?.();
  }, [contextSurfaceOpen]);

  useEffect(() => {
    const source = mapRef.current?.getSource(SOURCE) as GeoJSONSource | undefined;
    source?.setData(featureCollection(facilities));
    scheduleScreenPins();
  }, [facilities, scheduleScreenPins]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer('omni-pins')) map.setPaintProperty('omni-pins', 'circle-color', ['case', ['==', ['get', 'id'], selectedId ?? ''], '#e97c54', '#2c5b50']);
    if (map.getLayer('omni-selected-halo')) map.setFilter('omni-selected-halo', ['==', ['get', 'id'], selectedId ?? '']);
    if (!selectedId) return;
    const selected = facilities.find((facility) => facility.id === selectedId);
    if (!selected || map.isMoving()) return;
    map.easeTo({ center: [selected.longitude, selected.latitude], zoom: Math.max(map.getZoom(), 5.2), duration: 650, essential: true });
  }, [facilities, selectedId]);

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const locationCopy = locationState === 'requesting'
    ? { title: 'Localisation en cours…', detail: 'La carte va se recentrer sur vous.' }
    : locationState === 'exact'
      ? { title: 'Carte centrée sur vous', detail: 'Position précise acceptée par le navigateur.' }
      : locationState === 'approximate'
        ? { title: 'Zone approximative', detail: 'La carte est centrée sans afficher une précision exacte.' }
        : locationState === 'denied'
          ? { title: 'Localisation désactivée', detail: 'Autorisez-la dans votre navigateur ou continuez à explorer.' }
          : locationState === 'timeout'
            ? { title: 'Localisation trop lente', detail: 'La carte publique reste disponible pendant la nouvelle tentative.' }
            : locationState === 'cancelled'
              ? { title: 'Localisation annulée', detail: 'Vous pouvez continuer à explorer la carte publique.' }
              : { title: 'Localisation indisponible', detail: 'Vous pouvez continuer à explorer la carte publique.' };

  return (
    <div className="map-stage" data-motion={prefersReducedMotion ? 'reduced' : 'full'} data-basemap="monochrome" data-zoom-enabled="true" data-zoom={zoom.toFixed(2)} data-center-lng={centerLongitude.toFixed(4)} data-rotation={rotationState} data-location={locationState}>
      <div ref={container} className="map-canvas" aria-label="Carte de découverte Omni" />
      <div className="map-pin-overlay" aria-label="Lieux publics sur la carte">
        {screenPins.map((pin) => pin.kind === 'cluster' ? (
          <button
            key={`cluster-${pin.longitude.toFixed(4)}-${pin.latitude.toFixed(4)}`}
            className="map-pin map-pin-cluster"
            type="button"
            style={{ left: pin.left, top: pin.top }}
            aria-label={`Afficher ${pin.count} lieux publics sur la carte`}
            onClick={() => { pauseMotion(); mapRef.current?.easeTo({ center: [pin.longitude, pin.latitude], zoom: Math.min(mapRef.current.getZoom() + 2, 6.3), duration: 500, essential: true }); }}
          >{pin.count}</button>
        ) : (
          <button
            key={`facility-${pin.facility?.name ?? pin.longitude.toFixed(4)}`}
            className={`map-pin map-pin-facility${pin.facility?.id === selectedId ? ' selected' : ''}`}
            type="button"
            style={{ left: pin.left, top: pin.top }}
            aria-label={`Ouvrir ${pin.facility?.name ?? 'le lieu public'}`}
            onClick={() => { if (pin.facility) { pauseMotion(); onSelect(pin.facility); mapRef.current?.easeTo({ center: [pin.facility.longitude, pin.facility.latitude], zoom: Math.max(mapRef.current.getZoom(), 5.2), duration: 650, essential: true }); } }}
          ><MapPin size={18} strokeWidth={2.4} /></button>
        ))}
      </div>
      <div className="map-texture" aria-hidden="true" />
      <div className="map-attribution">© OpenStreetMap contributors</div>
      <div className="map-status" aria-live="polite">{mapStatus === 'loading' ? 'Chargement de la carte' : mapStatus === 'fallback' ? 'Carte en mode de secours' : 'Carte active'}</div>
      {locationState !== 'idle' && <div className={`location-prompt location-${locationState}`} role={locationState === 'requesting' ? 'status' : 'group'} aria-label="État de la localisation">
        <span className="location-prompt-icon"><Crosshair size={15} /></span>
        <span className="location-prompt-copy"><strong>{locationCopy.title}</strong><small>{locationCopy.detail}</small></span>
        {locationState === 'requesting' ? <button type="button" onClick={cancelLocation}>Annuler</button> : (locationState === 'denied' || locationState === 'unavailable' || locationState === 'timeout' || locationState === 'cancelled') && <button type="button" onClick={requestLocation}>Réessayer</button>}
      </div>}
      <div className="map-controls" aria-label="Contrôles de carte">
        {zoomExpanded && <button className="zoom-out-control" type="button" aria-label="Zoom arrière" onClick={zoomOut}><Minus size={16} /></button>}
        <button className="zoom-in-control" type="button" aria-label="Zoom avant" aria-expanded={zoomExpanded} aria-controls="zoom-out-control" onClick={() => { zoomIn(); setZoomExpanded(true); }}><Plus size={17} /></button>
        <button className="location-control" type="button" aria-label="Utiliser ma localisation" onClick={requestLocation}><Crosshair size={16} /></button>
      </div>
    </div>
  );
}
