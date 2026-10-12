import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pendingActionResume, type PendingAction } from './ui-helpers';

/**
 * BRANCH-4 — D-05 « frontière d'authentification » (fondateur 2026-10-07).
 *
 * D-05 est explicite : on peut PARCOURIR la carte et taper un pin SANS compte, mais
 * « la recherche, la disponibilité et l'achat exigent un compte », et « la requête est
 * préservée à travers l'authentification et l'onboarding ». Avant cette tranche,
 * `handleSubmitSearch` lançait la requête sans jamais demander de compte : n'importe qui
 * pouvait lancer des demandes Omni sans identité. Ce garde verrouille le contrat.
 */
const APP = readFileSync(resolve(__dirname, 'TrunkAppV13.tsx'), 'utf8');

function submitBody(): string {
  const start = APP.indexOf('const handleSubmitSearch');
  return APP.slice(start, APP.indexOf('runEntitySearch', start));
}

describe('BRANCH-4 — la recherche exige un compte, la requête survit (D-05)', () => {
  it('soumettre une recherche SANS compte retient la requête et ouvre l\'authentification', () => {
    const body = submitBody();
    expect(body).toContain("if (!sessionUser)");
    expect(body).toMatch(/setPendingAction\(\{ kind: 'search', returnTo: 'search', query: trimmed, level: searchLevel \}\)/);
    expect(body).toMatch(/setSheet\('auth'\)/);
  });

  it('la requête retenue est relancée APRÈS connexion (pas seulement la feuille de recherche)', () => {
    const start = APP.indexOf('const resumePendingAction');
    const body = APP.slice(start, APP.indexOf('const openDossier', start));
    expect(body).toMatch(/case 'search':/);
    expect(body).toContain('resume.query');
    expect(body).toMatch(/void runSearch\(resume\.query, currentSearchOptions\(\)\)/);
    expect(body).toMatch(/void runEntitySearch\(resume\.query\)/);
  });

  it('la reprise conserve le niveau (offre vs entité)', () => {
    const offer: PendingAction = { kind: 'search', returnTo: 'search', query: 'boulangerie', level: 'offer' };
    const entity: PendingAction = { kind: 'search', returnTo: 'search', query: 'Afi', level: 'entity' };
    expect(pendingActionResume(offer)).toEqual({ sheet: 'search', query: 'boulangerie', level: 'offer' });
    expect(pendingActionResume(entity)).toEqual({ sheet: 'search', query: 'Afi', level: 'entity' });
  });

  it('parcourir la carte et taper un pin reste LIBRE (D-05 : aucune connexion demandée)', () => {
    const start = APP.indexOf('const handlePinSelect');
    const body = APP.slice(start, APP.indexOf('const handleQrDetected', start));
    expect(body).not.toContain('sessionUser');
    expect(body).not.toContain("setSheet('auth')");
  });
});
