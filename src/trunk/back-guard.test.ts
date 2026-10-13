import { describe, expect, it } from 'vitest';
import { backDestination, shouldInterceptBack, shouldSkipExternalRedirect } from './back-guard';

describe('BRANCH-3 — le retour navigateur ne ferme pas Omni', () => {
  it('intercepte dès qu’une surface est ouverte', () => {
    expect(shouldInterceptBack('facility', 'buyer', true)).toBe(true);
    expect(shouldInterceptBack('results', 'buyer', false)).toBe(true);
    expect(shouldInterceptBack('menu', 'buyer', false)).toBe(true);
  });

  it('intercepte pour un rôle non-acheteur même carte nue', () => {
    expect(shouldInterceptBack('none', 'operator', false)).toBe(true);
    expect(shouldInterceptBack('none', 'admin', false)).toBe(true);
    expect(shouldInterceptBack('none', 'seller', false)).toBe(true);
  });

  it('n’intercepte pas la carte nue en contexte acheteur (le retour quitte Omni)', () => {
    expect(shouldInterceptBack('none', 'buyer', false)).toBe(false);
  });

  it('une sous-feuille revient à sa FEUILLE PARENTE (jamais ne quitte l’app)', () => {
    // bulk vit dans la fiche facilité — un retour y mène, il ne ferme pas Omni.
    expect(backDestination('bulk', 'buyer', true)).toMatchObject({ exit: false, sheet: 'facility', stillOpen: true });
    expect(backDestination('seller-reply', 'seller', false)).toMatchObject({ exit: false, sheet: 'seller', stillOpen: true });
    // La fiche facilité revient à la carte, sans quitter l'app.
    expect(backDestination('facility', 'buyer', true)).toMatchObject({ exit: false, sheet: 'none', clearSelection: true, stillOpen: false });
  });

  it('une feuille racine (menu) se ferme vers la carte — puis un retour quitte l’app', () => {
    // Depuis le menu : premier retour → carte (surface encore ouverte car on est… acheteur sans sélection → non).
    expect(backDestination('menu', 'buyer', false)).toMatchObject({ exit: false, sheet: 'none', stillOpen: false });
    // Carte nue acheteur : le retour quitte Omni.
    expect(backDestination('none', 'buyer', false)).toMatchObject({ exit: true });
  });

  it('un rôle non-acheteur revient à Acheteur avant de quitter', () => {
    const first = backDestination('none', 'operator', false);
    expect(first).toMatchObject({ exit: false, role: 'buyer', sheet: 'none', stillOpen: false });
    const second = backDestination(first.sheet, first.role, false);
    expect(second.exit).toBe(true);
  });
});

describe('BRANCH-4 — au retour d’un paiement externe, on saute la page du fournisseur', () => {
  it('ne saute rien s’il n’y a pas eu de redirection externe', () => {
    expect(shouldSkipExternalRedirect(0)).toBe(false);
  });

  it('saute dès qu’une redirection a eu lieu (sinon le retour ramène sur FedaPay)', () => {
    expect(shouldSkipExternalRedirect(1)).toBe(true);
    expect(shouldSkipExternalRedirect(2)).toBe(true);
  });

  it('ignore une valeur non finie (stockage corrompu) au lieu de sauter à l’aveugle', () => {
    expect(shouldSkipExternalRedirect(Number.NaN)).toBe(false);
    expect(shouldSkipExternalRedirect(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

