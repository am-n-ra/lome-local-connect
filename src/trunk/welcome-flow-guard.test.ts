import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * WELCOME-FLOW — le parcours post-création ne doit jamais voler une reprise,
 * ni accueillir une simple connexion.
 *
 * Invariants verrouillés (fondateur 2026-10-07 : onboarding immersif MAIS honnête) :
 *  1. `pendingAction` prioritaire : après connexion, on reprend l'action gardée,
 *     JAMAIS le welcome — même si `created` est vrai.
 *  2. `welcome` seulement si `created` (frais signup), jamais à la connexion.
 *  3. Sinon menu. Aucune 4e branche silencieuse.
 */
const APP = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');

function authHandler(): string {
  const start = APP.indexOf('onAuthenticated={async (user, created)');
  expect(start, 'bloc onAuthenticated introuvable').toBeGreaterThan(-1);
  return APP.slice(start, start + 900);
}

describe('WELCOME-FLOW — reprise prioritaire, bienvenue seulement à la création', () => {
  it('reprend l’action gardée avant tout (même si created)', () => {
    const body = authHandler();
    const resumeAt = body.indexOf('resumePendingAction(true)');
    const welcomeAt = body.indexOf("setSheet('welcome')");
    expect(resumeAt).toBeGreaterThan(-1);
    expect(welcomeAt).toBeGreaterThan(-1);
    expect(resumeAt, 'la reprise doit précéder le welcome').toBeLessThan(welcomeAt);
  });

  it('le welcome est gardé par `created`, la connexion tombe sur le menu', () => {
    const body = authHandler();
    expect(body).toMatch(/else if \(created\)/);
    expect(body).toMatch(/setSheet\('welcome'\)/);
    expect(body).toMatch(/setSheet\('menu'\)/);
  });

  it('le choix de rôle du welcome pilote le vrai rôle + le vrai routage', () => {
    expect(APP).toContain("onChooseRole={(next) => {");
    expect(APP).toContain("setRole('seller')");
    expect(APP).toContain('void runSearch(query)');
  });

  it('« Partager Omni » existe au menu et ne partage que URL + nom (zéro PII)', () => {
    expect(APP).toContain('Partager Omni');
    const start = APP.indexOf('const shareOmni = useCallback');
    expect(start, 'shareOmni introuvable').toBeGreaterThan(-1);
    const body = APP.slice(start, start + 4000);
    expect(body).toContain('window.location.origin');
    expect(body).toMatch(/\.share\(/);
    expect(body).toContain('clipboard');
    expect(body, 'le partage ne doit embarquer ni email ni téléphone ni nom').not.toMatch(/sessionUser\??\.(email|phone|name)|user\.email/);
  });
});
