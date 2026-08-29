import { describe, it, expect } from 'vitest';
import { DirectInStoreScanSheet } from './DirectInStoreScanSheet';

describe('DirectInStoreScanSheet', () => {
  it('is exported as a valid React component', () => {
    expect(DirectInStoreScanSheet).toBeDefined();
    expect(typeof DirectInStoreScanSheet).toBe('function');
  });
});
