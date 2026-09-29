import { describe, expect, it } from 'vitest';
import { viewportCenter, viewportMovedSignificantly } from './viewport-bounds';

describe('viewport exploration contract', () => {
  it('treats the first viewport as a load', () => {
    expect(viewportMovedSignificantly(null, [1.0, 6.0, 1.4, 6.3])).toBe(true);
  });
  it('ignores a tiny pan inside the same view', () => {
    expect(viewportMovedSignificantly([1.0, 6.0, 1.4, 6.3], [1.01, 6.0, 1.41, 6.3])).toBe(false);
  });
  it('reloads after a real pan to another neighbourhood', () => {
    expect(viewportMovedSignificantly([1.0, 6.0, 1.4, 6.3], [1.3, 6.0, 1.7, 6.3])).toBe(true);
  });
  it('reloads after a zoom that halves or doubles the covered area', () => {
    expect(viewportMovedSignificantly([1.0, 6.0, 1.4, 6.3], [1.1, 6.07, 1.3, 6.22])).toBe(true);
    expect(viewportMovedSignificantly([1.1, 6.07, 1.3, 6.22], [1.0, 6.0, 1.4, 6.3])).toBe(true);
  });
  it('rejects a degenerate viewport instead of dividing by zero', () => {
    expect(viewportMovedSignificantly([1.2, 6.1, 1.2, 6.1], [1.0, 6.0, 1.4, 6.3])).toBe(true);
  });
  it('centers a viewport the way the server orders it', () => {
    expect(viewportCenter([1.0, 6.0, 1.4, 6.3])).toEqual({ latitude: 6.15, longitude: 1.2 });
  });
});
