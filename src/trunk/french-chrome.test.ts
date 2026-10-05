import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * UI-6 — le chrome est en français.
 *
 * La maquette (autorité) nomme les rôles en FR : `Acheteur/Vendeur/Opérateur/Admin`
 * et le palier gratuit `Gratuit` (« Pro » reste, c'est un nom de gamme). La décision
 * fondateur est « UI en français ». L'app avait divergé (`Buyer`, `Seller`, `Free`,
 * `Opérateur` abrégé en `Opé.`).
 *
 * Le garde ne juge que le **texte affiché** : une chaîne littérale ou du texte JSX.
 * Un identifiant (`SellerCatalogue`) ou un commentaire (`// Espace Seller`) n'est
 * pas du texte rendu et ne doit pas faire échouer.
 */
const TRUNK = resolve(process.cwd(), 'src/trunk');
const EN = /\b(Buyer|Seller|Free)\b/;
// Chaînes '...' / "..." / `...` d'UNE SEULE LIGNE qui portent un mot anglais isolé.
const QUOTED = /(['"`])(?:[^'"`\\\n]|\\.)*?\b(Buyer|Seller|Free)\b(?:[^'"`\\\n]|\\.)*?\1/g;
// Texte JSX : entre > et < sur une même ligne, hors accolades d'expression.
const JSX_TEXT = />([^<>{}\n]*\b(Buyer|Seller|Free)\b[^<>{}\n]*)</g;

function offenders(source: string): string[] {
  const hits: string[] = [];
  for (const line of source.split('\n')) {
    for (const m of line.matchAll(QUOTED)) hits.push(m[0].slice(0, 40));
    for (const m of line.matchAll(JSX_TEXT)) hits.push(`>${m[1].trim().slice(0, 40)}<`);
  }
  return hits;
}

describe('UI-6 — chrome en français', () => {
  it('aucun mot anglais isolé dans le texte rendu', () => {
    const found = readdirSync(TRUNK)
      .filter((f) => f.endsWith('.tsx') && !f.includes('.test.'))
      .flatMap((f) => offenders(readFileSync(resolve(TRUNK, f), 'utf8')).map((h) => `${f}: ${h}`));
    expect(found).toEqual([]);
  });

  it('le garde sait échouer et ne mord pas les identifiants', () => {
    expect(offenders(`<b>Buyer</b>`).length).toBe(1);
    expect(offenders(`const x = 'Seller Free';`).length).toBe(1);
    expect(offenders(`aria-label="Free"`).length).toBe(1);
    // Pas de faux positif :
    expect(offenders(`const { SellerCatalogue } = require('./x');`)).toEqual([]);
    expect(offenders(`// Espace Seller map-first`)).toEqual([]);
    expect(offenders(`const role = 'seller';`)).toEqual([]);
    expect(offenders(`setSheet('seller')`)).toEqual([]);
  });

  it('l’expression régulière elle-même reste bornée', () => {
    expect('SellerCatalogue'.match(EN)).toBeNull();
    expect('getSellerQueue'.match(EN)).toBeNull();
    expect('Seller'.match(EN)).not.toBeNull();
  });
});
