import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AUTH-CREATE — régression réelle (2026-10-07, signal fondateur : « auth ne permet
 * pas de créer compte »).
 *
 * Mesuré en navigateur : le menu promettait « Créer un compte / se connecter » mais
 * ouvrait l'écran `auth`, qui n'offrait QUE « Se connecter ». Aucun chemin vers la
 * création de compte n'était exposé — `OnboardV13` (la seule surface de création)
 * n'était atteignable que par un chemin mort (`resumePendingAction(false)`, appelé
 * nulle part). Un nouvel utilisateur ne pouvait donc PAS créer de compte.
 * (`OnboardV13` a depuis été retiré : sa fonction vit dans la surface partagée
 * `AuthSheetV13`, et laisser une surface morte violerait « no orphaned layers ».)
 *
 * Ce garde verrouille la source : le geste « Créer un compte » ouvre l'écran en mode
 * création, une action gardée ouvre le mode connexion, et l'écran partagé adopte
 * vraiment la session (rôles/capacités), pas un `setSheet('menu')` sec.
 */
const APP = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');
const SHEET = readFileSync(resolve(__dirname, 'AuthSheetV13.tsx'), 'utf8');

describe('AUTH-CREATE — l\'écran auth permet réellement de créer un compte', () => {
  it('le bouton « Créer un compte » ouvre l\'écran en mode création', () => {
    expect(APP).toMatch(/setAuthMode\('signup'\);\s*setSheet\('auth'\)[\s\S]{0,140}Créer un compte \/ se connecter/);
  });

  it('une action gardée ouvre l\'écran en mode connexion (pas création)', () => {
    expect(APP).toMatch(/setAuthMode\('signin'\);\s*setSheet\('auth'\)/);
  });

  it('l\'écran auth est la surface PARTAGÉE (AuthSheetV13), plus un formulaire connexion-seule inline', () => {
    expect(APP).toContain('<AuthSheetV13');
    expect(APP).toContain('initialMode={authMode}');
    // l'ancien formulaire inline ne doit pas revenir
    expect(APP).not.toMatch(/data-sheet="auth"[\s\S]{0,400}signIn\.email\(\{ email, password \}\)/);
  });

  it('la création de compte appelle la VRAIE API Neon (signUp.email), sans OTP simulé', () => {
    expect(SHEET).toContain('authClient.signUp.email(');
    expect(SHEET).not.toMatch(/code à 4 chiffres/i);
  });

  it('un compte créé/connecté ADOPTE la session (capacités), jamais un menu sec', () => {
    expect(APP).toMatch(/onAuthenticated=\{async \(user, created\) => \{[\s\S]{0,140}await adoptSession\(user\)/);
    const start = APP.indexOf('const adoptSession = useCallback');
    const body = APP.slice(start, APP.indexOf('const activateBuyerProUI', start));
    expect(body).toContain('getAccountCapabilities({ token })');
    expect(body).toContain('setAccountRoles');
  });
});
