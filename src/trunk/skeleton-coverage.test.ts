import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * SKELETON COVERAGE — une surface de contenu en chargement montre une FORME,
 * pas un mot. Ce garde échoue si un `<p>` (ou un titre) réintroduit un libellé de
 * chargement à la place d'un squelette.
 *
 * Restent légitimes (et donc exclus) : les libellés d'ACTION dans un bouton
 * (« Vérification… » d'un submit), le statut carte (`.map-status`, `aria-live`),
 * et le fallback `Suspense` (chargement d'un chunk, pas d'un contenu de liste).
 */
const TRUNK = resolve(process.cwd(), 'src/trunk');

function tsxSources(): { file: string; source: string }[] {
  return readdirSync(TRUNK)
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx') && f !== 'Skeleton.tsx')
    .map((f) => ({ file: f, source: readFileSync(resolve(TRUNK, f), 'utf8') }));
}

// `<p ...>Chargement…</p>` / `<p ...>Chargement de …</p>` — le motif interdit.
const BARE_LOADING_PARAGRAPH = /<p\b[^>]*>\s*(?:Chargement|Vérification|Recherche en cours)[^<]*<\/p>/;

describe('SKELETON COVERAGE — pas de « Chargement… » en texte sur une surface de contenu', () => {
  it('aucun paragraphe de chargement brut ne subsiste dans src/trunk', () => {
    const offenders = tsxSources()
      .filter(({ source }) => BARE_LOADING_PARAGRAPH.test(source))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('le garde sait échouer (auto-falsification sur un cas connu)', () => {
    // Un extrait réel de l'ancien comportement doit matcher — sinon le garde est mort.
    expect(BARE_LOADING_PARAGRAPH.test('<p className="sub" role="status">Chargement des facilités…</p>')).toBe(true);
    expect(BARE_LOADING_PARAGRAPH.test('<p className="sub">Chargement…</p>')).toBe(true);
    // Un squelette et un libellé de bouton ne doivent PAS matcher.
    expect(BARE_LOADING_PARAGRAPH.test('<Skeleton variant="pitem" count={4} />')).toBe(false);
    expect(BARE_LOADING_PARAGRAPH.test('<button>{busy ? \'Vérification…\' : \'Re-vérifier\'}</button>')).toBe(false);
  });
});
