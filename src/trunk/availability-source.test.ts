import { describe, expect, it } from 'vitest';
import { availabilitySourceLabel, responseOrigin } from './availability-source';

/**
 * NR-7 — l'origine d'une réponse est LUE, jamais inventée.
 *
 * Défaut corrigé : `BuyerFlowV13` affichait `(source : auto)` en dur sur une réponse
 * que le vendeur venait de confirmer à la main. La surface doit maintenant nommer le
 * fait porté par la ligne.
 */
describe('NR-7 — l’origine d’une réponse de disponibilité', () => {
  it('nomme le vendeur quand le fait dit seller', () => {
    expect(responseOrigin('seller')).toBe('seller');
    expect(availabilitySourceLabel('seller')).toBe('Confirmé par le vendeur');
  });

  it('nomme l’automatisation quand le fait dit automation', () => {
    expect(responseOrigin('automation')).toBe('automation');
    expect(availabilitySourceLabel('automation')).toBe('Automatique · au nom du vendeur');
  });

  it('retombe sur le vendeur pour un fait absent ou inconnu', () => {
    // Le seul producteur réel aujourd'hui est le vendeur : ne jamais affirmer une
    // automatisation qui n'a pas eu lieu.
    expect(availabilitySourceLabel(null)).toBe('Confirmé par le vendeur');
    expect(availabilitySourceLabel(undefined)).toBe('Confirmé par le vendeur');
    expect(availabilitySourceLabel('quelque_chose')).toBe('Confirmé par le vendeur');
  });

  it('ne dit JAMAIS « auto » pour une réponse humaine', () => {
    // Le mensonge exact à empêcher.
    expect(availabilitySourceLabel('seller')).not.toMatch(/auto/i);
  });
});
