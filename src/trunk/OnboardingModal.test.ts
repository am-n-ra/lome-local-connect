import { describe, it, expect } from 'vitest';
import { OnboardingModal } from './OnboardingModal';

describe('OnboardingModal', () => {
  it('is exported as a valid React component', () => {
    expect(OnboardingModal).toBeDefined();
    expect(typeof OnboardingModal).toBe('function');
  });
});
