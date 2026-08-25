export const GLOBE_DRAG_LONGITUDE_GAIN = 0.55;
export const GLOBE_DRAG_LATITUDE_GAIN = 0.32;
export const GLOBE_MIN_LATITUDE = -82;
export const GLOBE_MAX_LATITUDE = 82;

export type GlobeAxisStart = {
  longitude: number;
  latitude: number;
  bearing: number;
};

export type GlobeAxisDelta = {
  x: number;
  y: number;
};

export function clampGlobeLatitude(latitude: number) {
  return Math.max(GLOBE_MIN_LATITUDE, Math.min(GLOBE_MAX_LATITUDE, latitude));
}

export function centerForGlobeAxisDrag(start: GlobeAxisStart, delta: GlobeAxisDelta): [number, number] {
  return [
    start.longitude - delta.x * GLOBE_DRAG_LONGITUDE_GAIN,
    clampGlobeLatitude(start.latitude + delta.y * GLOBE_DRAG_LATITUDE_GAIN),
  ];
}

export function bearingForGlobeAxisDrag(start: GlobeAxisStart) {
  return start.bearing;
}
