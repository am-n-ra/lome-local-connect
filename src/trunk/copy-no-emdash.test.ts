import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * Copy style — aucune tiret cadratin (—, U+2014) ni demi-cadratin (–, U+2013) dans
 * le TEXTE VISIBLE PAR L'UTILISATEUR.
 *
 * Ce garde ne regarde QUE les chaînes destinées à l'écran : littéraux de chaîne,
 * gabarits, texte JSX. Les commentaires de code (développeur) sont hors périmètre —
 * on les distingue par l'AST TypeScript, pas par une regex (une regex se trompe sur
 * `https://…` ou sur un `//` dans une chaîne).
 *
 * Un tiret cadratin est un signe de rédaction automatique : dans une interface qui
 * s'adresse à de vrais utilisateurs, on écrit une phrase (deux-points, virgule,
 * parenthèses, ou un tiret simple « - »), pas un tiret long.
 */
const SRC = resolve(process.cwd(), 'src');
const DASH = /[\u2014\u2013]/;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(ts|tsx|css)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });
}

type Hit = { file: string; line: number; text: string };

function scanFile(file: string): Hit[] {
  const hits: Hit[] = [];
  const text = readFileSync(file, 'utf8');
  const rel = relative(process.cwd(), file);

  if (file.endsWith('.css')) {
    // Seul `content: "…"` produit du texte visible ; on n'y regarde que les valeurs
    // entre guillemets d'une déclaration `content`, jamais les commentaires.
    const re = /content\s*:\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (DASH.test(m[2])) hits.push({ file: rel, line: text.slice(0, m.index).split('\n').length, text: m[2] });
    }
    return hits;
  }

  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const record = (node: ts.Node, value: string) => {
    if (DASH.test(value)) {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      hits.push({ file: rel, line: line + 1, text: value.trim().slice(0, 120) });
    }
  };
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      record(node, node.text);
    } else if (ts.isTemplateExpression(node)) {
      // Un gabarit avec `${…}` n'est pas un NoSubstitutionTemplateLiteral : ses
      // morceaux littéraux (head + spans) portent aussi du texte visible. On retire
      // les commentaires SQL `-- …` (les requêtes sont du code, pas de la copie).
      const clean = (t: string) => t.replace(/(^|\s)--[^\n]*/g, ' ');
      record(node, clean(node.head.text));
      for (const span of node.templateSpans) record(node, clean(span.literal.text));
    } else if (ts.isJsxText(node)) {
      record(node, node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

describe('Copy — aucun tiret cadratin dans le texte visible', () => {
  it('aucune chaîne/JSX de src/ (hors tests) ne contient — ou –', () => {
    const hits = walk(SRC).flatMap(scanFile);
    const report = hits.map((h) => `${h.file}:${h.line}  « ${h.text} »`);
    expect(report).toEqual([]);
  });

  it('aucun fichier servi à l’utilisateur ne contient — ou –', () => {
    // Titres, manifeste PWA, page hors-ligne, métadonnées : lus par l'utilisateur,
    // donc soumis à la même règle que le texte de l'interface.
    const served = [
      'index.html',
      'metadata.json',
      'public/manifest.webmanifest',
      'public/offline.html',
      'public/omni-local-style.json',
    ];
    const offenders = served
      .map((f) => resolve(process.cwd(), f))
      .filter((f) => DASH.test(readFileSync(f, 'utf8')))
      .map((f) => relative(process.cwd(), f));
    expect(offenders).toEqual([]);
  });

  it('le garde sait échouer (auto-falsification)', () => {
    expect(DASH.test('Dossier pris — à vous de constater.')).toBe(true);
    expect(DASH.test('Dossier pris : à vous de constater.')).toBe(false);
    expect(DASH.test('un simple - tiret')).toBe(false);
  });
});
