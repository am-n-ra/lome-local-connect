import { describe, expect, it } from 'vitest';
import { RESULTS_SORTS, sortResults, metersBetween } from './results-sort';
import type { PublicFacility } from './types';

const facility = (over: Partial<PublicFacility> & { id: string }): PublicFacility => ({
  name: over.id,
  category: 'Divers',
  trust: 'confirmed',
  plan: 'free',
  productCount: 1,
  ...over,
} as PublicFacility);

const A = facility({ id: 'a', minPriceMinor: 126000, priceCurrency: 'XOF', maxDiscountPercent: 30, latitude: 6.2, longitude: 1.3 });
const B = facility({ id: 'b', minPriceMinor: 25500, priceCurrency: 'XOF', maxDiscountPercent: 25, latitude: 6.131, longitude: 1.221 });
const C = facility({ id: 'c', minPriceMinor: 18000, priceCurrency: 'XOF', maxDiscountPercent: 10, latitude: 6.3, longitude: 1.4 });
const serverOrder = [A, B, C];

describe('SEARCH-01 results-sort', () => {
  it('exposes the four maquette sorts', () => {
    expect(RESULTS_SORTS.map((s) => s.key)).toEqual(['best', 'near', 'price', 'disc']);
  });

  it('"best" leaves the server order untouched', () => {
    expect(sortResults(serverOrder, 'best', null).map((f) => f.id)).toEqual(['a', 'b', 'c']);
  });

  it('"near" sorts nearest first when a position is known', () => {
    const user = { latitude: 6.131, longitude: 1.221 }; // ~ on B
    expect(sortResults(serverOrder, 'near', user).map((f) => f.id)).toEqual(['b', 'a', 'c']);
  });

  it('"near" is inert without a position — never invents a distance', () => {
    expect(sortResults(serverOrder, 'near', null).map((f) => f.id)).toEqual(['a', 'b', 'c']);
  });

  it('"price" sorts cheapest first and sinks a place with no published price', () => {
    const noPrice = facility({ id: 'z', latitude: 6.2, longitude: 1.3 });
    const out = sortResults([A, B, C, noPrice], 'price', null).map((f) => f.id);
    expect(out).toEqual(['c', 'b', 'a', 'z']);
  });

  it('"price" never compares two different currencies', () => {
    const usd = facility({ id: 'u', minPriceMinor: 5, priceCurrency: 'USD', latitude: 6.2, longitude: 1.3 });
    // usd would sort first by number, but the currency differs → keep server order for the pair.
    const out = sortResults([A, usd], 'price', null).map((f) => f.id);
    expect(out).toEqual(['a', 'u']);
  });

  it('"disc" sorts best discount first; metersBetween is haversine', () => {
    expect(sortResults(serverOrder, 'disc', null).map((f) => f.id)).toEqual(['a', 'b', 'c']);
    const d = metersBetween({ latitude: 6.131, longitude: 1.221 }, { latitude: 6.131, longitude: 1.221 });
    expect(d).toBe(0);
    expect(metersBetween({ latitude: 6.131, longitude: 1.221 }, { latitude: 6.2, longitude: 1.3 })).toBeGreaterThan(0);
  });
});
