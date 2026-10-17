import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * SEARCH-REVEAL-STEAL — un choix explicite de l'acheteur ne doit JAMAIS être annulé
 * par la fin de la cinématique de révélation de recherche.
 *
 * Bug réel (poste lent) : la grille de résultats apparaissait pendant que le vol carte
 * tournait encore ; taper une fiche ouvrait bien la fiche, puis le `finish()` du vol
 * rappelait `onRevealStateChange(false)` et la clause `setSheet('results')` rejouait
 * par-dessus. Vu de l'utilisateur : « je clique, rien ne se passe ». Le garde lit la
 * source (monter `TrunkAppV13` coûterait une carte + l'API pour prouver un drapeau).
 */
const source = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');

describe('SEARCH-REVEAL-STEAL — la révélation ne reprend pas la main sur un choix', () => {
  it('un drapeau d’ouverture manuelle existe et démarre à false', () => {
    expect(source).toMatch(/openedDuringRevealRef\s*=\s*useRef\(false\)/);
  });

  it('ouvrir une fiche marque l’ouverture manuelle', () => {
    const block = source.slice(source.indexOf('const handlePinSelect = useCallback'), source.indexOf('const handleQrDetected'));
    expect(block).toContain('openedDuringRevealRef.current = true');
  });

  it('la fin de révélation ne force les résultats que sans ouverture manuelle', () => {
    const handler = source.slice(source.indexOf('const handleRevealStateChange = useCallback'), source.indexOf('handleRevealStateChange = useCallback') + 400);
    expect(handler).toContain('!openedDuringRevealRef.current');
    expect(handler).toMatch(/openedDuringRevealRef\.current\s*&&/);
  });

  it('le filet 5,5 s respecte lui aussi l’ouverture manuelle', () => {
    const fallback = source.slice(source.indexOf('setRevealPending(false)'), source.indexOf('}, 5500);'));
    expect(fallback).toContain('openedDuringRevealRef.current');
  });

  it('une nouvelle recherche réarme le drapeau', () => {
    // Borné par le VRAI bloc de `runSearch` (jusqu'au hook suivant), pas par une fenêtre
    // de caractères : ajouter une ligne dans runSearch ne doit pas casser ce garde.
    const start = source.indexOf('const runSearch = useCallback');
    const end = source.indexOf('const handleRevealStateChange = useCallback');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const run = source.slice(start, end);
    expect(run).toContain('openedDuringRevealRef.current = false');
  });
});
