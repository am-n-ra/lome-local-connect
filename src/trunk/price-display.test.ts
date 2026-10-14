import { describe, expect, it } from 'vitest';
import { priceDisplay } from './price-display';

/**
 * BRANCHES-PRICE-DISPLAY — the one rule every surface shares.
 *
 * The founder asked for the price WITHOUT and WITH the Omni discount. The trap
 * this test locks: a struck original that equals the shown price, or a `−0 %`
 * badge — both of which would advertise a saving that does not exist.
 */
describe('BRANCHES-PRICE-DISPLAY — prix sans / avec remise', () => {
  it('shows both prices and the derived % when there is a real reduction', () => {
    const pd = priceDisplay({ prixOriginal: 30000, prixReduit: 25500, currency: 'XOF' });
    expect(pd.price).toContain('255');
    expect(pd.original).toContain('300');
    expect(pd.discountPct).toBe(15);
    expect(pd.promo).toBe('−15 % Omni');
  });

  it('derives the % from the two printed prices — never a separate field', () => {
    // A fixed discount (no declared percentage) still yields its true figure.
    const pd = priceDisplay({ prixOriginal: 100000, prixReduit: 90000, currency: 'XOF' });
    expect(pd.discountPct).toBe(10);
    expect(pd.promo).toBe('−10 % Omni');
  });

  it('shows NO struck price and NO badge when there is no reduction', () => {
    const pd = priceDisplay({ prixOriginal: 100000, prixReduit: 100000, currency: 'XOF' });
    expect(pd.original).toBeNull();
    expect(pd.discountPct).toBeNull();
    expect(pd.promo).toBeNull();
  });

  it('never invents a −0 % when the reduction rounds to zero', () => {
    // 100000 -> 99900 is a real saving but rounds to 0 %: show the struck price,
    // but no badge (a −0 % badge is a lie).
    const pd = priceDisplay({ prixOriginal: 100000, prixReduit: 99900, currency: 'XOF' });
    expect(pd.original).not.toBeNull();
    expect(pd.promo).toBeNull();
    expect(pd.discountPct).toBeNull();
  });

  it('keeps the offer currency — never the viewer market', () => {
    const pd = priceDisplay({ prixOriginal: 100000, prixReduit: 90000, currency: 'XOF' });
    expect(pd.price).toMatch(/F/);
    expect(pd.price).not.toMatch(/\$/);
  });
});
