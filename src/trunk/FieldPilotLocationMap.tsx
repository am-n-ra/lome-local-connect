import { useEffect, useRef, useState } from 'react';
import { Crosshair, LocateFixed } from 'lucide-react';
import { Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const REMOTE_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const MAPLIBRE_WORKER_URL = '/maplibre-gl-worker.mjs';
const FALLBACK_POSITION = { latitude: 6.13, longitude: 1.22 };

type PositionState = 'requesting' | 'current' | 'approximate' | 'manual' | 'fallback' | 'denied' | 'unavailable' | 'timeout';

type Props = {
  latitude: string;
  longitude: string;
  setLatitude: (value: string) => void;
  setLongitude: (value: string) => void;
};

if (typeof window !== 'undefined') setWorkerUrl(MAPLIBRE_WORKER_URL);

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

function parsePosition(latitude: string, longitude: string) {
  const nextLatitude = Number(latitude);
  const nextLongitude = Number(longitude);
  if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude) || nextLatitude < -90 || nextLatitude > 90 || nextLongitude < -180 || nextLongitude > 180) return null;
  return { latitude: nextLatitude, longitude: nextLongitude };
}

function positionLabel(state: PositionState) {
  if (state === 'requesting') return 'Localisation de l’équipe…';
  if (state === 'current') return 'Position actuelle utilisée comme défaut';
  if (state === 'approximate') return 'Position actuelle approximative';
  if (state === 'manual') return 'Pin ajusté manuellement';
  if (state === 'denied') return 'Localisation refusée · position de Lomé proposée';
  if (state === 'timeout') return 'Localisation lente · position de Lomé proposée';
  if (state === 'unavailable') return 'Localisation indisponible · position de Lomé proposée';
  return 'Position de Lomé proposée · déplacez le pin si besoin';
}

export function FieldPilotLocationMap(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const didLocateRef = useRef(false);
  const [positionState, setPositionState] = useState<PositionState>('requesting');
  const [mapReady, setMapReady] = useState(false);
  const position = parsePosition(props.latitude, props.longitude) ?? FALLBACK_POSITION;

  const syncPosition = (latitude: number, longitude: number, state: PositionState, moveCamera: boolean) => {
    const map = mapRef.current;
    const marker = markerRef.current;
    const next = { latitude, longitude };
    props.setLatitude(formatCoordinate(next.latitude));
    props.setLongitude(formatCoordinate(next.longitude));
    setPositionState(state);
    if (marker) marker.setLngLat([next.longitude, next.latitude]);
    if (moveCamera && map) {
      map.easeTo({ center: [next.longitude, next.latitude], zoom: Math.max(map.getZoom(), 15.2), duration: 650, essential: true });
    }
  };

  const requestCurrentPosition = () => {
    if (!navigator.geolocation) {
      setPositionState('unavailable');
      return;
    }
    setPositionState('requesting');
    navigator.geolocation.getCurrentPosition(
      (current) => {
        const latitude = current.coords.latitude;
        const longitude = current.coords.longitude;
        const approximate = current.coords.accuracy > 500;
        didLocateRef.current = true;
        syncPosition(latitude, longitude, approximate ? 'approximate' : 'current', true);
      },
      (error) => {
        setPositionState(error.code === error.PERMISSION_DENIED ? 'denied' : error.code === error.TIMEOUT ? 'timeout' : 'unavailable');
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 8_000 },
    );
  };

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new Map({
      container: container.current,
      style: REMOTE_STYLE,
      center: [position.longitude, position.latitude],
      zoom: 12.4,
      minZoom: 3,
      maxZoom: 19,
      attributionControl: false,
      cooperativeGestures: false,
      dragPan: true,
      dragRotate: false,
      touchZoomRotate: true,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right');

    const markerElement = document.createElement('button');
    markerElement.type = 'button';
    markerElement.className = 'field-pilot-draggable-pin';
    markerElement.setAttribute('aria-label', 'Pin de la facilité, faites-le glisser pour corriger la position');
    markerElement.innerHTML = '<span class="field-pilot-pin-core"><span class="field-pilot-pin-dot"></span></span>';
    markerElement.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 0.001 : 0.0001;
      const current = parsePosition(props.latitude, props.longitude) ?? FALLBACK_POSITION;
      let latitude = current.latitude;
      let longitude = current.longitude;
      if (event.key === 'ArrowUp') latitude += step;
      else if (event.key === 'ArrowDown') latitude -= step;
      else if (event.key === 'ArrowLeft') longitude -= step;
      else if (event.key === 'ArrowRight') longitude += step;
      else return;
      event.preventDefault();
      syncPosition(Math.max(-90, Math.min(90, latitude)), Math.max(-180, Math.min(180, longitude)), 'manual', true);
    });
    const marker = new Marker({ element: markerElement, anchor: 'bottom', draggable: true }).setLngLat([position.longitude, position.latitude]).addTo(map);
    marker.on('dragstart', () => setPositionState('manual'));
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      syncPosition(lngLat.lat, lngLat.lng, 'manual', false);
    });
    markerRef.current = marker;

    map.on('load', () => {
      setMapReady(true);
      requestCurrentPosition();
    });
    map.on('click', (event) => {
      syncPosition(event.lngLat.lat, event.lngLat.lng, 'manual', false);
    });

    return () => {
      marker.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // This map is intentionally created once per sheet. The controlled coordinates
    // are synchronized below without recreating the map during a drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const next = parsePosition(props.latitude, props.longitude);
    if (!next) return;
    const current = marker.getLngLat();
    if (Math.abs(current.lat - next.latitude) > 0.0000005 || Math.abs(current.lng - next.longitude) > 0.0000005) marker.setLngLat([next.longitude, next.latitude]);
  }, [props.latitude, props.longitude]);

  return <div className="field-pilot-location" aria-label="Position de la facilité">
    <div className="field-pilot-location-head">
      <div><span className="section-kicker">Position terrain</span><strong>Placez le pin sur la facilité</strong></div>
      <button type="button" className="field-pilot-locate-button" onClick={requestCurrentPosition} disabled={positionState === 'requesting'}><LocateFixed size={14} />{positionState === 'requesting' ? 'Recherche…' : 'Ma position'}</button>
    </div>
    <div ref={container} className="field-pilot-location-map" data-ready={mapReady ? 'true' : 'false'} />
    <div className="field-pilot-location-foot"><span><Crosshair size={14} />{positionLabel(positionState)}</span><code>{formatCoordinate(position.latitude)}, {formatCoordinate(position.longitude)}</code></div>
    <p className="privacy-note">Le pin est prépositionné par votre appareil. Faites-le glisser ou touchez la carte pour corriger l’emplacement; les coordonnées sont transmises automatiquement.</p>
  </div>;
}
