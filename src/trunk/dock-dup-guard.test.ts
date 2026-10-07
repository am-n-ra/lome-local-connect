import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * DOCK-DUP — régression réelle (2026-10-07, spot-check occlusion X5).
 *
 * Mesuré en navigateur : le dock `.navpill` était rendu en JUMEAUX empilés (même
 * rect, mêmes handlers, labels a11y dupliqués) — 1 au boot, puis 2 après ouverture
 * d'une sheet, puis 3 après un changement de rôle : il s'ACCUMULAIT à chaque
 * interaction. Cause : la div du dock portait `key={role}`. Comme le dock est un
 * enfant UNIQUE de la scène (non keyé), changer sa clé à chaque bascule de rôle
 * faisait que React démontait/remontait le nœud sans réconcilier proprement le
 * précédent → fuite du nœud DOM.
 *
 * Preuve A/B (probe `scripts/probe-dock-dup.mjs`, viewport 1280) :
 *   - `key={role}` (changement) → after-menu=2, seller=2, back=3 (labels ×N) ;
 *   - `key="dock"` (constante) → 1 partout ;
 *   - aucune clé → 1 partout.
 * Un dock STABLE réconcilie ses boutons (`key={item.icon}`) ; la clé sur le
 * conteneur était à la fois inutile et nuisible.
 *
 * Ce garde verrouille la source : le conteneur `.navpill` est déclaré UNE fois et
 * NE PORTE PAS de clé dynamique.
 */
const APP = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');

describe('DOCK-DUP — le dock est un nœud unique, sans clé dynamique', () => {
  it('une seule déclaration de `.navpill` dans la scène', () => {
    const count = (APP.match(/className="navpill"/g) || []).length;
    expect(count, 'le dock doit être déclaré exactement une fois').toBe(1);
  });

  it('le conteneur `.navpill` ne porte aucune clé (ni `role`, ni constante)', () => {
    const decl = APP.match(/<div className="navpill"[^>]*>/);
    expect(decl, 'la div .navpill doit exister').not.toBeNull();
    expect(decl![0]).not.toMatch(/\bkey=/);
  });

  it('la régression est nommée dans le code (pourquoi pas de clé)', () => {
    expect(APP).toContain('DOCK-DUP');
  });
});
