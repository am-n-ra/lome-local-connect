import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * BRANCHES-SELLER-MENU — le menu vendeur ne doit pas séparer ce que la maquette joint, ni
 * dupliquer une destination. Le fondateur l'a vu à l'œil ; ces assertions le rendent mesurable.
 *
 * Maquette (autorité, `omni-species-v2-interactive.html` l.762) : « Mes offres — catalogue &
 * prix » (UN concept) et « Portefeuille & Plans » (UN concept). L'app, elle, exposait
 * « Produits & stock » + « Offres » (dont l'écran `OffersV13` était un cul-de-sac : premier
 * produit seulement, bouton désactivé), « Portefeuille » + « Plans », et « Mon espace » +
 * « Transactions » vers le même écran `seller`.
 */
const APP = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');
const COMPANY = readFileSync(resolve(__dirname, 'CompanyV13.tsx'), 'utf8');

function sellerMenu(): string {
  const start = APP.indexOf("role === 'seller' && (");
  return APP.slice(start, APP.indexOf("role === 'admin' && (", start));
}

describe('BRANCHES-SELLER-MENU — une destination par concept, aucune dupliquée', () => {
  it('« catalogue » et « offres » sont UNE seule entrée (Mes offres · catalogue & prix)', () => {
    const menu = sellerMenu();
    expect(menu).toContain('Mes offres');
    expect(menu).toContain('catalogue & prix');
    // Une seule entrée vers la surface catalogue : plus de « Offres » séparée.
    expect(menu.match(/setSheet\('products'\)/g)?.length).toBe(1);
    expect(menu).not.toMatch(/setSheet\('offers'\)/);
    expect(menu).not.toContain('Produits & stock');
  });

  it('« Portefeuille » et « Plans » sont UNE seule entrée', () => {
    const menu = sellerMenu();
    expect(menu).toContain('Portefeuille & Plans');
    expect(menu.match(/setSheet\('plans'\)/g)).toBeNull();
    expect(menu.match(/openWallet\(\)/g)?.length).toBe(1);
  });

  it('« Mon espace » et « Transactions » ne mènent plus au même écran sous deux libellés', () => {
    const menu = sellerMenu();
    expect(menu.match(/setSheet\('seller'\)/g)?.length).toBe(1);
    expect(menu).not.toContain('>Transactions<');
  });

  it('la maquette nomme l’entité, pas « Compagnies »', () => {
    expect(sellerMenu()).toContain('Fiche de l’entité');
    expect(sellerMenu()).not.toContain('Compagnies');
    expect(COMPANY).not.toContain('Compagnies');
  });
});

describe('BRANCHES-SELLER-MENU — l’écran mort est retiré', () => {
  it('aucune trace de la feuille `offers` ni du composant OffersV13', () => {
    expect(APP).not.toContain("'offers'");
    expect(APP).not.toContain('OffersV13');
  });

  it('le bouton « Dispo auto » (qui ouvrait « Prix & remise ») est parti de la fiche entité', () => {
    expect(COMPANY).not.toContain('onOffers');
    expect(COMPANY).not.toContain('Dispo auto');
  });
});
