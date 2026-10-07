import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Décision fondateur 2026-10-07 : « quand je fais une recherche, une sorte de bulle
 * s'affiche à côté de la carte avec le nombre de résultats, ce n'est pas nécessaire ».
 * La bulle (`.countmark`, maquette « 206 ») est retirée. Ce garde échoue si elle
 * réapparaît — dans le rendu OU dans le CSS.

 * ⚠️ Divergence assumée : la maquette Species V2 (autorité, close) affiche encore le
 * countmark (`omni-species-v2-interactive.html:220`). La décision fondateur le
 * supplante pour l'app ; la maquette n'est pas modifiée (Species close).
 */
const map = readFileSync(new URL('./TrunkMap.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./ui-v13.css', import.meta.url), 'utf8');

describe('Countmark retiré (ordre fondateur 2026-10-07)', () => {
  it('le composant carte ne rend plus la bulle de résultats', () => {
    expect(map).not.toMatch(/className="countmark"/);
  });

  it('la prop resultCount est retirée de la carte', () => {
    expect(map).not.toMatch(/resultCount/);
  });

  it('le CSS ne définit plus la classe countmark', () => {
    expect(css).not.toMatch(/\.countmark\{/);
  });
});
