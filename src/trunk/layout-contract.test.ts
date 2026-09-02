import { describe, expect, it } from 'vitest';
import { dockBandOffset, hasVerticalOverlap } from './layout-contract';

describe('dock/grid layout contract', () => {
  it('reserves the minimum mobile gap from the real sheet top', () => {
    expect(dockBandOffset(375, 812, 482)).toBe(338);
  });

  it('reserves the wider desktop gap from the real sheet top', () => {
    expect(dockBandOffset(1280, 900, 464)).toBe(450);
  });

  it('detects overlap instead of relying on visual coincidence', () => {
    expect(hasVerticalOverlap(425, 474, 482, 812)).toBe(false);
    expect(hasVerticalOverlap(474, 483, 482, 812)).toBe(true);
  });
});
