// BRANCHES (2026-10-07) — les surfaces sont CONTEXTUELLES au rôle actif.
//
// Le fondateur : « pourquoi les interfaces seller sont les mêmes que buyer… mon espace
// seller me montre la même chose que buyer alors que c'est censé être contextuel au rôle
// actif ? Comment les éléments de sheet seller vont permettre de commander, ce n'est pas
// normal. »
//
// Deux défauts réels :
//  1. « Mon espace » du vendeur ouvrait la MÊME feuille que l'acheteur (`home`, titrée
//     « Espace acheteur — Vos demandes & transactions »). La maquette (`home()` ligne 333)
//     dit : seller → `seller-dash`, jamais `home`.
//  2. La fiche facilité affichait des gestes d'ACHETEUR (demande de dispo, itinéraire,
//     signaler) quel que soit le rôle, y compris au vendeur sur SON propre lieu. La maquette
//     (ligne 1305) : « clic sur un pin admin → fiche de revue, jamais une fiche acheteur ».
//
// Le test est falsifiable : rétablir l'ancien comportement le fait échouer.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const APP = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');

describe('surfaces contextuelles au rôle', () => {
  it('« Mon espace » vendeur ouvre l’espace VENDEUR, pas la feuille acheteur', () => {
    // la ligne de menu vendeur « Mon espace »
    const line = APP.split('\n').find((l) => l.includes('>Mon espace</b>'));
    expect(line).toBeTruthy();
    expect(line).toContain("setSheet('seller')");
    expect(line).not.toContain('openHome');
  });

  it('openHome refuse d’ouvrir l’espace acheteur pour un vendeur', () => {
    const start = APP.indexOf('const openHome = useCallback');
    const guard = APP.slice(start, start + 400);
    expect(guard).toMatch(/if \(role === 'seller'\)/);
    expect(guard).toContain("setSheet('seller')");
  });

  it('la fiche facilité ne montre les gestes d’ACHETEUR que dans le contexte acheteur', () => {
    // le drapeau est dérivé du rôle ET de la propriété du lieu
    expect(APP).toMatch(/const isOwnFacility = .*ownedFacilityIds\.includes\(selectedFacility\.id\)/);
    expect(APP).toMatch(/const buyerControlsVisible = role === 'buyer' && !isOwnFacility/);
    // la demande de disponibilité (geste d'achat) est gardée par le drapeau
    const selbar = APP.indexOf('className="selbar"');
    const beforeSelbar = APP.slice(selbar - 240, selbar);
    expect(beforeSelbar).toContain('buyerControlsVisible &&');
  });

  it('le vendeur sur son propre lieu reçoit un geste de GESTION, pas d’achat', () => {
    expect(APP).toContain('Gérer ce lieu dans mon espace');
    expect(APP).toMatch(/isOwnFacility && \(\s*<div className="cardbox"/);
  });

  it('« Produits & stock » ouvre le CATALOGUE, pas le dashboard', () => {
    const line = APP.split('\n').find((l) => l.includes('>Produits & stock</b>'));
    expect(line).toBeTruthy();
    expect(line).toContain("setSheet('products')");
  });

  it('admin et opérateur sont deux capacités DISTINCTES (pas adminTools pour les deux)', () => {
    const start = APP.indexOf('const eligibleRoles');
    const block = APP.slice(start, APP.indexOf('], [sessionUser', start));
    expect(block).toMatch(/if \(adminTools\) base\.push\('admin'\)/);
    expect(block).toMatch(/if \(operatorTools\) base\.push\('operator'\)/);
    // l'ancien bug : operator dérivé de adminTools
    expect(block).not.toMatch(/if \(adminTools\) base\.push\('operator'\)/);
  });

  it('le menu ADMIN contient « Console », le menu OPÉRATEUR ne l’a pas', () => {
    const adminBlockStart = APP.indexOf("role === 'admin' && (", APP.indexOf('data-sheet="menu"'));
    const operatorBlockStart = APP.indexOf("role === 'operator' && (", APP.indexOf('data-sheet="menu"'));
    expect(adminBlockStart).toBeGreaterThan(0);
    expect(operatorBlockStart).toBeGreaterThan(adminBlockStart);
    const adminBlock = APP.slice(adminBlockStart, operatorBlockStart);
    const operatorBlock = APP.slice(operatorBlockStart, APP.indexOf('MENU-02', operatorBlockStart));
    expect(adminBlock).toContain('>Console</b>');
    expect(operatorBlock).not.toContain("setSheet('admin')");
    expect(operatorBlock).not.toContain('>Console</b>');
    expect(operatorBlock).toContain('>Ma tournée</b>');
  });
});
