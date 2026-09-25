import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * RT-D2 — le contrat « itinéraire après intention » a deux moitiés :
 *   1. le serveur exige une intention vivante (`hasLivePurchaseIntent`) ;
 *   2. la fiche facilité ne doit pas offrir l'itinéraire AVANT l'intention.
 *
 * Le point 1 est couvert par les tests du dépôt. Le point 2 est purement une
 * décision d'interface, donc rien ne l'empêcherait de régresser en silence : ce
 * garde lit la source et échoue si la fiche facilité ré-ouvre l'itinéraire.
 *
 * Pourquoi un garde de source plutôt qu'un rendu : `TrunkAppV13` monte une carte
 * et l'API ; le monter pour vérifier un attribut coûterait plus qu'il ne prouve.
 * On vérifie donc la seule chose qui compte — l'absence du geste d'ouverture.
 */
const source = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');

/** Le bloc « Localisation » de la fiche facilité, borné par le bouton de panier. */
function facilityLocationBlock(): string {
  const start = source.indexOf('Localisation');
  const end = source.indexOf('claimState === \'error\'', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('RT-D2 — l’itinéraire de la fiche facilité est verrouillé avant intention', () => {
  it('n’ouvre pas l’itinéraire depuis la fiche : le bouton est désactivé', () => {
    const block = facilityLocationBlock();
    const button = block.slice(block.indexOf('Itinéraire vers ce vendeur') - 400);
    expect(button).toContain('disabled');
    expect(button).toContain('aria-disabled');
  });

  it('la fiche facilité ne pose plus de cible d’itinéraire (aucun setRouteTarget)', () => {
    expect(facilityLocationBlock()).not.toContain('setRouteTarget');
  });

  it('dit à l’acheteur pourquoi, et l’envoie vers la sélection réelle', () => {
    const block = facilityLocationBlock();
    expect(block).toContain('Requis : votre intention d’achat');
    expect(block).toContain('Demander la disponibilité');
  });

  it('ne choisit JAMAIS un produit à la place de l’acheteur', () => {
    // Défaut réel corrigé le 2026-09-24 : le bouton prenait
    // `rankedFacilityProducts[0]` et ouvrait le flux d'achat sans sélection.
    // Le bloc ne doit donc appeler aucune entrée de flux.
    const block = facilityLocationBlock();
    expect(block).not.toContain('startFlow');
    expect(block).not.toContain('rankedFacilityProducts[0]');
  });
});

describe('RT-D2 — la maquette de référence ne montre plus d’itinéraire avant intention', () => {
  const maquette = readFileSync(
    new URL('../../docs/maquette/omni-species-v2-interactive.html', import.meta.url),
    'utf8',
  );

  it('a abandonné le « tracé direct » (le vol d’oiseau)', () => {
    expect(maquette).not.toContain('tracé direct');
  });

  it('ne laisse aucun bouton d’itinéraire actif hors transaction', () => {
    const lines = maquette.split('\n').filter((l) => l.includes('Itinéraire'));
    const active = lines.filter((l) => l.includes('onclick') && !l.includes('disabled'));
    // Seul l'écran de transaction (après intention) peut ouvrir un itinéraire.
    for (const line of active) {
      expect(line).toContain('point de retrait');
    }
  });
});
