import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * MV1 X04 — le marqueur `no_match` est de l'intel marché, pas un filtre.
 * Contrat à deux moitiés :
 *   1. le serveur n'agrège QUE les sauvegardes marquées (couvert par les
 *      tests du dépôt : prédicat `constraints->>'no_match'`) ;
 *   2. le client ne doit JAMAIS relire le marqueur pour chercher : la relance
 *      d'une sauvegarde rejoue le texte seul, et seule l'écriture pose le
 *      marqueur (sur vide constaté).
 *
 * Le point 2 est purement une décision d'interface, donc rien ne l'empêcherait
 * de régresser en silence : ce garde lit la source et échoue si la relance
 * lit `search.constraints`, ou si un autre site que la sauvegarde pose
 * `no_match`.
 *
 * Pourquoi un garde de source plutôt qu'un rendu : `TrunkAppV13` monte une
 * carte et l'API ; le monter pour vérifier un argument coûterait plus qu'il
 * ne prouve. On vérifie donc la seule chose qui compte — le geste de relance.
 */
const source = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');

describe('MV1 X04 — le marqueur no_match ne filtre jamais une recherche', () => {
  it('la relance rejoue le texte seul, jamais les contraintes sauvegardées', () => {
    expect(source).toContain('runSearch(search.query)');
    expect(source).not.toContain('runSearch(search.constraints');
    expect(source).not.toContain('search.constraints');
  });

  it('seule la sauvegarde pose no_match, et seulement sur vide constaté', () => {
    const occurrences = source.split('no_match').length - 1;
    expect(occurrences).toBe(1);
    expect(source).toContain("constraints.no_match = 'true'");
    // Un seul site marque : le bouton du vide. Le bouton générique
    // « Enregistrer la recherche courante » ne marque jamais.
    const marked = source.split('saveCurrentSearch(true)').length - 1;
    expect(marked).toBe(1);
    expect(source).toContain('saveCurrentSearch()');
  });
});
