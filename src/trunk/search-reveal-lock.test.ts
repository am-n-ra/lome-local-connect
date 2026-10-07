import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Régression réelle (2026-10-07) : le mode caméra `search_reveal` était comparé
// partout (zoomstart/dragstart/zoomend/followTarget) mais JAMAIS assigné. Le vol
// de révélation déclenchait donc ses propres `zoomstart`, qui passaient le garde
// `cameraMode.current !== 'search_reveal'`, appelaient `pauseMotion` →
// `cancelActiveReveal` et tuaient le vol au globe — les pins ne s'affichaient
// jamais après une recherche. Ce garde verrouille l'identité du vol.

const SOURCE = readFileSync(resolve(__dirname, 'TrunkMap.tsx'), 'utf8');

describe('search_reveal est une identité posée, jamais seulement comparée', () => {
  it('le vol de révélation assigne cameraMode = search_reveal', () => {
    expect(SOURCE).toContain("cameraMode.current = 'search_reveal'");
  });

  it('l\'assignation vit dans l\'effet de révélation (revealRunningRef.current = true)', () => {
    const revealMarker = 'revealRunningRef.current = true;';
    const assign = "cameraMode.current = 'search_reveal'";
    const at = SOURCE.indexOf(revealMarker);
    expect(at).toBeGreaterThan(-1);
    // l'assignation doit suivre le marqueur de démarrage du vol
    expect(SOURCE.indexOf(assign, at)).toBeGreaterThan(at);
  });

  it('les gardes de geste restent conditionnés à search_reveal (le pourquoi du fix)', () => {
    expect(SOURCE).toMatch(/cameraMode\.current !== 'search_reveal'/);
  });
});
