import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AUTO_RESPONSE_ABSTENTION, decideAutoResponse } from './auto-response';

/**
 * NR-11 — chaque capacité Pro est EXPLIQUÉE, dont **quand l'automate s'abstient**.
 *
 * Le risque réel : `decideAutoResponse` refuse pour 5 raisons ; si l'UI n'en enseigne que 3,
 * le vendeur voit un silence et devine. Ce garde lie les deux bouts : le **nombre de motifs
 * refusés** par la décision ET le **nombre de phrases** montrées au vendeur.
 */
const plans = readFileSync(new URL('./PlansCompareV13.tsx', import.meta.url), 'utf8');

const BASE_FACTS = {
  autoEnabled: true,
  proAlive: true,
  availabilityState: 'en_stock',
  availabilityExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  availableStock: 10,
  requestedQuantity: 1,
  listedPriceMinor: 1000,
  proposedPriceMinor: null,
  now: Date.now(),
};

describe('NR-11 — les capacités Pro sont expliquées', () => {
  it('chaque motif d’abstention porte une phrase', () => {
    expect(Object.keys(AUTO_RESPONSE_ABSTENTION).sort()).toEqual(
      ['insufficient-stock', 'negotiation-open', 'not-enabled', 'not-fresh', 'not-pro'],
    );
    for (const sentence of Object.values(AUTO_RESPONSE_ABSTENTION)) {
      expect(sentence.length).toBeGreaterThan(20);
    }
  });

  it('la carte Pro ne peut pas taire un motif : tous sont rendus', () => {
    // Le rendu itère la table entière — pas une liste recopiée à la main.
    expect(plans).toContain('AUTO_RESPONSE_ABSTENTION');
    expect(plans).toMatch(/Object\.keys\(AUTO_RESPONSE_ABSTENTION\)/);
    expect(plans).toContain('data-testid="pro-abstention"');
  });

  it('chaque ligne du plan porte sa phrase (aucune ligne nue)', () => {
    const rowBlocks = plans.match(/label: '[^']+', free: '[^']*', pro: '[^']*'/g) ?? [];
    const explained = plans.match(/explain: '/g) ?? [];
    expect(rowBlocks.length).toBeGreaterThan(0);
    // Une ligne sans `explain` romprait l'égalité : chaque ligne explique.
    expect(explained.length).toBe(rowBlocks.length);
  });

  it('la phrase d’abstention correspond au refus RÉEL de la décision', () => {
    // Contrôle croisé : on force chaque refus et on vérifie que sa phrase existe.
    const refusals = [
      decideAutoResponse({ ...BASE_FACTS, autoEnabled: false }),
      decideAutoResponse({ ...BASE_FACTS, proAlive: false }),
      decideAutoResponse({ ...BASE_FACTS, availabilityExpiresAt: new Date(Date.now() - 86_400_000).toISOString() }),
      decideAutoResponse({ ...BASE_FACTS, availableStock: 0, requestedQuantity: 5 }),
      decideAutoResponse({ ...BASE_FACTS, proposedPriceMinor: 800 }),
    ];
    for (const decision of refusals) {
      expect(decision.kind).toBe('defer');
      if (decision.kind === 'defer') {
        expect(AUTO_RESPONSE_ABSTENTION[decision.reason]).toBeTruthy();
      }
    }
  });
});
