import { useEffect, useRef, useState } from 'react';
import { Crosshair, Minus, Plus } from 'lucide-react';
import { Map, type GeoJSONSource, type MapGeoJSONFeature, type MapLayerMouseEvent, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PublicFacility } from './types';

type Props = {
  facilities: PublicFacility[];
  selectedId: string | null;
  onSelect: (facility: PublicFacility) => void;
  onBoundsChange?: (bounds: [number, number, number, number]) => void;
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
  layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -1, 'raster-contrast': 0.12, 'raster-brightness-min': 0.18, 'raster-brightness-max': 0.96, 'raster-opacity': 0.96 } }],
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

export function TrunkMap({ facilities, selectedId, onSelect, onBoundsChange }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const facilitiesRef = useRef(facilities);
  const rotating = useRef(true);
  const rotationTimer = useRef<number | null>(null);
  const fallbackUsed = useRef(false);
  const lastBoundsKey = useRef<string | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [rotationState, setRotationState] = useState<'idle' | 'rotating' | 'paused' | 'reduced'>('idle');
  const [zoom, setZoom] = useState(1.35);
  const [centerLongitude, setCenterLongitude] = useState(1.22);
  facilitiesRef.current = facilities;

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
    const pause = () => { rotating.current = false; setRotationState(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'paused'); };
    const resume = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { rotating.current = false; setRotationState('reduced'); return; }
      if (map.getZoom() < 2.4) { rotating.current = true; setRotationState('idle'); }
    };
    const emitBounds = () => {
      const bounds = map.getBounds();
      const next: [number, number, number, number] = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
      const key = next.map((value) => value.toFixed(4)).join(',');
      if (key === lastBoundsKey.current) return;
      lastBoundsKey.current = key;
      onBoundsChange?.(next);
    };
    map.on('mousedown', pause);
    map.on('touchstart', pause);
    map.on('wheel', pause);
    map.on('dragstart', pause);
    map.on('zoomstart', pause);
    map.on('moveend', () => { setCenterLongitude(map.getCenter().lng); resume(); });
    map.on('dragend', emitBounds);
    map.on('zoomend', () => { setZoom(map.getZoom()); emitBounds(); });
    map.on('error', () => {
      if (fallbackUsed.current) return;
      fallbackUsed.current = true;
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      setMapStatus('fallback');
      map.setStyle(FALLBACK_STYLE);
    });
    fallbackTimer = window.setTimeout(() => {
      if (!fallbackUsed.current && mapRef.current === map) {
        fallbackUsed.current = true;
        setMapStatus('fallback');
        map.setStyle(FALLBACK_STYLE);
      }
    }, 3000);
    map.on('load', () => {
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      setMapStatus('ready');
      setRotationState(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'idle');
      map.setProjection({ type: 'globe' });
      setZoom(map.getZoom());
      map.resize();
      addLayers(map);
      emitBounds();
      const rotate = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { rotating.current = false; setRotationState('reduced'); return; }
        if (rotating.current && !map.isMoving()) {
          const nextLongitude = map.getCenter().lng + 0.04;
          setRotationState('rotating');
          setCenterLongitude(nextLongitude);
          map.easeTo({ center: [nextLongitude, map.getCenter().lat], duration: 1200, essential: false });
        }
        rotationTimer.current = window.setTimeout(rotate, 1400);
      };
      rotationTimer.current = window.setTimeout(rotate, 1400);
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);
    return () => { if (fallbackTimer !== null) window.clearTimeout(fallbackTimer); if (rotationTimer.current !== null) window.clearTimeout(rotationTimer.current); observer.disconnect(); map.remove(); mapRef.current = null; };

    function addLayers(target: Map) {
      if (target.getSource(SOURCE)) return;
      target.addSource(SOURCE, { type: 'geojson', data: featureCollection(facilitiesRef.current), cluster: true, clusterMaxZoom: 6, clusterRadius: 48 });
      target.addLayer({ id: 'omni-clusters', type: 'circle', source: SOURCE, filter: ['has', 'point_count'], paint: { 'circle-color': '#ec7c42', 'circle-radius': ['step', ['get', 'point_count'], 18, 10, 23, 30, 29], 'circle-stroke-color': '#fffaf4', 'circle-stroke-width': 2, 'circle-opacity': 0.94 } });
      target.addLayer({ id: 'omni-cluster-count', type: 'symbol', source: SOURCE, filter: ['has', 'point_count'], layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12 }, paint: { 'text-color': '#fffaf4' } });
      target.addLayer({ id: 'omni-pins', type: 'circle', source: SOURCE, filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#2b211c', 'circle-radius': 7, 'circle-stroke-color': '#fffaf4', 'circle-stroke-width': 2 } });
      target.addLayer({ id: 'omni-selected-halo', type: 'circle', source: SOURCE, filter: ['==', ['get', 'id'], ''], paint: { 'circle-color': '#ec7c42', 'circle-radius': 19, 'circle-opacity': 0.22, 'circle-stroke-color': '#ec7c42', 'circle-stroke-width': 1.5 } });
      target.on('click', 'omni-clusters', (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
        const clusterId = feature?.properties?.cluster_id;
        if (!feature || clusterId === undefined) return;
        const source = target.getSource(SOURCE) as GeoJSONSource;
        source.getClusterExpansionZoom(Number(clusterId)).then((zoom) => target.easeTo({ center: (feature.geometry as { type: 'Point'; coordinates: number[] }).coordinates as [number, number], zoom })).catch(() => undefined);
      });
      target.on('click', 'omni-pins', (event: MapLayerMouseEvent) => {
        const id = String(event.features?.[0]?.properties?.id ?? '');
        const facility = facilitiesRef.current.find((item) => item.id === id);
        if (facility) { pause(); onSelect(facility); target.easeTo({ center: [facility.longitude, facility.latitude], zoom: Math.max(target.getZoom(), 5.2), duration: 700 }); }
      });
      for (const layer of ['omni-clusters', 'omni-pins']) {
        target.on('mouseenter', layer, () => { target.getCanvas().style.cursor = 'pointer'; });
        target.on('mouseleave', layer, () => { target.getCanvas().style.cursor = ''; });
      }
    }
  }, [onBoundsChange, onSelect]);

  useEffect(() => {
    const source = mapRef.current?.getSource(SOURCE) as GeoJSONSource | undefined;
    source?.setData(featureCollection(facilities));
  }, [facilities]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer('omni-pins')) map.setPaintProperty('omni-pins', 'circle-color', ['case', ['==', ['get', 'id'], selectedId ?? ''], '#ec7c42', '#2b211c']);
    if (map.getLayer('omni-selected-halo')) map.setFilter('omni-selected-halo', ['==', ['get', 'id'], selectedId ?? '']);
  }, [selectedId]);

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div className="map-stage" data-motion={prefersReducedMotion ? 'reduced' : 'full'} data-basemap="monochrome" data-zoom-enabled="true" data-zoom={zoom.toFixed(2)} data-center-lng={centerLongitude.toFixed(4)} data-rotation={rotationState}>
      <div ref={container} className="map-canvas" aria-label="Omni discovery globe" />
      <div className="map-attribution">© OpenStreetMap contributors · © OpenMapTiles</div>
      <div className="map-status" aria-live="polite">{mapStatus === 'loading' ? 'Loading the globe…' : mapStatus === 'fallback' ? 'Map tiles are in fallback mode' : 'Live map'}</div>
      <div className="map-controls" aria-label="Map controls">
        <button type="button" aria-label="Locate me" onClick={() => navigator.geolocation?.getCurrentPosition((position) => mapRef.current?.easeTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 7, duration: 850 }))}><Crosshair size={16} /></button>
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}><Plus size={16} /></button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}><Minus size={16} /></button>
      </div>
    </div>
  );
}
