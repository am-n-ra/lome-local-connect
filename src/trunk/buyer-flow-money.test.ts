import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { budgetFieldToMinor } from './search-constraints';

/**
 * UNI-MONEY-1 / D-LOC-9 — la frontière « champ en francs → mineur ×100 » a UNE
 * définition : `budgetFieldToMinor`. Un champ budget vide signifie « aucun seuil »,
 * jamais « 0 FCFA ».
 *
 * Défaut corrigé : `BuyerFlowV13` re-divisait à la main (`Math.round(Number(budget)*100)`)
 * au lieu du helper partagé. Avec « Budget max » sélectionné et le champ **vide**,
 * `Number('')` vaut `0` → la demande partait avec un plafond de **0 FCFA**, une contrainte
 * absurde que le vendeur devait interpréter. Le helper partagé rend `null` (pas de seuil).
 */
describe('BuyerFlowV13 — la frontière monétaire passe par le helper partagé', () => {
  const src = readFileSync(new URL('./BuyerFlowV13.tsx', import.meta.url), 'utf8');

  it('n’a plus de conversion ×100 écrite à la main', () => {
    expect(src).not.toMatch(/Math\.round\(\s*Number\([^)]*\)\s*\*\s*100/);
  });

  it('utilise `budgetFieldToMinor` pour le budget ET la proposition de prix', () => {
    expect(src).toContain('budgetFieldToMinor(budget)');
    expect(src).toContain('budgetFieldToMinor(proposedPrice)');
  });

  it('un champ vide ne produit PAS un plafond de 0 (le contrat du helper)', () => {
    expect(budgetFieldToMinor('')).toBeNull();
    expect(budgetFieldToMinor('   ')).toBeNull();
    // Contrôle négatif : ce que faisait l'ancien code.
    expect(Math.round(Number('') * 100)).toBe(0);
  });

  it('une saisie valide vaut bien des francs ×100', () => {
    expect(budgetFieldToMinor('2500')).toBe(250000);
  });
});
