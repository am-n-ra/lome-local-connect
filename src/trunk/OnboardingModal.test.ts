import { describe, it, expect } from 'vitest';
import { TrunkAppV13 } from './TrunkAppV13';

describe('TrunkAppV13 ex-Onboarding legacy decommissionne', () => {
  it('exports la coquille V13 1:1 comme composant React valide', () => {
    expect(TrunkAppV13).toBeDefined();
    expect(typeof TrunkAppV13).toBe('function');
  });
});
