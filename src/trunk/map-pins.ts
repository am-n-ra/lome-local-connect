import type { PublicFacility } from './types';

export type ProjectedFacility = { facility: PublicFacility; x: number; y: number };

export type ScreenPin = {
  kind: 'cluster' | 'facility';
  left: number;
  top: number;
  longitude: number;
  latitude: number;
  count: number;
  facility?: PublicFacility;
};

type ScreenPinGroup = {
  members: ProjectedFacility[];
  x: number;
  y: number;
  longitude: number;
  latitude: number;
};

// ── Rule 7 (design system v3): pin anatomy ────────────────────────────────
// The pin core stays orange in both cases; the outer ring discriminates
// ownership — Evergreen #234D40 for a facility owned by the signed-in
// account, Cream/white for a third-party facility. Never invert
// (spec: « Jamais inverser »).
export const PIN_CORE_COLOR = '#F08F5A';
export const PIN_RING_OWNED_COLOR = '#234D40';
export const PIN_RING_THIRD_PARTY_COLOR = '#F9F7F2';
export const PIN_RADIUS_PX = 7;
export const PIN_RING_WIDTH_PX = 3;
export const PIN_SELECTED_SCALE = 1.3;

export function pinRingColor(owned: boolean): string {
  return owned ? PIN_RING_OWNED_COLOR : PIN_RING_THIRD_PARTY_COLOR;
}

// Spec « Sélectionné : scale 1.3 » — applied to the circle radius and its
// ring width so the whole pin (core + ring) scales uniformly in place.
export function pinRadiusPx(selected: boolean): number {
  return selected ? PIN_RADIUS_PX * PIN_SELECTED_SCALE : PIN_RADIUS_PX;
}

export function pinRingWidthPx(selected: boolean): number {
  return selected ? PIN_RING_WIDTH_PX * PIN_SELECTED_SCALE : PIN_RING_WIDTH_PX;
}

// GeoJSON source data for the map pins. Ownership is a plain per-feature
// property so the ring color stays a data-driven paint expression: updating
// ownership is a setData, never a map remount or a layer re-creation.
export function pinFeatureCollection(facilities: PublicFacility[], ownedFacilityIds?: string[] | null) {
  const owned = new Set(ownedFacilityIds ?? []);
  return {
    type: 'FeatureCollection' as const,
    features: facilities.map((facility) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [facility.longitude, facility.latitude] },
      properties: { id: facility.id, name: facility.name, trust: facility.trust, productCount: facility.productCount, owned: owned.has(facility.id) },
    })),
  };
}

export function groupProjectedFacilities(projected: ProjectedFacility[], radius = 48): ScreenPin[] {
  const groups: ScreenPinGroup[] = [];
  for (const candidate of projected) {
    const group = groups.find((item) => Math.hypot(item.x - candidate.x, item.y - candidate.y) <= radius);
    if (group) {
      group.members.push(candidate);
      group.x = group.members.reduce((sum, item) => sum + item.x, 0) / group.members.length;
      group.y = group.members.reduce((sum, item) => sum + item.y, 0) / group.members.length;
      group.longitude = group.members.reduce((sum, item) => sum + item.facility.longitude, 0) / group.members.length;
      group.latitude = group.members.reduce((sum, item) => sum + item.facility.latitude, 0) / group.members.length;
    } else {
      groups.push({
        members: [candidate],
        x: candidate.x,
        y: candidate.y,
        longitude: candidate.facility.longitude,
        latitude: candidate.facility.latitude,
      });
    }
  }

  return groups.map((group) => {
    const primary = group.members[0];
    return group.members.length > 1
      ? { kind: 'cluster', left: group.x, top: group.y, longitude: group.longitude, latitude: group.latitude, count: group.members.length }
      : { kind: 'facility', left: primary.x, top: primary.y, longitude: primary.facility.longitude, latitude: primary.facility.latitude, count: 1, facility: primary.facility };
  });
}
