import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * TF-5 / D-SIG-2 + D-SIG-5 — deux invariants qui doivent survivre à toute
 * tranche future :
 *   1. L'intégrité S-32 reste AUTOMATIQUE et dérivée : aucun signalement ne
 *      peut la faire bouger en silence. `offer-existence.ts` ne connaît donc
 *      ni les signalements ni la modération.
 *   2. Le vendeur visé est aveugle : la création d'un signalement ne lit
 *      jamais l'identité du vendeur (ni facilité, ni contact, ni compte
 *      vendeur) — seul le produit publié compte, et le rapporteur lui-même
 *      pour l'audit.
 *   3. La sheet `signal` ne propose que les 3 motifs maquette (le texte libre
 *      ne devient jamais un motif) ; la décision équipe exige un motif écrit.
 *
 * Gardes de source : ces invariants sont des ABSENCES (pas de jointure, pas de
 * lecture). Un test d'exécution ne les verrait pas — seul le source les montre.
 */
const repo = readFileSync(new URL('../server/trunk-repository.ts', import.meta.url), 'utf8');
const integrity = readFileSync(new URL('./offer-existence.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('./TrunkAppV13.tsx', import.meta.url), 'utf8');
const admin = readFileSync(new URL('./AdminV13.tsx', import.meta.url), 'utf8');

function methodBlock(source: string, signature: string): string {
  const start = source.indexOf(signature);
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf('async ', start + signature.length);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('TF-5 — les signalements ne touchent ni S-32 ni le vendeur', () => {
  it('D-SIG-2 : l’intégrité S-32 ne connaît ni signalement ni modération', () => {
    expect(integrity).not.toContain('report');
    expect(integrity).not.toContain('signalement');
    expect(integrity).not.toContain('moderation');
  });

  it('D-SIG-5 : créer un signalement ne lit jamais le vendeur', () => {
    const block = methodBlock(repo, 'async createOfferReport(');
    expect(block).toContain('v2_offer_reports');
    expect(block).not.toContain('v2_facilities');
    expect(block).not.toContain('contact');
    expect(block).not.toContain('seller');
  });

  it('la sheet signal ne propose que les 3 motifs maquette', () => {
    expect(app).toContain("'prix_trompeur', 'Prix trompeur'");
    expect(app).toContain("'visuel_non_conforme', 'Visuel ne correspond pas'");
    expect(app).toContain("'indisponible', 'Indisponible en réalité'");
  });

  it('la décision équipe exige un motif écrit avant tout appel', () => {
    expect(admin).toContain('Motivez la décision (3 lettres minimum)');
  });
});
