import { describe, it, expect } from 'vitest';
import { SellerScannerModal } from './SellerScannerModal';

describe('SellerScannerModal', () => {
  it('is exported as a valid React component', () => {
    expect(SellerScannerModal).toBeDefined();
    expect(typeof SellerScannerModal).toBe('function');
  });
});
