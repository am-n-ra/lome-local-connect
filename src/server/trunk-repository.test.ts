import { describe, expect, it } from 'vitest';
import { toProduct } from './trunk-repository';

describe('public product boundary', () => {
  it('does not expose allocated stock as a public catalogue fact', () => {
    const product = toProduct({
      id: 'product-1',
      facility_id: 'facility-1',
      name: 'Tomatoes',
      description: 'Fresh tomatoes',
      category: 'Fresh produce',
      unit: '1 kg',
      price_minor: 1500,
      currency: 'XOF',
      quantity_allocated_omni: 12,
      coupon_label: null,
    });

    expect(product).not.toHaveProperty('availableQuantity');
    expect(product).not.toHaveProperty('quantity_allocated_omni');
    expect(product).toMatchObject({ id: 'product-1', facilityId: 'facility-1', name: 'Tomatoes', priceMinor: 1500 });
  });
});
