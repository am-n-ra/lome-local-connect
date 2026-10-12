import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * BRANCHES — garde de préparation juridique.
 *
 * La question du fondateur (« je ne veux pas être poursuivi ») a une réponse mesurable :
 * consentement explicite à la création, politique de confidentialité, conditions, mentions,
 * et accès aux droits. Ce garde empêche qu'une refonte future retire silencieusement l'un
 * de ces éléments — exactement la classe de régression qui avait déjà perdu l'onboarding.
 */
const root = process.cwd();
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

describe('BRANCHES — le socle juridique ne peut pas disparaître en silence', () => {
  it('le consentement au traitement est REQUIS à la création de compte', () => {
    const auth = read('src/trunk/AuthSheetV13.tsx');
    // le bouton de création dépend du consentement…
    expect(auth).toMatch(/canSubmit\s*=\s*!busy[^;]*consent/);
    // …et la soumission le revérifie (pas seulement l'état visuel)
    expect(auth).toMatch(/mode === 'signup' && \(!nameOk \|\| !consent\)/);
    // une case à cocher existe réellement
    expect(auth).toMatch(/type="checkbox"/);
  });

  it('la feuille légale couvre confidentialité, conditions, mentions et droits', () => {
    const legal = read('src/trunk/LegalSheetV13.tsx');
    for (const id of ['confidentialite', 'conditions', 'mentions', 'supprimer']) {
      expect(legal).toContain(`id: '${id}'`);
    }
    // attribution OSM (licence ODbL) présente dans les mentions
    expect(legal).toMatch(/OpenStreetMap/i);
    // un contact pour exercer les droits est publié
    expect(legal).toMatch(/LEGAL_CONTACT\s*=\s*'[^']+@[^']+'/);
  });

  it('la feuille légale est montée et atteignable sans compte', () => {
    const app = read('src/trunk/TrunkAppV13.tsx');
    expect(app).toMatch(/<LegalSheetV13/);
    expect(app).toMatch(/'legal'/);
    // l'entrée menu n'est PAS dans le bloc `sessionUser &&` : la confidentialité
    // n'est pas réservée aux inscrits.
    const menuIdx = app.indexOf('Informations légales');
    expect(menuIdx).toBeGreaterThan(0);
    const sessionBlock = app.indexOf('{sessionUser && (', app.indexOf('data-sheet="menu"'));
    expect(menuIdx).toBeLessThan(sessionBlock);
  });

  it('l\'ancienne surface morte `OnboardV13` ne revient pas', () => {
    expect(existsSync(resolve(root, 'src/trunk/OnboardV13.tsx'))).toBe(false);
    const app = read('src/trunk/TrunkAppV13.tsx');
    expect(app).not.toContain('OnboardV13');
  });
});
