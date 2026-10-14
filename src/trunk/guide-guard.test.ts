import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAP_SPOTLIGHT_STEPS, MAP_SPOTLIGHT_STORAGE_KEY } from './MapSpotlightV13';

/**
 * GUIDE-1b — le guide de première fois (A+B+C) doit rester HONNÊTE et NON BLOQUANT.
 *
 * Invariants verrouillés :
 *  1. Une SEULE source de contenu : le corps du guide est rendu par `HowItWorksBody`
 *     (partagé accueil + menu), jamais dupliqué ; il lit `how-it-works.ts`.
 *  2. Aucun chiffre en dur (règle GUIDE-1a) : le guide ne recopie pas un plafond.
 *  3. Non bloquant (S-31) : chaque surface offre un chemin de sortie (« Passer »,
 *     « Continuer »). Le spotlight n'assombrit pas et ne capture pas le pointeur.
 *  4. Les mots de l'échelle sont ceux de S-06, jamais les anciens.
 *  5. Le spotlight est montré UNE fois (mémoire) et suit des ancres RÉELLES.
 */
const WELCOME = readFileSync(resolve(__dirname, 'WelcomeV13.tsx'), 'utf8');
const APP = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');
const BODY = readFileSync(resolve(__dirname, 'HowItWorksV13.tsx'), 'utf8');
const CSS = readFileSync(resolve(__dirname, 'ui-v13.css'), 'utf8');

describe('GUIDE-1b — guide honnête et non bloquant (A+B+C)', () => {
  it('l’accueil (A) et le menu (C) rendent le MÊME corps — pas de contenu dupliqué', () => {
    expect(WELCOME).toContain('<HowItWorksBody />');
    expect(APP).toContain('<HowItWorksBody />');
    // Le corps lit la source unique, il ne réinvente pas les textes.
    expect(BODY).toContain("from './how-it-works'");
  });

  it('le guide ne recopie AUCUN chiffre de plafond (règle GUIDE-1a)', () => {
    // Un plafond recopié en dur (ex. « 5 offres ») serait un mensonge dormant.
    expect(BODY).not.toMatch(/\b5 offres\b/);
    expect(BODY).not.toMatch(/FREE_OFFER_LIMIT/);
    expect(WELCOME).toContain('FREE_OFFER_LIMIT'); // l'accueil DÉRIVE le plafond, il ne le fige pas
  });

  it('chaque surface offre une sortie : jamais un mur (S-31)', () => {
    // Accueil : « passer » explicite + fermeture.
    expect(WELCOME).toContain('Vous pouvez passer');
    expect(WELCOME).toContain('onClose');
    // Menu : la feuille se ferme.
    expect(APP).toContain("aria-label=\"Comment ça marche\"");
    // Spotlight : « Passer » toujours présent + Échap.
    const SPOT = readFileSync(resolve(__dirname, 'MapSpotlightV13.tsx'), 'utf8');
    expect(SPOT).toContain('Passer');
    expect(SPOT).toMatch(/Escape/);
  });

  it('le spotlight n’assombrit pas et ne capture pas le pointeur (il ne bloque pas)', () => {
    // On isole LA règle `.spotlight{…}` elle-même (pas le bloc entier : l'anneau porte
    // aussi `pointer-events:none`, ce qui masquerait une capture sur le conteneur).
    const rule = CSS.match(/\.spotlight\{[^}]*\}/)?.[0] ?? '';
    expect(rule, 'règle .spotlight introuvable').not.toBe('');
    expect(rule).toContain('pointer-events:none');
    expect(rule).not.toMatch(/background:/);
  });

  it('le spotlight suit des ancres RÉELLES et n’est montré qu’une fois', () => {
    expect(MAP_SPOTLIGHT_STEPS.length).toBeGreaterThan(0);
    for (const step of MAP_SPOTLIGHT_STEPS) {
      // Chaque ancre existe vraiment dans l'app (sinon la bulle flotterait dans le vide).
      expect(APP).toContain(`data-spot="${step.spot}"`);
    }
    expect(MAP_SPOTLIGHT_STORAGE_KEY).toBe('omni-map-guide-seen');
    // Le déclencheur lit la mémoire avant de montrer.
    expect(APP).toContain('MAP_SPOTLIGHT_STORAGE_KEY');
    expect(APP).toMatch(/spotlightCheckedRef/);
  });

  it('l’échelle du guide porte les mots VERROUILLÉS (S-06), jamais les anciens', () => {
    const HOW = readFileSync(resolve(__dirname, 'how-it-works.ts'), 'utf8');
    expect(HOW).toContain('EXISTENCE_LEVELS');
    // Les anciens mots ne doivent apparaître nulle part dans le contenu du guide.
    expect(HOW).not.toContain('Disponibilité confirmée');
  });
});
