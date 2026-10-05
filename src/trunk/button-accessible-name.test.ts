import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * UI-3 — un bouton icône-seule doit porter un nom accessible (`aria-label`,
 * `title`) ou du texte. Un glyphe Lucide décrit l'intention visuellement mais
 * ne donne aucun nom au lecteur d'écran (« bouton », sans plus).
 *
 * Un bouton est « icône-seule » quand son contenu, après retrait des composants
 * auto-fermants et des `<svg>`, ne laisse NI texte NI expression `{…}` (qui
 * pourrait être du texte dynamique comme `{lang.catalogue}`).
 */
const TRUNK = resolve(process.cwd(), 'src/trunk');
const BUTTON = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;

function iconOnlyButtons(source: string): number[] {
  const lines: number[] = [];
  for (const m of source.matchAll(BUTTON)) {
    const attrs = m[1];
    if (/aria-label|title/.test(attrs)) continue;
    let inner = m[2].replace(/<svg[\s\S]*?<\/svg>/g, '');
    inner = inner.replace(/<[A-Za-z][^>]*?\/>/g, '');
    if (inner.includes('{')) continue; // dynamic text — not provably icon-only
    if (inner.replace(/\s+/g, '') !== '') continue; // has text
    lines.push(source.slice(0, m.index).split('\n').length);
  }
  return lines;
}

describe('UI-3 — pas de bouton icône-seule sans nom accessible', () => {
  it('aucun bouton icône-seule non nommé dans src/trunk', () => {
    const offenders = readdirSync(TRUNK)
      .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
      .flatMap((f) => iconOnlyButtons(readFileSync(resolve(TRUNK, f), 'utf8')).map((l) => `${f}:${l}`));
    expect(offenders).toEqual([]);
  });

  it('le garde sait échouer (auto-falsification)', () => {
    expect(iconOnlyButtons('<button onClick={x}><ArrowLeft size={15} /></button>')).toEqual([1]);
    expect(iconOnlyButtons('<button aria-label="Fermer" onClick={x}><ArrowLeft size={15} /></button>')).toEqual([]);
    expect(iconOnlyButtons('<button onClick={x}><ScanLine size={14} /> {lang.scan}</button>')).toEqual([]);
    expect(iconOnlyButtons('<button onClick={x}>{lang.catalogue}</button>')).toEqual([]);
  });
});
