import { describe, it, expect } from 'vitest';
import { OmniWalletModal } from './OmniWalletModal';

describe('OmniWalletModal', () => {
  it('is exported as a valid React component', () => {
    expect(OmniWalletModal).toBeDefined();
    expect(typeof OmniWalletModal).toBe('function');
  });
});
