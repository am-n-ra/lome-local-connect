export function dockBandOffset(viewportWidth: number, viewportHeight: number, sheetTop: number): number {
  const gap = viewportWidth >= 900 ? 14 : 8;
  return Math.max(0, viewportHeight - sheetTop + gap);
}

export function hasVerticalOverlap(top: number, bottom: number, otherTop: number, otherBottom: number): boolean {
  return top < otherBottom && bottom > otherTop;
}
