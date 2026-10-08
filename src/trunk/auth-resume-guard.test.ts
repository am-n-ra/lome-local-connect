import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AUTH-RESUME — régression réelle (2026-10-07, spot-check sign-in).
 *
 * Mesuré en navigateur : cliquer « Comparer » sans être connecté ouvre l'écran de
 * connexion ; APRÈS login, l'utilisateur atterrissait sur le MENU et devait refaire
 * sa recherche et recliquer. L'action gardée était PERDUE.
 *
 * Cause : `requireAuth()` ouvrait l'écran de connexion SANS mémoriser l'action, et
 * `gateRequest()` (le seul à mémoriser) n'était câblé que sur `BuyerFlowV13`. Les
 * 39 autres sites gardés ne reprenaient rien.
 *
 * Ce garde verrouille la source : les actions gardées déclarent leur identité, et
 * l'écran de connexion comme l'onboarding passent par le MÊME chemin de reprise.
 */
const APP = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');

describe('AUTH-RESUME — une action gardée est reprise après connexion', () => {
  it('`requireAuth` accepte une action à reprendre et la mémorise', () => {
    expect(APP).toMatch(/requireAuth = useCallback\(async \(resume\?: PendingAction\)/);
    expect(APP).toMatch(/if \(resume\) setPendingAction\(resume\);\s*setSheet\('auth'\)/);
  });

  it('comparer et dispo groupée déclarent leurs intentions', () => {
    expect(APP).toContain("requireAuth({ kind: 'compare', returnTo: 'compare' })");
    expect(APP).toContain("requireAuth({ kind: 'bulk', returnTo: 'bulk' })");
  });

  it('l\'écran de connexion reprend l\'action au lieu de tomber sur le menu', () => {
    // Le login connecté adopte la session PUIS reprend — jamais un `setSheet("menu")` sec.
    expect(APP).toMatch(/await resumePendingAction\(\);/);
    expect(APP).not.toMatch(/setAuthToken\(await getAuthToken\(\)\);\s*\n\s*if \(pendingAction\) \{ setSheet\('onboard'\); \} else \{ setSheet\("menu"\); \}/);
  });

  it('l\'onboarding et la connexion partagent le même chemin de reprise', () => {
    expect(APP).toMatch(/onComplete=\{\(\) => \{ void resumePendingAction\(\); \}\}/);
  });

  it('la reprise route vers la feuille demandée (compare/bulk fournies)', () => {
    expect(APP).toMatch(/case 'compare': await openCompare\(\); return;/);
    expect(APP).toMatch(/case 'bulk': await openBulk\(\); return;/);
  });
});
