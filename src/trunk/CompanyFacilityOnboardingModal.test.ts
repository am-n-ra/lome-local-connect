import { describe, it, expect } from 'vitest';
import { CompanyFacilityOnboardingModal } from './CompanyFacilityOnboardingModal';

describe('CompanyFacilityOnboardingModal', () => {
  it('is exported as a valid React component', () => {
    expect(CompanyFacilityOnboardingModal).toBeDefined();
    expect(typeof CompanyFacilityOnboardingModal).toBe('function');
  });
});
