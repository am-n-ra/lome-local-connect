import { describe, expect, it } from 'vitest';
import { canProposePrice, isNegotiable, negotiationReading, proposedPriceRejection } from './offer-price';

/**
 * R-H — `price_kind` décide, il ne décore pas.
 *
 * Chaque test dérive de la règle écrite dans `offer-price.ts` : négocier, c'est chercher un prix
 * PLUS BAS ; une offre à prix fixe n'ouvre aucune discussion ; une caractéristique non déclarée
 * n'accorde aucun droit. La falsification (neutraliser `proposedPriceRejection`) doit faire tomber
 * au moins les cas 2, 3 et 4 — sinon ces tests ne prouvent rien.
 */
describe('R-H — la négociation lue dans price_kind', () => {
  it('une offre négociable ouvre la proposition ; une offre fixe ou muette ne l’ouvre pas', () => {
    expect(isNegotiable('negociable')).toBe(true);
    expect(canProposePrice('negociable')).toBe(true);
    expect(canProposePrice('fixe')).toBe(false);
    // Offre héritée : la caractéristique n'a jamais été déclarée, on ne présume pas le droit.
    expect(canProposePrice(null)).toBe(false);
    expect(canProposePrice(undefined)).toBe(false);
  });

  it('négocier, c’est chercher MOINS cher : une proposition au-dessus du prix affiché est refusée', () => {
    expect(proposedPriceRejection({ priceKind: 'negociable', listedMinor: 10000, proposedMinor: 9000 })).toBeNull();
    expect(proposedPriceRejection({ priceKind: 'negociable', listedMinor: 10000, proposedMinor: 10000 })).toBeNull();
    const rejection = proposedPriceRejection({ priceKind: 'negociable', listedMinor: 10000, proposedMinor: 12000 });
    expect(rejection).not.toBeNull();
    expect(rejection).toContain('plus bas');
  });

  it('une offre à prix fixe refuse toute proposition : le prix affiché est le prix', () => {
    const rejection = proposedPriceRejection({ priceKind: 'fixe', listedMinor: 10000, proposedMinor: 9000 });
    expect(rejection).not.toBeNull();
    expect(rejection).toContain('prix fixe');
  });

  it('une caractéristique non déclarée refuse la proposition (aucun droit présumé)', () => {
    const rejection = proposedPriceRejection({ priceKind: null, listedMinor: 10000, proposedMinor: 9000 });
    expect(rejection).not.toBeNull();
  });

  it('l’absence de proposition reste acceptable — demander la dispo au prix affiché ne change pas', () => {
    expect(proposedPriceRejection({ priceKind: 'fixe', listedMinor: 10000, proposedMinor: null })).toBeNull();
    expect(proposedPriceRejection({ priceKind: null, listedMinor: 10000, proposedMinor: null })).toBeNull();
    expect(proposedPriceRejection({ priceKind: 'negociable', listedMinor: 10000, proposedMinor: null })).toBeNull();
  });

  it('refuse une proposition négative ou non entière', () => {
    expect(proposedPriceRejection({ priceKind: 'negociable', listedMinor: 10000, proposedMinor: -1 })).not.toBeNull();
    expect(proposedPriceRejection({ priceKind: 'negociable', listedMinor: 10000, proposedMinor: 3.5 })).not.toBeNull();
  });

  it('le prix qui engage la transaction reste celui du VENDEUR ; la proposition ouvre la discussion', () => {
    const discount = negotiationReading({ priceKind: 'negociable', listedMinor: 10000, proposedMinor: 8000, quotedMinor: 8500 });
    expect(discount.negotiated).toBe(true);
    expect(discount.discountMinor).toBe(1500);
    expect(discount.summary).toContain('Négocié');

    const held = negotiationReading({ priceKind: 'negociable', listedMinor: 10000, proposedMinor: 8000, quotedMinor: 10000 });
    expect(held.negotiated).toBe(true);
    expect(held.discountMinor).toBe(0);
    expect(held.summary).toContain('maintenu');

    // Prix fixe : aucune négociation lue, même si un prix est tracé.
    const fixed = negotiationReading({ priceKind: 'fixe', listedMinor: 10000, proposedMinor: null, quotedMinor: 10000 });
    expect(fixed.negotiated).toBe(false);
    expect(fixed.summary).toBeNull();
  });
});
