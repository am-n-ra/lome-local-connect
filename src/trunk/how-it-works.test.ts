import { describe, expect, it } from 'vitest';
import { GUIDE_MOMENTS, guideLevels, GUIDE_UNCLAIMED_SILENCE } from './how-it-works';
import { EXISTENCE_LEVELS } from './offer-existence';

/**
 * GUIDE-1b — le contenu du guide est une SOURCE UNIQUE, alignée sur les mots verrouillés.
 * Ces tests échouent si quelqu'un réintroduit les anciens mots (« Disponibilité confirmée /
 * Disponible ») ou recopie l'échelle au lieu de la lire depuis `EXISTENCE_LEVELS`.
 */
describe('how-it-works — contenu unique du guide (GUIDE-1b)', () => {
  it('les trois temps sont ceux du Seed, dans l’ordre', () => {
    expect(GUIDE_MOMENTS.map((m) => m.title)).toEqual(['Découvrir', 'Interroger', 'Vérifier & transiger']);
    expect(GUIDE_MOMENTS.map((m) => m.order)).toEqual([1, 2, 3]);
  });

  it('l’échelle est LUE depuis la source unique, pas recopiée', () => {
    const levels = guideLevels();
    expect(levels).toHaveLength(EXISTENCE_LEVELS.length);
    expect(levels.map((l) => l.label)).toEqual(EXISTENCE_LEVELS.map((e) => e.label));
    expect(levels.map((l) => l.level)).toEqual([0, 1, 2, 3, 4]);
  });

  it('le niveau 3/4 porte les mots VERROUILLÉS par S-06 (jamais les anciens)', () => {
    const labels = guideLevels().map((l) => l.label);
    expect(labels[3]).toBe('Disponibilité vivante');
    expect(labels[4]).toBe('Transactable');
    expect(labels).not.toContain('Disponibilité confirmée');
    expect(labels).not.toContain('Disponible');
  });

  it('un lieu non revendiqué nomme ses trois silences (honnêteté S-05)', () => {
    expect([...GUIDE_UNCLAIMED_SILENCE]).toEqual(['sa disponibilité', 'son prix', 'ses horaires']);
  });
});
