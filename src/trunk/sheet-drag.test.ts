import { describe, expect, it } from 'vitest';
import { SHEET_DISMISS_THRESHOLD, SHEET_DISMISS_VELOCITY, isSheetDrag, sheetDragOffset, shouldDismissSheet } from './sheet-drag';
import { sheetDismissTarget } from './ui-helpers';

describe('BRANCH-1 — la décision « relâcher ferme-t-il la feuille ? » est pure', () => {
  it('un geste lent et court NE ferme PAS (on repose la feuille)', () => {
    expect(shouldDismissSheet(40, 1000)).toBe(false);
    expect(shouldDismissSheet(10, 500)).toBe(false);
  });

  it('un geste assez long ferme, même lent', () => {
    expect(shouldDismissSheet(SHEET_DISMISS_THRESHOLD, 5000)).toBe(true);
    expect(shouldDismissSheet(200, 5000)).toBe(true);
  });

  it('un geste vif ferme même sous le seuil de distance', () => {
    // 60px en 50ms = 1,2 px/ms > 0,6 → ferme.
    expect(shouldDismissSheet(60, 50)).toBe(true);
    expect(60 / 50).toBeGreaterThan(SHEET_DISMISS_VELOCITY);
  });

  it('un geste vers le HAUT ne ferme jamais (on ne pousse pas une feuille vers le haut)', () => {
    expect(shouldDismissSheet(-400, 50)).toBe(false);
    expect(shouldDismissSheet(0, 10)).toBe(false);
  });

  it('un temps nul est traité comme instantané (vélocité infinie)', () => {
    expect(shouldDismissSheet(20, 0)).toBe(true);
  });

  it('la feuille suit le doigt vers le bas, jamais vers le haut', () => {
    expect(sheetDragOffset(120)).toBe(120);
    expect(sheetDragOffset(-120)).toBe(0);
    expect(sheetDragOffset(0)).toBe(0);
  });

  it('un appui n\'est un geste qu\'au-delà du seuil de démarrage', () => {
    expect(isSheetDrag(2)).toBe(false);
    expect(isSheetDrag(12)).toBe(true);
    expect(isSheetDrag(-12)).toBe(true);
  });
});

describe('BRANCH-1 — la sortie d\'un geste est la MÊME que le bouton de fermeture', () => {
  it('les surfaces plein-écran reviennent à la carte', () => {
    expect(sheetDismissTarget('search')).toBe('none');
    expect(sheetDismissTarget('results')).toBe('none');
    expect(sheetDismissTarget('facility')).toBe('none');
    expect(sheetDismissTarget('entity')).toBe('none');
  });

  it('les sous-écrans de parcours reviennent à l\'étape précédente', () => {
    expect(sheetDismissTarget('bulk')).toBe('facility');
    expect(sheetDismissTarget('compare')).toBe('facility');
    expect(sheetDismissTarget('claim')).toBe('facility');
    expect(sheetDismissTarget('seller-reply')).toBe('seller');
    expect(sheetDismissTarget('products')).toBe('seller');
    expect(sheetDismissTarget('company')).toBe('seller');
    expect(sheetDismissTarget('receipt')).toBe('home');
  });

  it('les destinations reviennent au menu', () => {
    expect(sheetDismissTarget('menu')).toBe('menu');
    expect(sheetDismissTarget('account')).toBe('menu');
    expect(sheetDismissTarget('wallet')).toBe('menu');
    expect(sheetDismissTarget('auth')).toBe('menu');
    expect(sheetDismissTarget('legal')).toBe('menu');
  });

  it('aucune feuille active ne produit aucune cible (le stage ne fait rien)', () => {
    expect(sheetDismissTarget('none')).toBeNull();
    expect(sheetDismissTarget('')).toBeNull();
  });
});
