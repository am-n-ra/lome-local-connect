import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Coherence Heartwood (2026-10-07) : `docs/push-operations.md` décrivait des variables
 * qui N'EXISTENT PAS dans le code (`VITE_VAPID_PUBLIC_KEY`, `PUSH_PROVIDER`). Un fondateur
 * suivant le runbook aurait armé les mauvaises variables et le push serait resté
 * `not-configured` — un échec silencieux. Le runbook doit nommer EXACTEMENT la config
 * que `vapidConfig()` lit.
 *
 * Ce garde lie le document au code : les variables réelles présentes dans le runbook
 * doivent l'être aussi dans `web-push-provider.ts`, et aucune variable fantôme ne doit
 * réapparaître.
 */
const DOC = readFileSync(resolve(__dirname, '../../docs/push-operations.md'), 'utf8');
const PROVIDER = readFileSync(resolve(__dirname, 'web-push-provider.ts'), 'utf8');

/** Les variables citées dans la TABLE de configuration (là où on arme réellement).
 *  Bornée à la table : la note d'avertissement APRÈS la table nomme volontairement les
 *  variables fantômes (« n'existe pas ») et ne doit pas être comptée comme config. */
function configuredVariables(doc: string): string[] {
  const start = doc.indexOf('## Required deployment configuration');
  const section = doc.slice(start, doc.indexOf('## Schema', start));
  const table = section.slice(section.indexOf('|'), section.indexOf('\n>') === -1 ? section.length : section.indexOf('\n>'));
  const names = [...table.matchAll(/`([A-Z][A-Z0-9_]+)`/g)].map((m) => m[1]);
  return [...new Set(names)];
}

describe('docs/push-operations.md ↔ code (pas de variable fantôme)', () => {
  it('la table d\'armement ne cite QUE des variables lues par le code', () => {
    const vars = configuredVariables(DOC);
    expect(vars).toContain('VAPID_PUBLIC_KEY');
    for (const name of vars) {
      expect(PROVIDER, `${name} est citée dans le runbook mais absente du provider`).toContain(name);
    }
  });

  it('les 3 variables réelles sont documentées', () => {
    for (const name of ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']) {
      expect(DOC, `${name} doit figurer dans le runbook`).toContain(name);
      expect(PROVIDER, `${name} doit être lu par le provider`).toContain(name);
    }
  });

  it('avertit explicitement que les variables fantômes n\'existent pas', () => {
    // Le runbook précédent les citait comme si on devait les armer : le document doit
    // désormais dire le contraire, pour qu'un lecteur ne retombe pas dans le piège.
    expect(DOC).toContain('VITE_VAPID_PUBLIC_KEY');
    expect(DOC).toContain('PUSH_PROVIDER');
    expect(DOC).toMatch(/no\s+`VITE_VAPID_PUBLIC_KEY`/i);
  });

  it('la route publique et le drain nommés existent bien', () => {
    expect(DOC).toContain('/api/v2/notifications/push-key');
    expect(PROVIDER).toContain('isWebPushConfigured');
  });
});
