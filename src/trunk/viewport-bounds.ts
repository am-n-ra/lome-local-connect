// Viewport-driven discovery: the map explores the corpus window by window instead of showing
// one frozen world set. This module is pure (no DOM, no timers) so the significance rule is
// unit-testable; the debounce timer lives in TrunkAppV13 as thin glue.

export type ViewportBounds = [number, number, number, number]; // west, south, east, north

export function viewportCenter(bounds: ViewportBounds): { latitude: number; longitude: number } {
  return { latitude: (bounds[1] + bounds[3]) / 2, longitude: (bounds[0] + bounds[2]) / 2 };
}

/**
 * A viewport change is worth a refetch when the user actually moved somewhere else:
 * first load, a pan beyond a quarter of the smallest viewport side, or a zoom that
 * changes the covered area by more than half. Degree-based: exact enough to decide
 * "elsewhere" at any zoom, never used as a distance shown to the user.
 */
export function viewportMovedSignificantly(prev: ViewportBounds | null, next: ViewportBounds): boolean {
  if (prev === null) return true;
  const prevWidth = Math.abs(prev[2] - prev[0]);
  const prevHeight = Math.abs(prev[3] - prev[1]);
  const nextWidth = Math.abs(next[2] - next[0]);
  const nextHeight = Math.abs(next[3] - next[1]);
  if (prevWidth <= 0 || prevHeight <= 0 || nextWidth <= 0 || nextHeight <= 0) return true;
  const prevCenter = viewportCenter(prev);
  const nextCenter = viewportCenter(next);
  const shift = Math.max(Math.abs(nextCenter.longitude - prevCenter.longitude), Math.abs(nextCenter.latitude - prevCenter.latitude));
  if (shift > 0.25 * Math.min(nextWidth, nextHeight)) return true;
  const areaRatio = (nextWidth * nextHeight) / (prevWidth * prevHeight);
  return areaRatio > 1.5 || areaRatio < 1 / 1.5;
}
