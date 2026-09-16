import { describe, expect, it } from 'vitest';
import { cartProductCount, cartProductsFor, clearFacilityCart, emptyCarts, parseCarts, pruneCart, serializeCarts, toggleCartProduct } from './facility-cart';

describe('COR-7c facility cart contract', () => {
  it('toggles a product in and out of one seller cart without touching other sellers', () => {
    let carts = emptyCarts();
    carts = toggleCartProduct(carts, 'f-1', 'p-1');
    carts = toggleCartProduct(carts, 'f-1', 'p-2');
    carts = toggleCartProduct(carts, 'f-2', 'p-9');
    expect(cartProductsFor(carts, 'f-1')).toEqual(['p-1', 'p-2']);
    expect(cartProductsFor(carts, 'f-2')).toEqual(['p-9']);
    carts = toggleCartProduct(carts, 'f-1', 'p-1');
    expect(cartProductsFor(carts, 'f-1')).toEqual(['p-2']);
    expect(cartProductCount(carts, 'f-2')).toBe(1);
  });

  it('drops the seller entry once its last product is removed', () => {
    let carts = toggleCartProduct(emptyCarts(), 'f-1', 'p-1');
    carts = toggleCartProduct(carts, 'f-1', 'p-1');
    expect(carts).toEqual({});
    expect(cartProductsFor(carts, 'f-1')).toEqual([]);
  });

  it('clears only the requested seller cart', () => {
    let carts = toggleCartProduct(toggleCartProduct(emptyCarts(), 'f-1', 'p-1'), 'f-2', 'p-2');
    carts = clearFacilityCart(carts, 'f-1');
    expect(cartProductsFor(carts, 'f-1')).toEqual([]);
    expect(cartProductsFor(carts, 'f-2')).toEqual(['p-2']);
  });

  it('prunes products withdrawn from the facility and keeps the cart otherwise', () => {
    const carts = toggleCartProduct(toggleCartProduct(emptyCarts(), 'f-1', 'p-1'), 'f-1', 'p-2');
    const same = pruneCart(carts, 'f-1', ['p-1', 'p-2']);
    expect(same).toBe(carts);
    const pruned = pruneCart(carts, 'f-1', ['p-2']);
    expect(cartProductsFor(pruned, 'f-1')).toEqual(['p-2']);
    expect(cartProductsFor(pruneCart(carts, 'f-1', []), 'f-1')).toEqual([]);
  });

  it('round-trips through session serialization and rejects junk', () => {
    const carts = toggleCartProduct(emptyCarts(), 'f-1', 'p-1');
    expect(parseCarts(serializeCarts(carts))).toEqual(carts);
    expect(parseCarts(null)).toEqual({});
    expect(parseCarts('not json')).toEqual({});
    expect(parseCarts('[]')).toEqual({});
    expect(parseCarts('{"f-1":"x","f-2":[1,2],"f-3":["a","a"]}')).toEqual({ 'f-3': ['a'] });
  });
});
