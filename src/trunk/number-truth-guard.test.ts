import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * BRANCHES-GUIDE-1a (fondateur 2026-10-14) — « on a pas 306 offres, ce n'est pas bien
 * de mentir sur les chiffres ». Un chiffre affiché à l'utilisateur doit être VRAI et
 * DÉRIVÉ à la lecture, jamais recopié : il peut changer demain.
 *
 * Deux défauts réels mesurés le 2026-10-14 :
 *  1. l'accueil lisait `listPublicFacilities().length`, plafonnée PAR FENÊTRE
 *     (D-MAP-1, 2 000) → un PLAFOND présenté comme un TOTAL (13 743 en base) ;
 *  2. « Gratuit · 5 offres max » contredisait `FREE_OFFER_LIMIT = 20` (même app,
 *     deux nombres pour une seule règle).
 *
 * Ce garde échoue si l'un des deux revient. Il lit le SOURCE, car le défaut est une
 * chaîne littérale, pas un comportement.
 */
const welcome = readFileSync(new URL('./WelcomeV13.tsx', import.meta.url), 'utf8');
const trunk = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');

describe('GUIDE-1a — pas de chiffre recopié dans l’UI', () => {
  it('l’accueil lit le TOTAL public, jamais la longueur plafonnée de la carte', () => {
    expect(welcome).toMatch(/getPublicStats\(/);
    expect(welcome).not.toMatch(/listPublicFacilities\(/);
  });

  it('le plafond gratuit est lu depuis la constante, jamais écrit « 5 offres »', () => {
    expect(trunk).not.toMatch(/5 offres max/);
    expect(trunk).toMatch(/FREE_OFFER_LIMIT/);
  });

  it('le quota du comparateur est lu depuis la constante, jamais « 1 comparaison » / « jusqu’à 5 »', () => {
    expect(trunk).not.toMatch(/1 comparaison\b/);
    expect(trunk).not.toMatch(/jusqu’à 5\b/);
    expect(welcome).not.toMatch(/1 comparaison\b/);
    expect(welcome).not.toMatch(/5 comparaisons\b/);
  });

  it('le plafond gratuit n’est écrit qu’une fois (source unique)', () => {
    // Un seul `export const FREE_OFFER_LIMIT` dans le domaine ; aucune copie ailleurs.
    const domain = readFileSync(new URL('../domain/invariants.ts', import.meta.url), 'utf8');
    expect(domain).toMatch(/export const FREE_OFFER_LIMIT = \d+/);
    const occurrences = (trunk.match(/FREE_OFFER_LIMIT = \d+/g) ?? []).length;
    expect(occurrences).toBe(0);
  });
});
