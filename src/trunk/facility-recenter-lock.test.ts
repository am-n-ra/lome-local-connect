import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Régression réelle (2026-10-07) : en cliquant une facilité (résultat, pin, ou
// défilement de la grille), la carte devait se RECENTRER sur le pin et le rendre
// VISIBLE au-dessus du sheet. Mesuré sur prod (390px) : le pin restait au milieu
// d'écran (y≈422) alors que le sheet commençait à y≈304 → caché derrière le sheet.
//
// Cause : l'ancien décalage `unproject(y - (pad+64)/2)` déplaçait le pin VERS LE BAS
// (donc derrière le sheet) et dépendait du padding, qui n'était jamais resynchronisé
// au changement de sheet (le MutationObserver n'observait que `childList`, or changer
// de sheet ne fait que basculer l'attribut `data-sheet`). MapLibre centre la caméra
// sur la vue PADDÉE (`centerPoint.y = (height - bottom)/2`) : le bon geste est de
// poser le padding bas depuis la hauteur RÉELLE du sheet, puis de centrer sur le pin.
//
// Garde de source : l'effet de sélection doit (a) mesurer la hauteur du sheet depuis
// le DOM, (b) poser le padding via `bottomPaddingFor`, (c) centrer sur le pin — et NE
// PAS réintroduire le décalage fautif.

const MAP = readFileSync(resolve(__dirname, 'TrunkMap.tsx'), 'utf8');

describe('le pin sélectionné reste visible au-dessus du sheet', () => {
  const start = MAP.indexOf('cameraMode.current = \'selected_facility\'');
  const end = MAP.indexOf('// R-03 map-contextual focus', start);
  const effect = MAP.slice(start, end > start ? end : start + 2600);

  it('mesure la hauteur du sheet depuis le DOM (pas depuis le padding)', () => {
    expect(effect).toMatch(/getBoundingClientRect\(\)\.top/);
    expect(effect).toContain('.sheet[data-sheet]');
  });

  it('pose le padding bas depuis `bottomPaddingFor` puis centre sur le pin', () => {
    expect(effect).toContain('bottomPaddingFor(');
    expect(effect).toMatch(/setPadding\(\{ top: 0, right: 0, bottom/);
    expect(effect).toMatch(/center: \[selected\.longitude, selected\.latitude\]/);
  });

  it('ne réintroduit pas le décalage fautif vers le bas', () => {
    expect(effect).not.toMatch(/unproject\(\s*\[?\s*pt\.x,\s*pt\.y\s*-/);
    expect(effect).not.toMatch(/bottomPad\s*\+\s*64/);
  });

  it('rejoue le cadrage après un vol en cours (moveend)', () => {
    expect(effect).toMatch(/isMoving\(\)/);
    expect(effect).toContain("map.on('moveend'");
  });
});
