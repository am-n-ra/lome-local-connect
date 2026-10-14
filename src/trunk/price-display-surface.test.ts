import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * BRANCHES-PRICE-DISPLAY — the founder asked for the price WITHOUT and WITH the
 * Omni discount (the maquette shows both: Omni price + struck-through original +
 * `−N % Omni`). The app only ever showed the discounted price.
 *
 * The rule now lives in `price-display.ts` (unit-tested). This guard is the
 * cheap half: it reads the buyer surfaces and fails if any of them renders an
 * offer price as a bare `formatMoney(product.prixReduit, …)` again — the exact
 * line the defect lived on. A rendered check for `TrunkAppV13` would cost far
 * more than it proves (it mounts a map + the API), so we lock the source shape.
 */
const app = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');
const catalogue = readFileSync(new URL('./ProductCatalogueV13.tsx', import.meta.url), 'utf8');

describe('BRANCHES-PRICE-DISPLAY — prix sans / avec remise', () => {
  it('no buyer surface renders a bare discounted price again', () => {
    // The pre-fix shape: `<span className="pr">{formatMoney(product.prixReduit, …)}</span>`.
    expect(app).not.toMatch(/className="pr">\{formatMoney\((product|offer)\.prixReduit/);
    expect(catalogue).not.toMatch(/className="pr">\{formatMoney\((product|offer)\.prixReduit/);
  });

  it('the buyer surfaces render through the shared priceDisplay helper', () => {
    // Result cards, the offer-sheet rows, entity offers and the seller catalogue.
    expect(app).toMatch(/priceDisplay\(/);
    expect(catalogue).toMatch(/priceDisplay\(/);
  });

  it('the result card renders a struck-through original when one exists', () => {
    // The card composes the helper for the cheapest offer; the struck price is
    // rendered through `.old` so it can never be the same element as `.pr`'s price.
    expect(app).toMatch(/className="old">\{facilityCardPrice\.original\}/);
  });
});
