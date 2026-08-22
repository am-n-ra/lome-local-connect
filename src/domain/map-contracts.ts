import type { FacilityTrust } from './contracts';

export const MAP_CONTEXT_VERSION = 1 as const;

export type MapMode =
  | 'idle_globe'
  | 'local_map'
  | 'cluster_selected'
  | 'trust_marker'
  | 'facility_focus'
  | 'route_visible'
  | 'map_recovery';

export interface MapCamera {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export type MapFilterValue = string | number | boolean | null | readonly string[];

export interface MapContextSnapshot {
  version: typeof MAP_CONTEXT_VERSION;
  mode: MapMode;
  camera: MapCamera;
  query: string;
  filters: Readonly<Record<string, MapFilterValue>>;
  selectedFacilityId: string | null;
  selectedProductId: string | null;
  availabilityRequestId: string | null;
  returnSurface: string;
  capturedAt: string;
}

const MAP_MODES: readonly MapMode[] = [
  'idle_globe',
  'local_map',
  'cluster_selected',
  'trust_marker',
  'facility_focus',
  'route_visible',
  'map_recovery',
];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidCamera(camera: unknown): camera is MapCamera {
  if (!camera || typeof camera !== 'object') return false;
  const candidate = camera as Partial<MapCamera>;
  return (
    isFiniteNumber(candidate.longitude) && candidate.longitude >= -180 && candidate.longitude <= 180 &&
    isFiniteNumber(candidate.latitude) && candidate.latitude >= -90 && candidate.latitude <= 90 &&
    isFiniteNumber(candidate.zoom) && candidate.zoom >= 0 && candidate.zoom <= 24 &&
    isFiniteNumber(candidate.bearing) && candidate.bearing >= -360 && candidate.bearing <= 360 &&
    isFiniteNumber(candidate.pitch) && candidate.pitch >= 0 && candidate.pitch <= 85
  );
}

function isMapFilterValue(value: unknown): value is MapFilterValue {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isMapMode(value: unknown): value is MapMode {
  return typeof value === 'string' && MAP_MODES.includes(value as MapMode);
}

export function isMapContextSnapshot(value: unknown): value is MapContextSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<MapContextSnapshot>;
  if (candidate.version !== MAP_CONTEXT_VERSION || !isMapMode(candidate.mode) || !isValidCamera(candidate.camera)) return false;
  if (typeof candidate.query !== 'string' || typeof candidate.returnSurface !== 'string' || typeof candidate.capturedAt !== 'string') return false;
  if (candidate.selectedFacilityId !== null && typeof candidate.selectedFacilityId !== 'string') return false;
  if (candidate.selectedProductId !== null && typeof candidate.selectedProductId !== 'string') return false;
  if (candidate.availabilityRequestId !== null && typeof candidate.availabilityRequestId !== 'string') return false;
  if (!candidate.filters || typeof candidate.filters !== 'object' || Array.isArray(candidate.filters)) return false;
  return Object.values(candidate.filters).every(isMapFilterValue);
}

export function serializeMapContext(snapshot: MapContextSnapshot): string {
  if (!isMapContextSnapshot(snapshot)) throw new Error('INVALID_MAP_CONTEXT');
  return JSON.stringify(snapshot);
}

export function restoreMapContext(serialized: string): MapContextSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(serialized);
    return isMapContextSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export type PublicMarkerKind = 'facility' | 'cluster' | 'trust';
export type PublicMarkerSemantics = 'source_presence' | 'density' | 'trust_only';

export interface PublicMapMarker {
  id: string;
  kind: PublicMarkerKind;
  label: string;
  center: Pick<MapCamera, 'longitude' | 'latitude'>;
  semantics: PublicMarkerSemantics;
  stock: 'not_disclosed';
  trust: FacilityTrust | null;
  count: number | null;
}

export type PublicMarkerInput = {
  id: string;
  kind: PublicMarkerKind;
  label: string;
  longitude: number;
  latitude: number;
  trust?: FacilityTrust | null;
  count?: number | null;
};

export function toPublicMapMarker(input: PublicMarkerInput): PublicMapMarker {
  if (!input.id || !input.label || !isFiniteNumber(input.longitude) || !isFiniteNumber(input.latitude)) {
    throw new Error('INVALID_PUBLIC_MARKER');
  }
  if (input.longitude < -180 || input.longitude > 180 || input.latitude < -90 || input.latitude > 90) {
    throw new Error('INVALID_PUBLIC_MARKER');
  }
  if (input.kind === 'cluster' && (!Number.isInteger(input.count) || input.count! < 1)) {
    throw new Error('INVALID_PUBLIC_MARKER');
  }
  const semantics: PublicMarkerSemantics = input.kind === 'facility'
    ? 'source_presence'
    : input.kind === 'cluster'
      ? 'density'
      : 'trust_only';
  return {
    id: input.id,
    kind: input.kind,
    label: input.label,
    center: { longitude: input.longitude, latitude: input.latitude },
    semantics,
    stock: 'not_disclosed',
    trust: input.kind === 'trust' ? input.trust ?? null : null,
    count: input.kind === 'cluster' ? input.count! : null,
  };
}

export type RouteAuthorizationInput = {
  transactionId: string;
  facilityId: string;
  actorAccountId: string;
  buyerAccountId: string;
  confirmedIntent: boolean;
  transactionMembers: readonly string[];
  locationPolicy: 'private_after_intent';
};

export type RouteAuthorizationDecision =
  | {
      allowed: true;
      transactionId: string;
      facilityId: string;
      actorAccountId: string;
      visibility: 'private';
    }
  | {
      allowed: false;
      code: 'ROUTE_NOT_AUTHORIZED';
      reason: 'intent_required' | 'membership_required' | 'location_policy_required' | 'invalid_request';
    };

export function authorizePrivateRoute(input: RouteAuthorizationInput): RouteAuthorizationDecision {
  if (!input.transactionId || !input.facilityId || !input.actorAccountId || !input.buyerAccountId) {
    return { allowed: false, code: 'ROUTE_NOT_AUTHORIZED', reason: 'invalid_request' };
  }
  if (input.locationPolicy !== 'private_after_intent') {
    return { allowed: false, code: 'ROUTE_NOT_AUTHORIZED', reason: 'location_policy_required' };
  }
  if (!input.confirmedIntent) {
    return { allowed: false, code: 'ROUTE_NOT_AUTHORIZED', reason: 'intent_required' };
  }
  if (!input.transactionMembers.includes(input.actorAccountId)) {
    return { allowed: false, code: 'ROUTE_NOT_AUTHORIZED', reason: 'membership_required' };
  }
  return {
    allowed: true,
    transactionId: input.transactionId,
    facilityId: input.facilityId,
    actorAccountId: input.actorAccountId,
    visibility: 'private',
  };
}
