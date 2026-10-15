import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { primaryOfferVisual } from './offer-existence';

/**
 * S-20 / E-03 — le visuel d'offre doit être VISIBLE par l'acheteur.
 *
 * Le stockage, le contrat public et l'API existaient déjà ; seul le RENDU manquait : la fiche
 * acheteur affichait une boîte grise (`<span className="pthumb" />`) alors que le catalogue du
 * VENDEUR montrait l'image. Le visuel était stocké, publié, transporté — jamais montré.
 *
 * Ce garde verrouille le contrat dans les deux sens : `primaryOfferVisual` choisit le premier
 * visuel utilisable (et `null` sinon, jamais une `<img src="">` cassée), et les DEUX surfaces
 * acheteur rendent l'image quand elle existe.
 */
const APP = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');

describe('le visuel d’offre est rendu côté acheteur (S-20 / E-03)', () => {
  it('primaryOfferVisual choisit le premier visuel valide, sinon null', () => {
    expect(primaryOfferVisual([{ url: 'https://x.public.blob.vercel-storage.com/a.png', kind: 'image' }]))
      .toBe('https://x.public.blob.vercel-storage.com/a.png');
    // Plusieurs visuels : le premier, pour que vendeur et acheteur s'accordent sur « le » visuel.
    expect(primaryOfferVisual([
      { url: 'https://x.public.blob.vercel-storage.com/a.png', kind: 'image' },
      { url: 'https://x.public.blob.vercel-storage.com/b.png', kind: 'image' },
    ])).toBe('https://x.public.blob.vercel-storage.com/a.png');
    // Jamais d'URL vide : pas de visuel ⇒ null (le placeholder reste), pas de `<img src="">`.
    expect(primaryOfferVisual([])).toBeNull();
    expect(primaryOfferVisual(null)).toBeNull();
    expect(primaryOfferVisual('junk')).toBeNull();
    expect(primaryOfferVisual([{ url: 'not-a-url' }])).toBeNull();
  });

  it('la fiche facilité rend l’image du produit (pas seulement le placeholder)', () => {
    expect(APP).toContain('primaryOfferVisual(product.media)');
    expect(APP).toMatch(/<img className="pthumb" src=\{primaryOfferVisual\(product\.media\)!\}/);
  });

  it('la page entité rend l’image de chaque offre', () => {
    expect(APP).toContain('primaryOfferVisual(offer.media)');
    expect(APP).toMatch(/<img className="pthumb" src=\{primaryOfferVisual\(offer\.media\)!\}/);
  });
});
