import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * TF-6 / D-OPS — l'opérateur constate, ne décide jamais.
 *   1. D-OPS-3 : aucun chemin visite ne touche un badge (ni trust_state, ni
 *      commercial_plan, ni les portes de revue/publication).
 *   2. D-OPS-2 : la transmission exige photos scope `visit` + position finie,
 *      au dépôt ET au validateur (pas seulement côté client).
 *   3. La tournée dit à l'opérateur où s'arrête son pouvoir (l'admin décide).
 *
 * Gardes de source : ce sont des ABSENCES et des présences verrouillées.
 */
const repo = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');
const http = readFileSync(new URL('../server/http.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');
const storage = readFileSync(new URL('../server/evidence-storage.ts', import.meta.url), 'utf8');

function methodBlock(source: string, signature: string): string {
  const start = source.indexOf(signature);
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf('async ', start + signature.length);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('TF-6 — la tournée constate, ne décide jamais', () => {
  it('D-OPS-3 : aucun chemin visite ne touche un badge ni une porte de décision', () => {
    for (const signature of ['async createFieldVisit(', 'async claimVisit(', 'async submitVisitReport(', 'async reprogramVisit(']) {
      const block = methodBlock(repo, signature);
      expect(block).not.toContain('trust_state');
      expect(block).not.toContain('commercial_plan');
      expect(block).not.toContain('reviewFacilityClaim');
      expect(block).not.toContain('transitionSellerProduct');
    }
  });

  it('D-OPS-2 : preuves bloquantes au dépôt et au validateur', () => {
    const block = methodBlock(repo, 'async submitVisitReport(');
    expect(block).toContain('PHOTOS_REQUIRED');
    expect(block).toContain('PHOTO_NOT_BOUND');
    expect(block).toContain('POSITION_REQUIRED');
    expect(http).toContain('One to four visit photo references are required.');
    expect(http).toContain('A finite recorded position is required.');
  });

  it('D-OPS-6 : photos visite liées au scope visit, jamais ailleurs', () => {
    expect(storage).toContain('visits/${input.visitId}/photo/');
    expect(storage).toContain('visits/${payload.visitId}/photo/');
    const block = methodBlock(repo, 'async submitVisitReport(');
    expect(block).toContain('visits/${input.visitId}/photo/');
  });

  it('la tournée dit que l’admin décide du badge final', () => {
    expect(app).toContain('Transmettre à l’admin');
    expect(app).toContain('l’admin décide du badge final');
  });
});
