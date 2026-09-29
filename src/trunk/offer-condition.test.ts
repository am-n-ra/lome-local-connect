import { describe, expect, it } from 'vitest';
import { isOccasion, OCCASION_DETAIL_MIN_CHARS, occasionDetailMissing } from './offer-condition';

describe('offer condition rule contract (R-I)', () => {
  it('lets a new offer through whatever its description says', () => {
    expect(occasionDetailMissing('neuf', null)).toBe(false);
    expect(occasionDetailMissing('neuf', '')).toBe(false);
  });
  it('lets an undeclared characteristic through: CONDITION_REQUIRED speaks there, not this rule', () => {
    expect(occasionDetailMissing(null, null)).toBe(false);
    expect(occasionDetailMissing(undefined, '   ')).toBe(false);
  });
  it('blocks an occasion with no word on its state', () => {
    expect(occasionDetailMissing('occasion', null)).toBe(true);
    expect(occasionDetailMissing('occasion', '   ')).toBe(true);
    expect(occasionDetailMissing('occasion', 'bon état')).toBe(true);
  });
  it('publishes an occasion that describes its state', () => {
    expect(occasionDetailMissing('occasion', 'Écran fissuré, batterie 80%, vendu avec chargeur')).toBe(false);
  });
  it('pins the detail threshold to the S-32 integrity constant, not an invented number', () => {
    expect(OCCASION_DETAIL_MIN_CHARS).toBe(10);
    expect(isOccasion('occasion')).toBe(true);
    expect(isOccasion('neuf')).toBe(false);
  });
});
