import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// X5 — la preuve sociale de l'onboarding ne doit jamais être un total interne
// flatteur. Elle réutilise la porte de visibilité PUBLIQUE de la carte
// (états de confiance publics). Ce garde échoue si quelqu'un « améliore » le
// compteur en retirant ce filtre (il compterait alors des lieux invisibles).

const repo = readFileSync(new URL('./trunk-repository.ts', import.meta.url), 'utf8');
const http = readFileSync(new URL('./http.ts', import.meta.url), 'utf8');

describe('X5 — le compteur public reste honnête', () => {
  it('expose une lecture getPublicStats', () => {
    expect(repo).toMatch(/async getPublicStats\(\)/);
  });

  it('compte avec la MÊME porte de visibilité publique que la carte', () => {
    const start = repo.indexOf('async getPublicStats()');
    expect(start).toBeGreaterThan(-1);
    const body = repo.slice(start, start + 900);
    expect(body).toContain("coalesce(e.trust_state, f.trust_state) in ('unclaimed', 'unconfirmed', 'confirmed')");
    // honnête : published seulement, jamais un total brut de produits
    expect(body).toContain("p.publication_state = 'published'");
  });

  it('expose la route publique sans session', () => {
    expect(http).toMatch(/pathname === '\/api\/v2\/public\/stats'/);
  });
});
