import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * BRANCHES (2026-10-07) — gardes de source pour trois règles porteuses, chacune
 * née d'un défaut réel mesuré. Elles vivent dans `trunk-repository.ts` en SQL, donc
 * un test d'exécution exigerait une base ; on vérifie ici l'INVARIANT de source, qui
 * est exactement ce qui régresse en silence.
 *
 * 1. Créer une facilité positionne `seller_ready` (sinon un créateur ne peut jamais vendre).
 * 2. Créer ne recouvre pas un lieu existant (`findShadowedPlace`).
 * 3. Revendiquer assigne un slot (sinon la facilité revendiquée est invisible).
 * 4. Acheter un slot débite le wallet et crée le slot SEULEMENT au débit frais (idempotence).
 */
const source = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');

/** Bornes une méthode par son nom et la méthode suivante (`async <name>(`). */
function methodBlock(name: string): string {
  const start = source.indexOf(`async ${name}(`);
  expect(start, `méthode ${name} introuvable`).toBeGreaterThan(-1);
  const next = source.indexOf('\n    async ', start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

describe('BRANCHES — créer une facilité débloque la publication (S-31)', () => {
  const block = methodBlock('createSellerFacility');

  it('positionne seller_ready (le bug rapporté : créer ne promouvait jamais le compte)', () => {
    expect(block).toContain("set onboarding_state = 'seller_ready'");
  });

  it('ne recouvre pas un lieu existant : la décision pure est appelée', () => {
    expect(block).toContain('findShadowedPlace');
    expect(block).toContain('FacilityShadowError');
  });

  it('sépare « plus de slot » (acheter) de « non autorisé »', () => {
    expect(block).toContain('SlotPolicyError');
  });

  it('aucun commentaire SQL ne contient de backtick (ferme le template literal — bug vécu)', () => {
    // Les commentaires `--` vivent dans un template literal JS : un backtick les casse.
    const sqlComments = block.split('\n').filter((line) => line.trim().startsWith('--'));
    for (const line of sqlComments) expect(line).not.toContain('`');
  });
});

describe('BRANCHES — revendiquer assigne un emplacement', () => {
  const block = methodBlock('reviewFacilityClaim');

  it('assigne un slot libre à la facilité revendiquée (propriété sans visibilité sinon)', () => {
    expect(block).toContain("set status = 'assigned', facility_id = f.id");
  });

  it('provisionne un slot gratuit si le compte n’en a pas, AVANT la revue (snapshot Postgres)', () => {
    const provisionIndex = block.indexOf("insert into v2_facility_slots (account_id, source)");
    const reviewIndex = block.indexOf('const rows = await retryDatabase');
    expect(provisionIndex).toBeGreaterThan(-1);
    expect(reviewIndex).toBeGreaterThan(-1);
    expect(provisionIndex).toBeLessThan(reviewIndex);
  });
});

describe('BRANCHES-SLOT (D-J) — acheter un emplacement', () => {
  const block = methodBlock('purchaseFacilitySlot');

  it('débite le wallet avec le kind slot_spend', () => {
    expect(block).toContain("'slot_spend'");
  });

  it('crée le slot SEULEMENT au débit frais (un rejeu ne crée pas un 2ᵉ slot)', () => {
    // La CTE `slot` doit joindre `spend` (débit frais), jamais `existing_spend`.
    const start = block.indexOf('), slot as (');
    const end = block.indexOf(')\n        select slot.id', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const slotCte = block.slice(start, end).split('\n').filter((line) => !line.trim().startsWith('--')).join('\n');
    expect(slotCte).toContain('join spend sp');
    expect(slotCte).not.toContain('existing_spend');
  });

  it('le prix vient de la source canonique, jamais d’un littéral', () => {
    expect(block).toContain('OMNI_SLOT_PRICE_USD_MINOR');
  });
});
