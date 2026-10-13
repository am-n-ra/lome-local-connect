// BRANCHES (2026-10-07) — garde de complétude CSS.
//
// Le fondateur a remarqué deux fois des éléments « sans CSS » (.textbtn 16px, .lead
// absent). Une classe utilisée dans le markup mais définie nulle part rend au défaut
// du navigateur — un défaut silencieux, invisible à la relecture.
//
// Ce garde échoue si une classe de `src/trunk/*.tsx` n'a AUCUNE règle. Il tolère une
// courte liste explicite de classes stylées par leur PARENT (jamais seules) : les
// contrôles de carte héritent de `.map-controls button`.
//
// Falsifiable : ajouter `className="fantome"` quelque part fait échouer le test.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const trunkDir = join(root, 'src', 'trunk');

// Toutes les feuilles de l'app (ui-v13, v3, styles.css globale) : une classe peut
// être définie dans n'importe laquelle — n'en lire qu'une produirait de faux orphelins.
function allCss(dir: string): string {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return allCss(full);
    return entry.name.endsWith('.css') ? [readFileSync(full, 'utf8')] : [];
  }).join('\n');
}
const CSS = allCss(join(root, 'src'));

const defined = new Set([...CSS.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1]));

// Classes volontairement stylées par leur parent, jamais seules.
const PARENT_COVERED = new Set(['zoom-in-control', 'zoom-out-control']);

function usedClasses(): Map<string, string[]> {
  const used = new Map<string, string[]>();
  for (const file of readdirSync(trunkDir)) {
    if (!file.endsWith('.tsx') || file.includes('.test.')) continue;
    const source = readFileSync(join(trunkDir, file), 'utf8');
    const add = (token: string) => {
      if (!token || token.includes('${')) return;
      const list = used.get(token) ?? [];
      if (!list.includes(file)) list.push(file);
      used.set(token, list);
    };
    for (const m of source.matchAll(/className="([^"]+)"/g)) m[1].split(/\s+/).forEach(add);
    for (const m of source.matchAll(/className=\{`([^`]+)`\}/g)) {
      m[1].replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).forEach(add);
    }
  }
  return used;
}

describe('complétude CSS', () => {
  it('chaque classe du markup a une règle (ou est stylée par son parent)', () => {
    const orphans = [...usedClasses().entries()]
      .filter(([token]) => !defined.has(token) && !PARENT_COVERED.has(token))
      .map(([token, files]) => `${token} (${files.join(', ')})`);
    expect(orphans, `classes sans règle CSS:\n${orphans.join('\n')}`).toEqual([]);
  });
});
