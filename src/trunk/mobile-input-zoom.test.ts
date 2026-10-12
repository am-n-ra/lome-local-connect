import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * BUG B — zoom clavier mobile (signal fondateur 2026-10-07).
 *
 * Sur un appareil tactile, un champ de saisie dont le `font-size` est inférieur à 16px
 * déclenche le zoom automatique du navigateur (iOS Safari, Chrome Android « zoom au
 * focus ») : l'écran se déforme à chaque focus. Beaucoup de champs de l'app sont stylés
 * à 9-12px (dense, mobile-first) — donc TOUS doivent être portés à 16px dès que le
 * pointeur est grossier (tactile), sans toucher au rendu desktop.
 *
 * Ce garde échoue si :
 *  1. le bloc `@media(pointer:coarse)` a disparu de `ui-v13.css` ;
 *  2. ce bloc ne couvre pas chaque famille de champ (`input`, `textarea`, `select`) ;
 *  3. la classe `.input` (utilisée par `SellerV13`) n'a plus de règle CSS.
 */
const CSS = readFileSync(resolve(process.cwd(), 'src/trunk/ui-v13.css'), 'utf8');

function coarseBlock(): string {
  const m = CSS.match(/@media\s*\(\s*pointer\s*:\s*coarse\s*\)\s*\{([\s\S]*?)\}\s*\n/);
  return m ? m[1] : '';
}

describe('BUG B — pas de zoom clavier sur mobile (champs ≥ 16px sur tactile)', () => {
  it('un garde `@media(pointer:coarse)` existe dans ui-v13.css', () => {
    expect(coarseBlock()).not.toBe('');
  });

  it('le garde porte CHAQUE famille de champ à 16px (input, textarea, select)', () => {
    const block = coarseBlock();
    for (const family of ['input', 'textarea', 'select']) {
      expect(block).toContain(family);
    }
    expect(block).toMatch(/font-size\s*:\s*16px/);
  });

  it('la classe `.input` (SellerV13) a une règle CSS (sinon les champs vendeur n\'ont AUCUN style)', () => {
    expect(CSS).toMatch(/\.input\{/);
  });
});
