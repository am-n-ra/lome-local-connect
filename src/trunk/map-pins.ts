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
