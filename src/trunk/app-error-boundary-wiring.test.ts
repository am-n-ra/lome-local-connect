import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Une frontière d'erreur jamais montée est une couche ORPHELINE : elle n'existe que si
 * `main.tsx` enveloppe réellement l'app. Contrat verrouillé à la source (le comportement
 * de la frontière elle-même est testé en jsdom dans AppErrorBoundary.test.tsx).
 */
const mainSource = readFileSync(new URL('../main.tsx', import.meta.url), 'utf8');

describe('main.tsx — la reprise de panne est réellement branchée', () => {
  it('monte l’app SOUS AppErrorBoundary', () => {
    const open = mainSource.indexOf('<AppErrorBoundary>');
    const app = mainSource.indexOf('<TrunkAppV13 />');
    const close = mainSource.indexOf('</AppErrorBoundary>');
    expect(open).toBeGreaterThan(-1);
    expect(app).toBeGreaterThan(open);
    expect(close).toBeGreaterThan(app);
  });

  it('journalise les rejets de promesse non gérés', () => {
    expect(mainSource).toContain("addEventListener('unhandledrejection'");
  });
});
