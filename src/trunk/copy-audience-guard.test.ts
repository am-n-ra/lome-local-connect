import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// COPIE — la voix de l'interface s'adresse à l'utilisateur, jamais à l'équipe.
// Directive fondateur (2026-10-07) : « rien ne doit être une copy s'adressant aux
// devs » — pas de nom de fournisseur, pas de protocole, pas d'explication interne
// (« Omni ne vérifie pas ce numéro »), pas de vocabulaire produit interne.
//
// Le garde mesure le texte VISIBLE (chaîne JSX, prop de copie) via l'AST, pas les
// commentaires ni le code. Il est falsifiable (voir auto-falsification en bas).

const SRC = resolve(__dirname);
const DOMAIN = resolve(__dirname, '../domain');

// Fichiers de plomberie sans copie utilisateur (routes, types, helpers d'API).
const SKIP_FILES = new Set(['api.ts', 'types.ts']);

interface Forbidden {
  id: string;
  re: RegExp;
  why: string;
  /** Chaîne exacte tolérée (licence, attribution obligatoire). */
  except?: string;
}

const FORBIDDEN: Forbidden[] = [
  { id: 'provider-neon', re: /\bNeon( Auth)?\b/, why: 'nom du fournisseur d’authentification' },
  { id: 'provider-fedapay', re: /\bFedaPay\b/, why: 'nom du fournisseur de paiement' },
  { id: 'provider-mapbox', re: /\bMapbox\b/, why: 'nom du fournisseur de routage' },
  { id: 'provider-osm', re: /\bOpenStreetMap\b/, why: 'attribution cartographique obligatoire', except: '© OpenStreetMap contributors' },
  { id: 'protocol-webhook', re: /\bwebhook\b/i, why: 'terme de protocole' },
  { id: 'protocol-api', re: /\bAPI\b/, why: 'terme de protocole' },
  { id: 'protocol-json', re: /\bJSON\b/, why: 'format technique' },
  { id: 'team-voice', re: /Omni ne v[ée]rifie pas ce num[ée]ro/i, why: 'explication interne, pas une copie utilisateur' },
  { id: 'internal-ledger', re: /\bLedger\b/, why: 'vocabulaire produit interne' },
  { id: 'internal-transactable', re: /\btransactable\b/i, why: 'vocabulaire produit interne' },
  { id: 'internal-vivante', re: /Disponibilit[ée] vivante/i, why: 'vocabulaire produit interne' },
  { id: 'internal-serveur', re: /c[ôo]t[ée] serveur|Donn[ée]es r[ée]elles serveur|sur ce serveur|filtre serveur/i, why: 'voix d’équipe (infrastructure)' },
  { id: 'internal-socle', re: /\bsocle\b/i, why: 'vocabulaire produit interne' },
  { id: 'english-readonly', re: /Read-only/, why: 'anglais resté dans l’UI' },
  { id: 'english-wallet', re: /\bWallet\b/, why: 'anglais resté dans l’UI' },
  { id: 'english-claims', re: /Claims/, why: 'anglais resté dans l’UI' },
];

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) return listFiles(p);
    if (!/\.(ts|tsx)$/.test(e.name) || /\.test\./.test(e.name) || SKIP_FILES.has(e.name)) return [];
    return [p];
  });
}

/** Texte visible : JSX text, chaînes JSX, props de copie. Ignore code/commentaires. */
function visibleStrings(file: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = [];
  const src = readFileSync(file, 'utf8');
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, kind);
  const record = (node: ts.Node, value: string) => {
    const v = value.replace(/\s+/g, ' ').trim();
    if (v.length < 4) return;
    if (/^(\/|https?:|application\/|text\/)/.test(v)) return; // routes, mime, urls
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    out.push({ line: line + 1, text: v });
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) record(node, node.text);
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      // Tout littéral est candidat : les chaînes de copie vivent aussi dans les
      // ternaires JSX (`{cond ? 'A' : 'B'}`) et les props. Les filtres `record`
      // écartent routes/urls/mime et les jetons d'identifiant courts.
      record(node, node.text);
    } else if (ts.isTemplateExpression(node)) {
      record(node, node.head.text);
      for (const span of node.templateSpans) record(node, span.literal.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

const FILES = [...listFiles(SRC), ...listFiles(DOMAIN)];

function scan(): string[] {
  const hits: string[] = [];
  for (const file of FILES) {
    for (const { line, text } of visibleStrings(file)) {
      for (const f of FORBIDDEN) {
        if (f.except && text.includes(f.except)) continue;
        if (f.re.test(text)) {
          hits.push(`${relative(process.cwd(), file)}:${line} [${f.id}] « ${text.slice(0, 120)} » (${f.why})`);
        }
      }
    }
  }
  return hits;
}

describe('copie — l’interface parle à l’utilisateur, jamais à l’équipe', () => {
  it('aucun texte visible ne contient de voix technique/interne', { timeout: 60000 }, () => {
    expect(scan()).toEqual([]);
  });

  it('le garde sait échouer (auto-falsification)', () => {
    const probe = (text: string) => FORBIDDEN.some((f) => (!f.except || !text.includes(f.except)) && f.re.test(text));
    expect(probe('La connexion Omni (Neon Auth) est active.')).toBe(true);
    expect(probe('Omni ne vérifie pas ce numéro.')).toBe(true);
    expect(probe('Ledger des changements')).toBe(true);
    expect(probe('Re-vérifier les paiements FedaPay en attente')).toBe(true);
    // Ce qui est légitime reste légitime :
    expect(probe('Numéro déclaré · Non vérifié')).toBe(false);
    expect(probe('Continuer le paiement')).toBe(false);
    expect(probe('© OpenStreetMap contributors')).toBe(false);
  });
});
