import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { trustLabelFor } from './OperatorEntitySideV13';

/**
 * DOCK-02 (reste) / maquette `op-side` — l'aperçu entité est LECTURE SEULE.
 *   1. `getOperatorEntitySide` lit un badge (trust/sales) mais n'écrit JAMAIS :
 *      pas de `set trust_state`, pas de décision (D-OPS-3). L'opérateur regarde.
 *   2. La surface montre ce que voit l'entité (badge · offres publiées · demandes
 *      en attente) + dit explicitement qu'il ne modifie rien à sa place.
 *   3. Le libellé de badge est honnête (9 états internes → 3 publics).
 */
const repo = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');
const http = readFileSync(new URL('../server/http.ts', import.meta.url), 'utf8');
const component = readFileSync(new URL('./OperatorEntitySideV13.tsx', import.meta.url), 'utf8');

function methodBlock(source: string, signature: string): string {
  const start = source.indexOf(signature);
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf('async ', start + signature.length);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('op-side — l’aperçu entité lit, ne décide jamais', () => {
  it('D-OPS-3 : getOperatorEntitySide n’écrit aucun badge ni porte de décision', () => {
    const block = methodBlock(repo, 'async getOperatorEntitySide(');
    expect(block).not.toContain('set trust_state');
    expect(block).not.toContain('set commercial_plan');
    expect(block).not.toContain('reviewFacilityClaim');
    expect(block).not.toContain('transitionSellerProduct');
    // Et il lit bien la confiance (l'aperçu ne serait pas honnête sans elle).
    expect(block).toContain('trust_state');
  });

  it('la route op-side est gardée (auth + scope visite)', () => {
    expect(http).toContain("=== 'op-side'");
    expect(http).toContain('getOperatorEntitySide');
  });

  it('la surface montre les 3 faits + dit qu’elle ne modifie rien', () => {
    expect(component).toContain('Ce que voit');
    expect(component).toContain('Offres publiées');
    expect(component).toContain('Sa file de demandes');
    expect(component).toContain('sans jamais modifier à sa place');
  });
});

describe('op-side — libellé de badge honnête (9 internes → 3 publics)', () => {
  it('confirme/certifié → Vérifiée ; non confirmé → Non vérifiée ; le reste → Non revendiquée', () => {
    expect(trustLabelFor('confirmed')).toBe('Vérifiée');
    expect(trustLabelFor('certified')).toBe('Vérifiée');
    expect(trustLabelFor('unconfirmed')).toBe('Non vérifiée');
    expect(trustLabelFor('unclaimed')).toBe('Non revendiquée');
    expect(trustLabelFor('verification_draft')).toBe('Non revendiquée');
    expect(trustLabelFor('admin_review')).toBe('Non revendiquée');
  });
});
