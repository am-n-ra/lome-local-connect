import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildWordBoundaryPattern } from './trunk-repository';

/**
 * NR-10 — l'ALERTE acheteur (« être alerté ») a un producteur, et il ne peut pas mentir.
 *
 * Le risque réel : la sheet « Recherches enregistrées » promet d'être alerté, mais si le
 * producteur disparaît (ou n'utilise pas le MÊME matcher que la recherche), l'utilisateur
 * reçoit une alerte pour une offre que la recherche ne retrouve pas — pire qu'aucune alerte.
 */
const repo = readFileSync(new URL('./trunk-repository.ts', import.meta.url), 'utf8');

describe('NR-10 — l’alerte « recherche sauvegardée » est produite', () => {
  it('la publication écrit un événement saved_search_match', () => {
    // On épingle le TUPLE d'insertion, pas le mot : `'saved_search_match'` apparaît aussi
    // dans la clé de dédup, donc un simple `toContain` passerait même producteur retiré.
    expect(repo).toContain("select at.account_id, 'saved_search_match', 'saved_search', at.query,");
  });

  it('le producteur est DANS la transition de publication (jamais un second chemin)', () => {
    // Le bloc d'alerte vit dans la même instruction que `changed` : la publication et
    // l'alerte ne peuvent pas diverger (l'une ne peut pas réussir sans l'autre).
    const transition = repo.slice(repo.indexOf('async transitionSellerProduct'));
    const end = transition.indexOf('async canManageSellerProduct');
    const block = transition.slice(0, end > 0 ? end : transition.length);
    expect(block).toContain('alerted as (');
    expect(block).toContain('changed_offer as (');
  });

  it('le matcher est EXACTEMENT celui de la recherche (mot entier, accents pliés)', () => {
    // Deux copies divergeraient : on exige la même source.
    expect(repo).toContain('buildWordBoundaryPattern(String(r.query))');
    expect(repo).toContain('jsonb_to_recordset');
    expect(repo).toContain('folded_name ~ at.pattern');
  });

  it('le motif exige le MOT ENTIER (une sous-chaîne ne déclenche pas)', () => {
    // Contrôle sur la fonction réelle : « pain » ne doit pas matcher « painter ».
    const pattern = buildWordBoundaryPattern('pain');
    expect(pattern).toBeTruthy();
    const re = new RegExp(pattern as string);
    expect(re.test('pain de mie')).toBe(true);
    expect(re.test('painter')).toBe(false);
  });

  it('une requête sans jeton exploitable ne produit pas de motif', () => {
    // Contrat réel du matcher partagé : seuls les jetons alphanumériques comptent. Une
    // requête de pure ponctuation n'a rien à quoi correspondre → aucune alerte.
    expect(buildWordBoundaryPattern('')).toBeNull();
    expect(buildWordBoundaryPattern('!!!')).toBeNull();
    expect(buildWordBoundaryPattern('   ')).toBeNull();
  });
});
